## Why

The bot currently has no access control — any Telegram user who finds the bot can list, create, and delete tasks and workspaces. There is also no per-user isolation in the session store: all task sessions share a flat namespace. As more users are added, this creates security and clarity problems.

## What Changes

- **User whitelist**: `ALLOWED_USERS` env var (comma-separated Telegram user IDs). All bot interactions are rejected for users not on the list with a clear "not authorised" message.
- **Per-user session store**: `sessions.json` is restructured so each user's task sessions are stored under their `userId` key, preventing cross-user data leakage and making the file human-readable per user.
- **User-aware `TaskSessionStore`**: `register`, `get`, `remove`, `registerName`, `getIdByName` all become user-scoped — callers pass `userId`; the store partitions data accordingly.
- **Webhook routing remains by taskId/taskName**: webhooks carry the task name, which maps to a specific user's chatId as before — now via the per-user index.

## Capabilities

### New Capabilities

- `user-whitelist`: Middleware that blocks unauthorised Telegram users from interacting with the bot
- `per-user-sessions`: User-partitioned session storage so each user's task data is isolated

### Modified Capabilities

## Impact

- `src/config.ts`: add `ALLOWED_USERS` env var (parsed to `Set<number>`)
- `src/index.ts` or middleware: add auth guard applied to all messages and callback queries
- `src/store/task-sessions.ts`: restructure `PersistedData` to `{ users: { [userId]: { sessions, nameToId } } }`, update all methods to accept `userId`
- All callers of `taskSessions` (`wizard.ts`, `task-dashboard.ts`, `task-completion.ts`, `webhook/server.ts`): pass `userId`/`chatId` where appropriate
