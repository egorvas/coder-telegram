## Why

The bot currently uses a single global Coder API token shared by all users, making it impossible to distinguish who is doing what and exposing all workspaces/tasks to every allowed user. Moving to per-user API keys enables proper isolation, accountability, and multi-user support with an admin control layer.

## What Changes

- **BREAKING**: `CODER_API_TOKEN` env var is no longer required at startup — each user provides their own key interactively
- `/start` now checks whether the user has configured their Coder API key before showing the main menu; if not, it walks them through setup (with instructions on where to get the key)
- Users not in the allowlist are told they don't have access instead of silently ignored
- Each user's Coder API key is stored in the session file (encrypted or plaintext, scoped per user)
- Each user's workspace and task API calls use their own key → they see only their own resources
- Admins (configured via `ADMIN_USERS` env var) get an extra "Admin" button in the main menu
- Admin panel allows: listing users with their status, removing users from the allowlist, adding users by Telegram ID
- Admins can toggle "all users" view mode: see all workspaces/tasks across all users (with owner indicated), or their own scope only
- Users can reset their API key via a settings command or button

## Capabilities

### New Capabilities

- `user-api-key-setup`: Interactive flow for entering and resetting the user's personal Coder API key triggered by `/start` or settings
- `admin-panel`: Admin-only UI section for managing the user allowlist (add, remove, list users) and toggling all-users view mode

### Modified Capabilities

- `user-whitelist`: Allowlist is now manageable at runtime by admins via bot UI, not only via `ALLOWED_USERS` env var at deploy time; denied users receive an informative message
- `main-menu`: `/start` command now conditionally shows key setup flow before the main menu if the user has no API key configured
- `bot-setup`: `CODER_API_TOKEN` removed from required startup variables; `ADMIN_USERS` env var added
- `coder-api-client`: Client instantiation is now per-request using the authenticated user's stored API key, not a singleton

## Impact

- `src/config.ts`: Remove `coderApiToken` from required vars, add `adminUsers` set
- `src/bot.ts`: Remove singleton `coderClient`; replace with per-user client factory
- `src/store/task-sessions.ts` (or new `src/store/user-store.ts`): Store per-user API key alongside sessions
- `src/index.ts`: Update auth middleware and `/start` handler
- All handlers that call `coderClient.*`: Must receive or look up a user-scoped client
- `.env.example`: Update to reflect new vars
