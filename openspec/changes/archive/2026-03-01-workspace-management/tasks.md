## 1. Project Setup

- [x] 1.1 Install dependencies: `telegraf` for Telegram bot
- [x] 1.2 Create `src/config.ts` — load and validate environment variables (`TELEGRAM_BOT_TOKEN`, `CODER_API_URL`, `CODER_API_TOKEN`)

## 2. Coder API Client

- [x] 2.1 Create `src/coder/types.ts` — TypeScript types for Coder API responses (Workspace, WorkspaceBuild, etc.)
- [x] 2.2 Create `src/coder/client.ts` — CoderClient class with auth header, error handling, and methods: `listWorkspaces()`, `startWorkspace(name)`, `stopWorkspace(name)`

## 3. Bot Setup

- [x] 3.1 Create `src/bot.ts` — Telegraf bot instance creation, graceful shutdown (SIGINT/SIGTERM)
- [x] 3.2 Register bot command menu with Telegram on startup

## 4. Workspace Commands

- [x] 4.1 Create `src/commands/workspaces.ts` — `/workspaces` command: list all workspaces with name, owner, status
- [x] 4.2 Create `src/commands/start.ts` — `/start_ws <name>` command: start a workspace, handle missing name and not found
- [x] 4.3 Create `src/commands/stop.ts` — `/stop_ws <name>` command: stop a workspace, handle missing name and not found
- [x] 4.4 Create `/start` command handler — welcome message with available commands list

## 5. Entry Point

- [x] 5.1 Update `src/index.ts` — wire up config, bot, commands, and launch
