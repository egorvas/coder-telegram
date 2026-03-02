# Coder Telegram Bot

A Telegram bot for managing [Coder](https://coder.com) workspaces and AI tasks via inline keyboard UI.

## Features

- **AI Tasks** — create, monitor, append prompts, view logs, delete
- **Workspaces** — list, start, stop, create from template
- **Templates** — browse templates and their presets
- **Task notifications** — notified automatically when an AI task finishes
- **Per-user API keys** — each user authenticates with their own Coder token
- **Access control** — admins manage allowed users via in-bot admin panel
- **Structured logging** — JSON logs in production, human-readable in dev

## Commands

| Command | Description |
|---|---|
| `/start` | Setup / show main menu |
| `/resetkey` | Reset your Coder API key |
| `/tasks` | AI task dashboard |
| `/task_create` | Create a new AI task (launches wizard) |
| `/workspaces` | Workspace list with start/stop/delete actions |
| `/workspaces_create` | Create a new workspace from a template |
| `/templates` | Browse templates and presets |

## Setup

### Prerequisites

- Node.js 22+
- A Telegram bot token ([create via @BotFather](https://t.me/botfather))
- A running Coder instance

### Environment variables

Copy `.env.example` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✓ | Telegram bot token from @BotFather |
| `CODER_API_URL` | ✓ | Coder instance URL (e.g. `https://coder.example.com`) |
| `ADMIN_USERS` | — | Comma-separated Telegram user IDs of admins. If set, only admins and users they add can use the bot. If unset, the bot is open to everyone. |
| `POLL_INTERVAL_MS` | — | How often to poll task status in ms (default: `15000`) |
| `SESSION_FILE` | — | Path to persistence file (default: `./data/sessions.json`) |
| `LOG_LEVEL` | — | `debug` / `info` / `warn` / `error` (default: `info`) |

> **API keys**: each user enters their own Coder API token via `/start`. Tokens are stored per-user in the session file.

### Development

```bash
npm install
npm run dev       # hot-reload via tsx watch
npm run type-check
```

### Production

```bash
npm run build
npm start
```

## Docker

### Docker Compose (recommended)

```yaml
services:
  bot:
    image: ghcr.io/egorvas/coder-telegram:main
    restart: unless-stopped
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      CODER_API_URL: ${CODER_API_URL}
      ADMIN_USERS: ${ADMIN_USERS}        # optional
      SESSION_FILE: /app/data/sessions.json
      POLL_INTERVAL_MS: "15000"          # optional
    volumes:
      - ./data:/app/data                 # persist sessions across restarts
```

Session data (API keys, task sessions, allowed users) is stored in `./data/sessions.json` on the host. The directory must exist or Docker will create it automatically.

### Quick run

```bash
docker run -d \
  -e TELEGRAM_BOT_TOKEN=... \
  -e CODER_API_URL=... \
  -v $(pwd)/data:/app/data \
  ghcr.io/egorvas/coder-telegram:main
```

## Access control

If `ADMIN_USERS` is set, the bot enforces an allowlist:

1. Admin users (from `ADMIN_USERS` env) always have access
2. Other users are denied and shown their Telegram ID
3. Admins add users via the **Admin Panel** in the bot menu
4. Allowed users and their API keys persist across restarts

If `ADMIN_USERS` is not set, the bot is open to all Telegram users.

## User flow

1. User sends `/start`
2. Bot asks for a Coder API token (`Settings → Tokens` in Coder UI)
3. Token is validated and stored; a hint about GitHub auth is shown
4. User creates AI tasks via the wizard or `/task_create`
5. Bot polls every `POLL_INTERVAL_MS` ms and sends a notification when the task finishes

## Tech stack

- **Runtime**: Node.js 22, TypeScript (ESM)
- **Bot framework**: [Telegraf](https://github.com/telegraf/telegraf) v4
- **Build**: `tsc` → `dist/`
- **Persistence**: JSON file (no external database)
