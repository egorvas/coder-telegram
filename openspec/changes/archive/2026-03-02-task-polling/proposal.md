## Why

The webhook-based notification approach requires the bot to be reachable from the Coder server via an inbound HTTP connection, which is often impractical in local or private deployments. Replacing it with an auto-polling mechanism eliminates the infrastructure requirement while providing equivalent (and more reliable) task completion notifications.

## What Changes

- Add a `TaskPoller` service that runs on a configurable interval (default 15 s) and monitors all active task sessions
- When a tracked task transitions to `stopped` status (i.e., agent is idle and awaiting user input), the poller triggers `notifyTaskComplete` — the same notification flow used by the webhook today
- Track last-known status per task session to detect transitions and avoid duplicate notifications
- Remove the webhook HTTP server (`src/webhook/server.ts`) and all related config (`WEBHOOK_PORT`, `WEBHOOK_SECRET`)
- Remove `WebhookMeta` from the completion flow (no longer needed — poller has no title/body payload)

## Capabilities

### New Capabilities
- `task-poller`: Background polling service that periodically checks task statuses and notifies on `stopped` transitions

### Modified Capabilities
- `task-completion-flow`: Remove `WebhookMeta` parameter; notification header becomes a fixed string
- `task-session-store`: Store last-known status per task to detect transitions
- `webhook-server`: **REMOVED** — replaced by the poller

## Impact

- `src/flows/task-poller.ts` — new file, the poller service
- `src/flows/task-completion.ts` — drop `WebhookMeta`, simplify header
- `src/store/task-sessions.ts` — add `lastStatus` tracking
- `src/webhook/server.ts` — deleted
- `src/bot.ts` (or entry point) — start poller instead of webhook server
- `src/config.ts` — remove `WEBHOOK_PORT`/`WEBHOOK_SECRET`, add optional `POLL_INTERVAL_MS`
- `.env.example` — remove webhook vars, add `POLL_INTERVAL_MS`
