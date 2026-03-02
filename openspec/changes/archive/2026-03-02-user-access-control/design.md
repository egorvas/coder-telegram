## Context

The bot runs in private DMs where `ctx.chat.id === ctx.from.id` (Telegram guarantees this for private chats). Currently there is no access check, and the session store is a flat global namespace. Sessions already implicitly belong to a user via `chatId`, but the file structure doesn't reflect this.

## Goals / Non-Goals

**Goals:**
- Block unauthorised users at the middleware level before any handler runs
- Restructure `sessions.json` so each user's data is under their own key
- All session operations are user-scoped; webhook path does a cross-user search (still O(users), which is tiny)

**Non-Goals:**
- Per-user Coder API tokens (all users share `CODER_API_TOKEN`)
- Admin role or user management commands
- Group chat support

## Decisions

**`ALLOWED_USERS` as comma-separated integers in env** — simple, no DB needed. If var is absent or empty, the bot allows all users (backward-compatible default). Example: `ALLOWED_USERS=123456789,987654321`.

**Single auth middleware in `index.ts`** — registered before all other handlers. Checks `ctx.from?.id` against the allow-set. Unrecognised users get "Sorry, you are not authorised to use this bot." and the update is dropped (`return` without calling `next()`).

**`PersistedData` structure change:**
```
Before:
{ sessions: { taskId: { chatId } }, nameToId: { taskName: taskId } }

After:
{ users: { "userId": { sessions: { taskId: { chatId } }, nameToId: { taskName: taskId } } } }
```

**Store method signatures — add `userId` to mutating/read methods:**
- `register(taskId, chatId, userId)` → writes into `users[userId].sessions`
- `registerName(name, id, userId)` → writes into `users[userId].nameToId`
- `get(taskId, userId)` → reads from `users[userId].sessions`
- `remove(taskId, userId)` → deletes from `users[userId].sessions`
- `getIdByName(name)` → searches all users' `nameToId` (for webhook routing, no userId available)

`pendingAppends` is ephemeral (not persisted) and stays keyed by `chatId` — no change.

**Callers use `ctx.from!.id` as userId** — in DMs `from.id === chat.id`, so this is always available and correct.

**Migration** — old flat `sessions.json` files will fail to parse into the new shape and be silently ignored (store starts fresh). Existing sessions are lost on first deploy with this change; acceptable one-time cost.

## Risks / Trade-offs

- [One-time session loss on deploy] All active task sessions are lost when the file format changes. Users need to recreate tasks to get webhook notifications. Mitigation: document in the commit message.
- [Backward compat] If `ALLOWED_USERS` is not set, everyone is allowed — existing deployments are unaffected.
