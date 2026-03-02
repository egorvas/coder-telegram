## 1. API client

- [x] 1.1 In `src/coder/client.ts`, add `pauseTask(taskId: string): Promise<void>` — `POST /api/v2/tasks/me/${taskId}/pause`
- [x] 1.2 In `src/coder/client.ts`, add `resumeTask(taskId: string): Promise<void>` — `POST /api/v2/tasks/me/${taskId}/resume`

## 2. Keyboard

- [x] 2.1 In `src/ui/keyboards.ts`, update `taskMenuKeyboard(taskId, status?)` to accept optional `status: string` and insert a pause/resume row: show `⏸ Pause` (`task:pause:<id>`) if status is `active` or `initializing`, show `▶️ Resume` (`task:resume:<id>`) if status is `paused`, otherwise omit the row

## 3. Handlers

- [x] 3.1 In `src/ui/handlers/task-dashboard.ts`, add `task:pause:<id>` handler: call `pauseTask`, re-fetch task, edit the message text+keyboard with updated status
- [x] 3.2 In `src/ui/handlers/task-dashboard.ts`, add `task:resume:<id>` handler: call `resumeTask`, re-fetch task, edit the message text+keyboard with updated status

## 4. Pass status to keyboard

- [x] 4.1 In `task:select` handler: pass `task.status` to `taskMenuKeyboard`
- [x] 4.2 In `task:pause` and `task:resume` handlers: pass `task.status` to `taskMenuKeyboard` (covered by 3.1/3.2)
