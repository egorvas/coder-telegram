## Context

The current notification path is:

```
Coder server → POST /webhook → parse payload → taskSessions.getIdByName() → notifyTaskComplete()
```

This requires `WEBHOOK_PORT` to be exposed and reachable from the Coder server. In practice, bots running locally or behind NAT cannot receive inbound connections, making the feature unreliable.

The `taskSessions` store already tracks every task created by the bot, with its `chatId`. This data is sufficient to drive a polling loop without any inbound connectivity.

## Goals / Non-Goals

**Goals:**
- Replace the webhook with a background interval-based poller
- Notify users when a task transitions to `stopped` (agent idle, awaiting input) — equivalent to the current "Task Idle" webhook event
- Avoid duplicate notifications for the same status transition
- Remove all webhook infrastructure and related config

**Non-Goals:**
- Real-time status changes (poller is inherently delayed by the interval)
- Polling ALL tasks from Coder (only tasks registered in the bot's session store)
- Notifying on every status change (only `stopped` triggers a notification)

## Decisions

### 1. Poll only sessions in the store, not all Coder tasks
The session store (`taskSessions`) already contains exactly the tasks the bot cares about. Fetching only those tasks (N requests per interval, N = active tasks) is minimal overhead.
**Why**: Avoids listing all tasks, respects per-user scope, and reuses existing infrastructure.

### 2. Track `lastKnownStatus` per session
Add a `lastKnownStatus?: string` field to `TaskSession`. The poller updates it after each check. A notification is sent only when status transitions *to* `stopped` and the last known status was not already `stopped`.
**Why**: Prevents duplicate notifications if the poller runs while the task is still `stopped`.

### 3. Notify on `stopped` status (same as webhook's "Task Idle")
`stopped` is the Coder task status that corresponds to the "Task Idle" webhook notification. Use this as the single trigger.
**Why**: Maintains identical UX to the current webhook-based notification.

### 4. Add `getAllSessions()` to the store for poller iteration
New method returns all sessions across all users: `Array<{ taskId, chatId, userId, lastKnownStatus }>`. The poller uses this to know what to fetch.
**Why**: Clean encapsulation — poller doesn't need to know the internal store structure.

### 5. Remove `nameToId` / `getIdByName` from the store
These were only needed for the webhook to look up a task by name from the Coder notification payload. With the poller, we always have the `taskId` directly.
**Why**: Simplification; reduces serialised session file size.

### 6. Poller as a standalone module started in `index.ts`
`src/flows/task-poller.ts` exports a `startPoller(bot, intervalMs)` function, called in `index.ts` replacing `startWebhookServer(bot)`. Default interval: 15 000 ms, configurable via `POLL_INTERVAL_MS`.
**Why**: Mirrors the existing webhook pattern — a single `start*` call in the entry point.

### 7. Drop `WebhookMeta` from `notifyTaskComplete`
The poller has no title/body metadata from a notification payload. Simplify the function signature to `notifyTaskComplete(taskId, chatId, bot)`.
**Why**: `WebhookMeta` was webhook-specific; the notification text is sufficient without it.

### 8. Poller error isolation
If `getTask(taskId)` throws (e.g., 404 — task deleted outside the bot), catch the error, log it, and remove the session from the store. If it throws for any other reason, log and skip — don't crash the interval.
**Why**: Defensive polling; stale sessions should self-clean rather than halt the loop.

## Risks / Trade-offs

- [Notification delay] User is notified up to 15 s after task becomes idle. → Acceptable UX trade-off documented in the UI ("notifications may be delayed up to ~15 s").
- [API rate] Each interval makes one API call per active task. With 10 active tasks: 10 req / 15 s = ~0.7 req/s. → Negligible for a single-user bot.
- [Session cleanup on 404] If a task is deleted outside the bot (via Coder UI), the poller will get a 404, remove the session, and silently clean up. No notification is sent. → Acceptable; the task no longer exists.
- [Missed transition] If a task transitions to `stopped` and back to `active` between two polls, the notification is missed. → Rare edge case; acceptable given the polling interval.

## Migration Plan

1. Remove `WEBHOOK_PORT` and `WEBHOOK_SECRET` from `config.ts` and `.env.example`
2. Remove `src/webhook/server.ts`
3. Add `lastKnownStatus` to `TaskSession`, update persist/load logic
4. Add `getAllSessions()` to `TaskSessionStore`; remove `nameToId`/`registerName`/`getIdByName`
5. Simplify `notifyTaskComplete` — drop `WebhookMeta`
6. Create `src/flows/task-poller.ts`
7. Replace `startWebhookServer(bot)` with `startPoller(bot)` in `index.ts`
8. Clean up `index.ts` — remove `sessionPending` text handler branch (no longer needed once webhook is gone)

No rollback plan needed — webhook is optional today (`WEBHOOK_PORT` not required), so the transition is non-breaking for bots that never configured it.
