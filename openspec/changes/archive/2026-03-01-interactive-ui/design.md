## Context

The bot currently exposes ~11 text commands requiring users to know exact names and IDs. This is fine for power users but creates friction when managing multiple simultaneous AI tasks — the primary use case. The interactive UI layer adds a navigation system on top of the existing command layer using Telegraf's `InlineKeyboardMarkup` and callback queries.

All existing commands stay intact. The new UI is an additional access path, not a replacement.

### Interaction model overview

```
/start
  └── [Main Menu]
        ├── [AI Tasks] ──────────────────────── Task Dashboard
        │     ├── [+ New Task] ─────────────── Creation Wizard
        │     │     ├── Step 1: Pick Workspace (buttons)
        │     │     ├── Step 2: Pick Template  (buttons)
        │     │     ├── Step 3: Pick Preset    (buttons)
        │     │     └── Step 4: Enter Prompt   (free text)
        │     └── [task: foo] ─────────────── Task Action Menu
        │           ├── [📋 Logs]
        │           ├── [✏️ Append]  ────────── Prompt input
        │           └── [🗑 Delete]
        │
        ├── [Workspaces] ────────────────────── Workspace List
        │     └── [ws: myworkspace] ─────────── Workspace Action Menu
        │           ├── [▶️ Start]
        │           └── [⏹ Stop]
        │
        └── [Templates] ─────────────────────── Template List
              └── [tpl: my-template] ────────── Preset List (read-only)
```

## Goals / Non-Goals

**Goals:**
- Main menu as the primary entry point, navigable entirely via buttons
- Task dashboard showing all tasks across all workspaces with live status and action buttons
- Wizard-style task creation with step-by-step inline selection
- Per-task action menu (Logs, Append, Delete) accessible from the dashboard
- Per-workspace action menu (Start, Stop)
- In-memory UI state per chat (wizard step, selections)
- All existing text commands remain functional

**Non-Goals:**
- Persistent UI state across restarts (in-memory only)
- Pagination for very large lists (show up to 20 items, note total)
- Real-time auto-refresh of dashboard (user triggers refresh manually)
- Multi-user concurrent wizard sessions in a single group chat (personal bot assumption)

## Decisions

**Decision: Callback data encoding**
Use colon-separated strings: `action:payload` (e.g., `menu:tasks`, `ws:myworkspace:start`, `task:abc123:logs`, `wizard:template:my-template`). Keep under Telegram's 64-byte callback data limit by truncating names where needed; full resolution happens via the UI state store.

**Decision: UI state store (`src/ui/state.ts`)**
A `Map<chatId, UiState>` where `UiState` holds the current wizard step and selected values (`{ step, workspaceName, templateName, presetName }`). Separate from the task session store in `task-webhook-notifications`. Wizard state is cleared on completion, cancellation, or any non-wizard interaction.

**Decision: Message editing vs. new messages**
For navigation (menu → submenu → back), edit the existing message in place using `ctx.editMessageText` to avoid chat clutter. For task completion notifications and logs (which need to persist for reference), send new messages. For wizard steps, send new messages (each step builds context the user reads).

**Decision: Task dashboard queries all workspaces**
The dashboard calls `listWorkspaces()` then `listTasks(workspace)` for each. This is a sequential API fan-out. For small numbers of workspaces (typical personal Coder use), this is acceptable. Each task is shown as a button row: `[📌 task-name (status)] [Logs] [✏️] [🗑]`.

**Decision: Wizard cancellation**
Any wizard step has a `[✕ Cancel]` button that clears UI state and returns to the main menu. If the user sends a text command during a wizard (e.g., `/workspaces`), the wizard is implicitly cancelled and the command runs normally.

**Decision: Append flow from Task Action Menu**
Clicking `[✏️ Append]` in the task action menu sets `pendingAppend` in the UI state store (reusing the pattern from `task-webhook-notifications`). The next text message from that chat is treated as the prompt. A timeout is NOT implemented — the pending state clears on any button press or `/cancel`.

## Risks / Trade-offs

- **Callback data 64-byte limit** → Workspace/template names longer than ~40 chars get truncated in callback data; UI state resolves the full value. Mitigation: use short stable IDs (workspace name) rather than display names in callbacks.
- **Stale task dashboard** → Tasks may complete between renders. The dashboard has a `[🔄 Refresh]` button; there is no auto-refresh. Mitigation: webhook notifications already handle completion proactively.
- **Deep navigation history not tracked** → "Back" buttons return to a fixed parent, not a full navigation stack. Acceptable for the shallow depth of this UI.
- **Fan-out API calls for dashboard** → If a user has many workspaces, the dashboard load will be slow. Mitigation: show workspaces and tasks fetched so far; add a note if fetch takes >2s (not implemented — accepted risk for now).
