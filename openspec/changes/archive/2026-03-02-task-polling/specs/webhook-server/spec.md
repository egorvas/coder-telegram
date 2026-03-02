## REMOVED Requirements

### Requirement: Webhook server is optional
**Reason**: The webhook server is replaced by the task poller. Inbound HTTP connectivity is no longer required.
**Migration**: Remove `src/webhook/server.ts`. Remove `WEBHOOK_PORT` and `WEBHOOK_SECRET` environment variables from `config.ts` and `.env.example`.

### Requirement: Webhook server receives task completion events
**Reason**: Task completion detection is now handled by the poller, which actively checks task statuses on a fixed interval.
**Migration**: No replacement endpoint. The poller triggers `notifyTaskComplete` when a task transitions to `stopped`.

### Requirement: Webhook server verifies request signature
**Reason**: No webhook server; signature verification is no longer applicable.
**Migration**: Remove HMAC-SHA256 verification logic entirely.
