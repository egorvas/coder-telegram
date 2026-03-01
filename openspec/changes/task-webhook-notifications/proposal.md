## Why

After creating an AI task, users have no way to know when it completes without manually polling. Adding optional webhook support closes this loop: when Coder calls a webhook on task completion, the bot automatically sends the logs to the originating user in Telegram and presents interactive options (append or delete). When webhooks are unavailable, users can still check status manually — the same follow-up UI applies.

## What Changes

- Add an optional HTTP webhook server that receives Coder task completion events
- Track the mapping between task IDs and Telegram chat/user IDs (in-memory, supporting multiple concurrent tasks)
- On task completion (via webhook or manual check), fetch logs and send them to the user with inline keyboard buttons: "Append prompt" and "Delete task"
- Handle callback queries from inline buttons to continue the task interaction flow
- Introduce `WEBHOOK_PORT` and `WEBHOOK_SECRET` optional env vars; bot works without them (polling-only mode)

## Capabilities

### New Capabilities
- `task-session-store`: In-memory store that maps active task IDs to Telegram chat IDs and user context, supporting concurrent tasks
- `webhook-server`: Optional HTTP server receiving Coder task completion webhooks, verifying the secret, and triggering Telegram notifications
- `task-completion-flow`: The interaction flow triggered on task completion — send logs, present inline keyboard for append/delete, handle button callbacks

### Modified Capabilities
<!-- No existing spec-level behavior changes — new capabilities only -->

## Impact

- **Dependencies**: `node:http` (built-in) for webhook server; no new external packages
- **Config**: Two new optional env vars: `WEBHOOK_PORT` (default: 3000), `WEBHOOK_SECRET` (for request verification)
- **Code**: New modules `src/webhook/`, `src/store/task-sessions.ts`, updated `src/commands/tasks/create.ts` to register task sessions on creation
- **Bot**: New callback query handlers for inline keyboard buttons
