## Why

The bot currently has no functionality — it only prints a startup message. To be useful, it needs its core feature: managing Coder workspaces directly from Telegram. This lets developers start, stop, and monitor their workspaces without leaving the messenger.

## What Changes

- Add Telegram bot framework (telegraf) and connect it to the Telegram Bot API
- Implement Coder API client for workspace operations (list, start, stop, get status)
- Create bot commands: `/workspaces` (list), `/start <name>` (start workspace), `/stop <name>` (stop workspace)
- Load configuration from environment variables (bot token, Coder API URL/token)
- Structure the project with clear separation: bot layer, API client layer, config

## Capabilities

### New Capabilities
- `bot-setup`: Telegram bot initialization, command registration, and message handling
- `coder-api-client`: HTTP client for Coder API with authentication and workspace endpoints
- `workspace-commands`: Bot commands for listing, starting, and stopping workspaces

### Modified Capabilities
<!-- No existing capabilities to modify — this is a greenfield project -->

## Impact

- **Dependencies**: Adding `telegraf` (Telegram bot framework), `coder-api-client` or raw `fetch` for Coder API
- **Code**: Complete rewrite of `src/index.ts`, new modules for bot, API client, and commands
- **Config**: Requires `TELEGRAM_BOT_TOKEN`, `CODER_API_URL`, `CODER_API_TOKEN` environment variables (already documented in `.env.example`)
