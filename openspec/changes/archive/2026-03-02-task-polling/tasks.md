## 1. Session store changes

- [x] 1.1 In `src/store/task-sessions.ts`, add `lastKnownStatus?: string` to `TaskSession` interface and persist/load it
- [x] 1.2 In `src/store/task-sessions.ts`, add `getAllSessions(): Array<{ taskId: string; chatId: number; userId: number; lastKnownStatus?: string }>` method
- [x] 1.3 In `src/store/task-sessions.ts`, add `updateStatus(taskId: string, userId: number, status: string): void` method
- [x] 1.4 In `src/store/task-sessions.ts`, remove `registerName`, `getIdByName`, and the `nameToId` map (including persisted field)

## 2. Completion flow cleanup

- [x] 2.1 In `src/flows/task-completion.ts`, remove `WebhookMeta` interface and `meta?` parameter from `notifyTaskComplete`; replace dynamic header with fixed `🤖 *AI Task Update*`

## 3. Poller

- [x] 3.1 Create `src/flows/task-poller.ts` with `startPoller(bot: Telegraf, intervalMs?: number): void`
- [x] 3.2 Poller iterates `taskSessions.getAllSessions()` each tick; calls `coderClient.getTask(taskId)` for each
- [x] 3.3 If status is `stopped` and `lastKnownStatus !== 'stopped'`: call `notifyTaskComplete`, then `taskSessions.updateStatus(..., 'stopped')`
- [x] 3.4 For any other status change: call `taskSessions.updateStatus(...)` only
- [x] 3.5 On 404 error: remove session via `taskSessions.remove(taskId, userId)` and log
- [x] 3.6 On any other error: log and continue (don't crash the interval)

## 4. Config

- [x] 4.1 In `src/config.ts`, remove `webhookPort` and `webhookSecret`; add `pollIntervalMs: number` (default 15000, from `POLL_INTERVAL_MS`)
- [x] 4.2 Update `.env.example` — remove `WEBHOOK_PORT`/`WEBHOOK_SECRET`, add `POLL_INTERVAL_MS`

## 5. Entry point

- [x] 5.1 In `src/index.ts`, replace `startWebhookServer(bot)` with `startPoller(bot, config.pollIntervalMs)`
- [x] 5.2 In `src/index.ts`, remove the `sessionPending` branch from the text handler (was only for webhook-originated notifications)
- [x] 5.3 Delete `src/webhook/server.ts`
