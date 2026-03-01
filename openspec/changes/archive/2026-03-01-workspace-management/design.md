## Context

The project is a greenfield Telegram bot for managing Coder workspaces. Currently only a placeholder `index.ts` exists. The bot needs to connect to two external services: Telegram Bot API and Coder REST API. Configuration is already templated in `.env.example` with `TELEGRAM_BOT_TOKEN`, `CODER_API_URL`, and `CODER_API_TOKEN`.

The runtime is Node.js with strict TypeScript and ESM modules. No dependencies beyond `@fission-ai/openspec` are installed yet.

## Goals / Non-Goals

**Goals:**
- Working Telegram bot that responds to commands for workspace management
- Clean module structure: config, API client, bot, commands
- Type-safe Coder API interactions
- Graceful error handling and user-friendly messages

**Non-Goals:**
- Web UI or dashboard
- Multi-user auth / access control (single Coder token for now)
- Workspace creation from templates (future scope)
- Webhook-based updates or notifications
- Persistent storage or database

## Decisions

### 1. Telegram framework: Telegraf

**Choice**: `telegraf` v4
**Rationale**: Most popular TypeScript-first Telegram bot framework. Built-in support for commands, middleware, and context typing. Active maintenance.
**Alternatives considered**:
- `node-telegram-bot-api` — simpler but less TypeScript support, no middleware
- `grammY` — good alternative, smaller community

### 2. HTTP client: Native fetch

**Choice**: Node.js built-in `fetch` (available since Node 18)
**Rationale**: Zero dependencies, sufficient for REST API calls. The Coder API is straightforward REST — no need for a heavy HTTP library.
**Alternatives considered**:
- `axios` — adds unnecessary dependency
- Coder's official TypeScript SDK — check availability, but raw fetch keeps it simple

### 3. Project structure

```
src/
  index.ts          — entry point, bot startup
  config.ts         — env loading and validation
  bot.ts            — Telegraf bot instance and middleware
  coder/
    client.ts       — Coder API client class
    types.ts        — Coder API response types
  commands/
    workspaces.ts   — /workspaces command handler
    start.ts        — /start_ws command handler
    stop.ts         — /stop_ws command handler
```

**Rationale**: Flat where possible, nested only for logical grouping. Commands are separate files for easy addition of new commands later.

### 4. Command naming

**Choice**: `/workspaces`, `/start_ws <name>`, `/stop_ws <name>`
**Rationale**: `/start` and `/stop` conflict with Telegram's built-in `/start` command. Using `_ws` suffix avoids conflict while staying concise.

### 5. Configuration loading

**Choice**: Direct `process.env` access with validation in `config.ts`, no dotenv library
**Rationale**: In production, env vars are set by the runtime. For dev, `tsx` can use `.env` files or the user can source them. Keeps dependencies minimal.

## Risks / Trade-offs

- **Single Coder token** → All users share one identity. Mitigation: document this limitation, plan multi-user auth as future work.
- **No rate limiting** → Coder API could be hammered. Mitigation: Telegram naturally rate-limits via user interaction; add throttling later if needed.
- **Long-running transitions** → Workspace start/stop can take time. Mitigation: send immediate acknowledgment, poll or inform user to check status.
- **No persistence** → Bot state is lost on restart. Mitigation: acceptable for v1 since workspaces are managed by Coder, not the bot.
