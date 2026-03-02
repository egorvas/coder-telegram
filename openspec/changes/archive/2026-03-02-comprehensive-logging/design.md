## Context

The bot has ~25 source files across `src/`: a Telegraf bot, a Coder API client, two stores (user-store, task-sessions), a background task poller, and multiple UI handler modules. Currently logging consists of two `console.log` lines at startup (`bot starting...`, `Bot is running.`) and a handful of `console.warn` calls in error paths. There is no request tracing, no per-user context, and no way to correlate a user action with the downstream Coder API call that it triggered.

## Goals / Non-Goals

**Goals:**
- Provide a single `logger` singleton usable across all modules (no per-file setup)
- Support log levels: `debug` | `info` | `warn` | `error` (controlled via `LOG_LEVEL` env var)
- Log all Telegram updates (command, callback action, free-text) with user/chat context
- Log all Coder API calls with method, path, HTTP status, and response time
- Log poller cycles with per-user stats and state transitions
- Log auth middleware decisions, admin actions, and wizard flow steps
- Emit structured JSON in production and human-readable text in development

**Non-Goals:**
- External log aggregation service integration (Datadog, Loki, etc.)
- Log rotation / file output (stdout only; handled by the host process manager)
- Sensitive data masking beyond not logging API tokens
- Performance tracing / distributed tracing (OpenTelemetry)

## Decisions

### D1: Zero-dependency micro-logger in `src/utils/logger.ts`

A tiny custom logger built on `process.stdout.write` (or `console` methods) with level filtering and structured fields. No npm dependencies.

**Alternative considered**: `pino` or `winston`. Rejected — adds a dependency for functionality achievable in ~50 lines. The bot is a small single-process application; a production-grade logger is overkill.

**Format**:
- `NODE_ENV=production` → JSON lines: `{"level":"info","ts":"ISO","msg":"...","key":"value",...}`
- Otherwise → human-readable: `[INFO ] 12:34:56 msg key=value`

### D2: Logger is a singleton exported from `src/utils/logger.ts`

```typescript
import { log } from '../utils/logger.js';
log.info('task created', { taskId, userId });
```

All modules import `log` from the same path. No dependency injection needed for a single-process bot.

### D3: Coder API request/response logging lives in `CoderClient.request()`

The `private request<T>()` method is the single choke-point for all Coder API calls. Adding logging there covers 100% of API interactions without touching individual methods. Logged fields: `method`, `path`, `status`, `durationMs`. Token is NEVER logged (it lives only in the `CoderClient` instance, not in the log line).

### D4: Telegram update logging via middleware in `src/index.ts`

A single `bot.use()` middleware registered before all handlers logs:
- For callback queries: `action` (callback data), `userId`, `chatId`
- For commands: `command`, `userId`, `chatId`
- For text messages: `type: 'text'`, `userId`, `chatId` (no message content to avoid logging user data)

### D5: Poller logging at cycle level, not per-task

Log one line per poller cycle with: `usersPolled`, `tasksChecked`, `stateChanges`. Log individual state changes separately at `info` level. This keeps log volume manageable while preserving full observability.

### D6: `LOG_LEVEL` env var, defaults to `info`

`debug` level enables verbose request body logging (sans tokens) and per-task poller details. Production runs at `info`. Developers can set `LOG_LEVEL=debug` locally.

## Risks / Trade-offs

- **Log volume at `debug`**: Polling every 15s × N users could produce many lines. Mitigation: `debug` is opt-in; `info` only logs state changes.
- **User message content not logged**: We intentionally skip free-text content for privacy. This limits debuggability for text-flow issues. Mitigation: log the flow step (e.g., `"pending key setup input"`) without the value.
- **No log correlation ID**: Without a request ID threaded through calls, it can be hard to correlate a Telegram update with the Coder API call it triggered. Mitigation: log `userId` + `chatId` consistently — that's sufficient for a single-user-at-a-time bot.

## Migration Plan

1. Create `src/utils/logger.ts` with the logger singleton
2. Add `LOG_LEVEL` to `config.ts` and `.env.example`
3. Update `CoderClient.request()` — one change covers all API calls
4. Add middleware in `index.ts` for Telegram update logging
5. Replace existing `console.log/warn` calls across all files
6. Add contextual log calls to poller, admin panel, wizard, auth middleware
7. No restart strategy needed — purely additive change to logging output

## Open Questions

- Should `debug` log the full request body (with Cyrillic/Unicode escaped)? → Yes, useful for diagnosing the UTF-8 encoding issues we've seen.
- Should errors include the full stack trace in JSON mode? → Yes, under `err.stack` field.
