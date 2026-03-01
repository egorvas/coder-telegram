## 1. Coder Task API Types

- [x] 1.1 Add TypeScript types to `src/coder/types.ts`: `CoderTask`, `CoderTaskLog`, `CreateTaskParams`

## 2. Coder Task API Client Methods

- [x] 2.1 Add `listTasks(workspaceName: string)` method to `CoderClient` — GET workspace tasks endpoint
- [x] 2.2 Add `createTask(workspaceName: string, template: string, prompt: string)` method — POST create task
- [x] 2.3 Add `getTask(taskId: string)` method — GET task by ID
- [x] 2.4 Add `getTaskLogs(taskId: string)` method — GET task logs, truncate to last 50 lines
- [x] 2.5 Add `appendTaskPrompt(taskId: string, prompt: string)` method — POST append prompt
- [x] 2.6 Add `deleteTask(taskId: string)` method — DELETE task by ID

## 3. Task Bot Commands

- [x] 3.1 Create `src/commands/tasks/list.ts` — `/tasks <workspace>` command handler
- [x] 3.2 Create `src/commands/tasks/create.ts` — `/task_create <workspace> <template> <prompt>` command handler
- [x] 3.3 Create `src/commands/tasks/logs.ts` — `/task_logs <id>` command handler with truncation note
- [x] 3.4 Create `src/commands/tasks/append.ts` — `/task_append <id> <prompt>` command handler
- [x] 3.5 Create `src/commands/tasks/delete.ts` — `/task_delete <id>` command handler

## 4. Wire Up

- [x] 4.1 Register task commands in `src/bot.ts` (or wherever commands are registered)
- [x] 4.2 Add task commands to the Telegram command menu registered on startup
- [x] 4.3 Update the `/start` welcome message to include new task commands
