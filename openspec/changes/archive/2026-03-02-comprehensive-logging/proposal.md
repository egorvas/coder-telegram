## Why

The bot currently has almost no structured logging: only a few `console.log` calls at startup and scattered `console.warn` on errors. This makes it impossible to diagnose production issues, trace request flows, or monitor polling health without attaching a debugger. With multiple users, per-user API keys, and background polling, observability is now critical.

## What Changes

- Introduce a lightweight structured logger (levels: debug / info / warn / error) used consistently across all modules
- Log every inbound Telegram update (command, callback, text) with user ID, chat ID, and action type
- Log every outbound Coder API request and response (method, path, status, duration) — excluding sensitive token values
- Log task poller cycles: users polled, tasks checked, state changes detected, notifications sent
- Log auth middleware decisions (allowed / denied / no-key)
- Log admin actions (user add/remove, view-mode toggle)
- Log wizard flow steps (template selected, preset selected, task/workspace created)
- Log errors with full context (stack trace, user ID, operation name)

## Capabilities

### New Capabilities

- `logging`: Structured logger with configurable level (env: `LOG_LEVEL`), human-readable dev format and JSON production format, singleton exported for use across all modules

### Modified Capabilities

- `bot-setup`: Logger is initialised at startup before bot launch; `LOG_LEVEL` env var is read
- `task-poller`: Poller emits structured log events per cycle (users iterated, tasks polled, transitions detected)
- `coder-api-client`: Each request/response is logged with method, path, status, and duration

## Impact

- All source files under `src/` that make Coder API calls, handle Telegram updates, or run background processes will import and use the shared logger
- No new npm dependencies (use Node.js built-in `console` with structured output, or a zero-dep micro-logger)
- No breaking changes to external interfaces
- `LOG_LEVEL` env var added (optional, defaults to `info`)
