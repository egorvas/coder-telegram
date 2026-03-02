## 1. Logger Singleton

- [x] 1.1 Create `src/utils/logger.ts` with level filtering, JSON production format, and human-readable dev format
- [x] 1.2 Add `LOG_LEVEL` to `src/config.ts` (read from env, default `info`, export as `logLevel`)
- [x] 1.3 Add `LOG_LEVEL=info` to `.env.example`

## 2. Coder API Client Logging

- [x] 2.1 Add request/response logging in `CoderClient.request()`: method, path, status, durationMs at `debug`; errors at `error`

## 3. Telegram Update Middleware

- [x] 3.1 Add `bot.use()` middleware in `src/index.ts` before all handlers: log commands, callback actions, and text messages with userId and chatId

## 4. Poller Logging

- [x] 4.1 Replace `console.log/error` in `src/flows/task-poller.ts` with structured `log` calls (poller started, task not found, error)
- [x] 4.2 Add per-cycle `debug` log in `poll()` function with `usersPolled`, `tasksChecked`, `stateChanges`
- [x] 4.3 Add `info` log for each task state transition (from, to, taskId, userId)

## 5. Replace Remaining console Calls

- [x] 5.1 Replace `console.log/warn` in `src/ui/handlers/workspace-menu.ts` and `src/ui/handlers/task-dashboard.ts`
- [x] 5.2 Replace `console.log` calls in `src/bot.ts` (shutdown messages)
- [x] 5.3 Replace `console.log` in `src/index.ts` (startup messages)
- [x] 5.4 Replace `console.error` in `src/config.ts` (missing env vars)
- [x] 5.5 Replace `console.log/error` in `src/store/task-sessions.ts` and `src/store/user-store.ts`

## 6. Verify

- [x] 6.1 Run `npm run type-check` and fix any errors
