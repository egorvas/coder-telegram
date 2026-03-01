## 1. Task Session Store

- [x] 1.1 Create `src/store/task-sessions.ts` — `TaskSessionStore` class with Map-based storage: `register(taskId, chatId)`, `get(taskId)`, `remove(taskId)`
- [x] 1.2 Add pending append state management to the store: `setPendingAppend(chatId, taskId)`, `getPendingAppend(chatId)`, `clearPendingAppend(chatId)`
- [x] 1.3 Export a singleton store instance

## 2. Task Completion Flow

- [x] 2.1 Create `src/flows/task-completion.ts` — `notifyTaskComplete(taskId, bot)`: fetch logs, build completion message with status + truncated logs + inline keyboard
- [x] 2.2 Add inline keyboard builder: two buttons `[Append prompt | callback: append:<id>]` and `[Delete task | callback: delete:<id>]`
- [x] 2.3 Register callback query handler in bot for `append:<id>` — set pending append state, ask user for follow-up text
- [x] 2.4 Register message handler for pending append state — send `appendTaskPrompt`, confirm success, clear pending state
- [x] 2.5 Register callback query handler for `delete:<id>` — call `deleteTask`, confirm deletion, remove from store
- [x] 2.6 Update `/task_logs` command: if task status is complete, append inline keyboard to response

## 3. Webhook Server

- [x] 3.1 Create `src/webhook/server.ts` — `startWebhookServer(bot)`: only starts if `WEBHOOK_PORT` is set, listens for POST `/webhook`
- [x] 3.2 Add request signature verification using HMAC-SHA256 when `WEBHOOK_SECRET` is set
- [x] 3.3 Parse webhook payload, look up task session, call `notifyTaskComplete` if session found
- [x] 3.4 Handle edge cases: malformed JSON (400), unknown task ID (200 + warn), invalid signature (401)

## 4. Integration

- [x] 4.1 Update `src/commands/tasks/create.ts` — register task in session store after successful creation
- [x] 4.2 Update `src/index.ts` — call `startWebhookServer` on startup
- [x] 4.3 Update `src/config.ts` — add optional `WEBHOOK_PORT` and `WEBHOOK_SECRET` env vars
- [x] 4.4 Update `.env.example` with `WEBHOOK_PORT` and `WEBHOOK_SECRET` entries (commented out as optional)
