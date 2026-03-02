## 1. Config

- [x] 1.1 Add `allowedUsers: Set<number>` to `src/config.ts` — parse `ALLOWED_USERS` env var as comma-separated integers; empty set means open access

## 2. Auth middleware

- [x] 2.1 Add auth middleware in `src/index.ts` before all handlers — check `ctx.from?.id` against `config.allowedUsers`; if non-empty set and user not in it, reply "Sorry, you are not authorised to use this bot." and return without calling `next()`

## 3. Per-user session store

- [x] 3.1 Restructure `PersistedData` in `src/store/task-sessions.ts` to `{ users: Record<string, { sessions: Record<string, TaskSession>, nameToId: Record<string, string> }> }`
- [x] 3.2 Update `load()` to populate per-user maps from new structure
- [x] 3.3 Update `save()` to serialise per-user maps to new structure
- [x] 3.4 Add `userId` parameter to `register(taskId, chatId, userId)`, `get(taskId, userId)`, `remove(taskId, userId)`, `registerName(name, id, userId)`
- [x] 3.5 Update `getIdByName(name)` to search across all users and return `{ taskId, chatId } | null`

## 4. Update callers

- [x] 4.1 `src/ui/handlers/wizard.ts`: pass `ctx.from!.id` as userId to `register` and `registerName`
- [x] 4.2 `src/ui/handlers/task-dashboard.ts`: pass `ctx.from!.id` as userId to `get` and `remove`
- [x] 4.3 `src/flows/task-completion.ts`: update to use new `getIdByName` return shape `{ taskId, chatId }`; remove separate `get()` call since chatId is now returned directly
- [x] 4.4 `src/webhook/server.ts`: update to use new `getIdByName` return shape
- [x] 4.5 `src/index.ts` pending-append handlers: pass `ctx.from!.id` as userId to `getPendingAppend` / `clearPendingAppend` if needed (check if these are still chatId-keyed — if so, no change)

## 5. Docs

- [x] 5.1 Add `ALLOWED_USERS` row to env vars table in `README.md`
