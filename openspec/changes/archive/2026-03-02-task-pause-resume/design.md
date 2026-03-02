## Context

The Coder API exposes:
- `POST /api/v2/tasks/me/{id}/pause` → 202 Accepted
- `POST /api/v2/tasks/me/{id}/resume` → 202 Accepted

Task statuses relevant to this feature: `active`, `initializing` → show Pause; `paused` → show Resume; all other statuses (`pending`, `error`, `unknown`) → show neither.

`taskMenuKeyboard(taskId)` currently has no knowledge of task status — it renders the same buttons always. All call sites that have the task object (`task:select`, `task:logs`, `task:fulllog`, `notifyTaskComplete`) can pass `task.status`.

## Goals / Non-Goals

**Goals:**
- Show a context-sensitive ⏸/▶️ button in the task submenu
- Call the correct Coder API endpoint when tapped
- Refresh the submenu keyboard after success to reflect the new state

**Non-Goals:**
- Polling / auto-refreshing status in real-time
- Showing pause/resume on the task list keyboard
- Handling the case where pause/resume fails with a specific error (generic error reply is sufficient)

## Decisions

### 1. Pass `status?: string` to `taskMenuKeyboard`
Add an optional second parameter. When provided: show `⏸ Pause` if status is `active` or `initializing`, show `▶️ Resume` if status is `paused`, show nothing otherwise.
**Why**: minimal change, no new state, backward-compatible (existing callers without status work as before — no pause/resume button shown, which is acceptable for edge cases like pending-append replies).

### 2. After pause/resume: re-fetch task and edit message
Call `coderClient.getTask(taskId)` after the action, then `ctx.editMessageText(...)` with updated status and updated keyboard. This gives the user immediate visual feedback without a separate "Refresh" tap.
**Why**: the Coder API is asynchronous (202), so the status may not have changed instantly, but re-fetching gives the best available state.

### 3. Keyboard row layout
Add the pause/resume button on its own row between the two existing action rows:
```
[📋 Logs] [📄 Full Log]
[✏️ Append] [🧠 Model] [🗑 Delete]
[⏸ Pause]  ← or [▶️ Resume]
[🌐 Open in Coder]
[« Tasks]
```

## Risks / Trade-offs

- [Stale status] The task status shown in the submenu may be stale if the task progresses between taps. → Mitigated by re-fetching after pause/resume; user can also tap the task again from the list to refresh.
- [API 202] The pause/resume is accepted asynchronously; the status in the re-fetch may still show the old value for a moment. → Acceptable UX trade-off; no polling introduced.
