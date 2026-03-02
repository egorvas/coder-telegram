## Why

There is currently no way to pause a running AI task or resume a paused one from the Telegram bot. Users must go to the Coder web UI to control task execution, which breaks the "manage everything from Telegram" workflow. The Coder API provides `POST /tasks/me/{id}/pause` and `POST /tasks/me/{id}/resume` endpoints that make this trivial to expose.

## What Changes

- Add `⏸ Pause` button to the task submenu when task status is `active` (or `initializing`)
- Add `▶️ Resume` button to the task submenu when task status is `paused`
- The buttons are mutually exclusive — only the relevant one is shown based on current status
- The task detail view already shows status; it will continue to reflect `paused` / `active` correctly
- Add `pauseTask(id)` and `resumeTask(id)` methods to `CoderClient`

## Capabilities

### New Capabilities
- `task-pause-resume`: Pausing and resuming AI tasks from the Telegram bot

### Modified Capabilities
- `task-dashboard`: Task submenu now includes context-sensitive pause/resume button

## Impact

- `src/coder/client.ts` — two new methods
- `src/ui/keyboards.ts` — `taskMenuKeyboard` accepts optional `status` to show pause or resume button
- `src/ui/handlers/task-dashboard.ts` — two new action handlers; all `taskMenuKeyboard` call sites that have the task object pass `task.status`
