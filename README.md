# Coder Telegram Bot

A Telegram bot for managing [Coder](https://coder.com) workspaces and AI tasks via inline keyboard UI.

## Features

- **AI Tasks** — list, create, monitor, append prompts, delete
- **Workspaces** — list, start, stop, create from template
- **Templates** — browse templates and their presets
- **Webhook notifications** — get notified when a task completes (optional)

## Commands

| Command | Description |
|---|---|
| `/tasks` | AI task dashboard |
| `/task_create` | Create a new AI task (launches wizard) |
| `/workspaces` | Workspace list with start/stop actions |
| `/workspaces_create` | Create a new workspace from a template |
| `/templates` | Browse templates and presets |

## Setup

### Prerequisites

- Node.js 22+
- A Telegram bot token ([create via @BotFather](https://t.me/botfather))
- A Coder instance with API access

### Environment variables

Copy `.env.example` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✓ | Telegram bot token from @BotFather |
| `CODER_API_URL` | ✓ | Coder instance URL (e.g. `https://coder.example.com`) |
| `CODER_API_TOKEN` | ✓ | Coder API token (`coder tokens create`) |
| `WEBHOOK_PORT` | — | Port for task completion webhook server (e.g. `3000`) |
| `WEBHOOK_SECRET` | — | HMAC secret for webhook signature verification |
| `SESSION_FILE` | — | Path to session persistence file (default: `./data/sessions.json`) |
| `ALLOWED_USERS` | — | Comma-separated Telegram user IDs allowed to use the bot (e.g. `123456,789012`). If unset, all users are allowed. |

### Development

```bash
npm install
npm run dev       # hot-reload via tsx watch
```

### Production

```bash
npm run build
npm start
```

## Docker

### Run with Docker

```bash
docker run -d \
  -e TELEGRAM_BOT_TOKEN=... \
  -e CODER_API_URL=... \
  -e CODER_API_TOKEN=... \
  ghcr.io/egorvas/coder-telegram:main
```

With webhook support:

```bash
docker run -d \
  -e TELEGRAM_BOT_TOKEN=... \
  -e CODER_API_URL=... \
  -e CODER_API_TOKEN=... \
  -e WEBHOOK_PORT=3000 \
  -e WEBHOOK_SECRET=... \
  -p 3000:3000 \
  ghcr.io/egorvas/coder-telegram:main
```

### Docker Compose

```yaml
services:
  bot:
    image: ghcr.io/egorvas/coder-telegram:main
    restart: unless-stopped
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      CODER_API_URL: ${CODER_API_URL}
      CODER_API_TOKEN: ${CODER_API_TOKEN}
      # WEBHOOK_PORT: 3000
      # WEBHOOK_SECRET: ${WEBHOOK_SECRET}
    volumes:
      - ./data:/app/data   # persist sessions across restarts
    # ports:
    #   - "3000:3000"
```

## Webhook (optional)

The bot can receive task completion notifications from Coder via HTTP webhook.

1. Set `WEBHOOK_PORT` to enable the webhook server (listens on `POST /webhook`)
2. Optionally set `WEBHOOK_SECRET` for HMAC-SHA256 signature verification (`X-Coder-Signature` header)
3. Configure Coder to send webhooks to `http://<bot-host>:<WEBHOOK_PORT>/webhook`

Payload format:

```json
{ "task_id": "...", "status": "..." }
```

## Tech stack

- **Runtime**: Node.js 22, TypeScript (ESM)
- **Bot framework**: [Telegraf](https://github.com/telegraf/telegraf) v4
- **Build**: `tsc`
