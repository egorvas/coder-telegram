## Context

Currently the bot uses a single global `CODER_API_TOKEN` and a singleton `CoderClient` in `bot.ts`. All authorized users share one Coder identity, see the same resources, and cannot be individually managed. The session file already stores per-user task data but has no concept of per-user Coder credentials.

## Goals / Non-Goals

**Goals:**
- Each user stores their own Coder API key in the session file
- On `/start`, users without a key are prompted to enter one (with a link to get it)
- Users not in the allowlist receive an informative rejection message
- Admins (env-configured) can add/remove users from the runtime allowlist via bot UI
- Admins can toggle "all users" view to see aggregated workspaces/tasks with owner labels
- All Coder API calls use the requesting user's own API key (proper resource scoping)

**Non-Goals:**
- Key encryption at rest (plaintext in JSON session file is acceptable for this scope)
- OAuth / SSO flows
- Per-user Coder URL (all users share the same `CODER_API_URL`)
- Role levels beyond "admin" and "user"

## Decisions

### D1: New `UserStore` class, separate from `TaskSessionStore`

The session store manages ephemeral task polling state. User credentials and the runtime allowlist are durable identity data with different lifecycle concerns. A separate `src/store/user-store.ts` keeps the two stores cohesive and independently testable.

**Alternative considered**: Extend `TaskSessionStore` with a `users` map. Rejected — mixes task lifecycle with identity data, complicates the persistence schema.

The new `UserStore` is persisted to the same `SESSION_FILE` JSON but under a separate top-level key (`registry`), avoiding a separate file.

### D2: `CoderClient` factory replaces singleton

`bot.ts` currently exports `coderClient` as a module-level singleton. After this change, it exports a `getCoderClient(userId: number): CoderClient | null` function that looks up the user's key from `UserStore` and returns a fresh (or cached) `CoderClient`.

**Alternative considered**: Pass `userId` to every handler and construct clients inline. Rejected — too much boilerplate in every handler.

Clients are not cached (token lookup is O(1) in-memory, `CoderClient` is lightweight). Caching would add invalidation complexity.

### D3: Runtime allowlist lives in `UserStore`, seeded from `ALLOWED_USERS` env

On startup, `UserStore` loads `ALLOWED_USERS` and `ADMIN_USERS` from env into the in-memory set. Admins can add/remove users at runtime; changes persist to the session file. Env values are always re-applied on restart (so removing a user from the bot UI but keeping them in `ALLOWED_USERS` will re-add them on restart — this is acceptable/expected).

### D4: `/start` flow is the entry point for key setup

On `/start`:
1. If user not in allowlist → reply "You are not authorized" (no further interaction)
2. If in allowlist and has API key → show main menu normally
3. If in allowlist but no API key → send setup message with instructions and await next text message

The pending key-setup state is tracked in `uiState` (ephemeral, like pending appends), so it doesn't survive restarts. On restart, users simply `/start` again.

### D5: "All users" view aggregates via each user's stored API key

When an admin toggles global view, `showTaskDashboard` and `showWorkspaceList` iterate all registered users (those with a stored API key), call each user's API in parallel, and merge results annotated with `[username]`. Errors for individual users are skipped with a logged warning.

**Alternative considered**: A separate admin API token with broader Coder permissions. Rejected — requires extra setup and doesn't work if Coder isn't configured with such a role. Aggregation via individual keys always works with the existing permission model.

### D6: Admin panel as a new section in main menu

Admins see an additional "👤 Admin" button in `mainMenuKeyboard`. This keeps the admin UI discoverable but separated from the normal user flow. Admin actions: list users (Telegram ID + key status), add user by ID, remove user by ID, toggle global view.

## Risks / Trade-offs

- **API key stored plaintext** → Risk: session file exposure leaks tokens. Mitigation: document that the session file should have restricted permissions; encryption can be added later.
- **All-users aggregation is N sequential API calls** → Risk: slow for many users. Mitigation: calls are made in parallel with `Promise.allSettled`; acceptable for small teams.
- **No key after restart** → Risk: pending key-setup state lost on bot restart. Mitigation: `/start` re-enters the setup flow seamlessly.
- **Admin can't undo env-sourced users** → Risk: confusion if admin removes a user who is in `ALLOWED_USERS` env. Mitigation: document the env-always-wins-on-restart behavior.

## Migration Plan

1. Deploy: existing singleton `coderClient` is removed; bot starts without `CODER_API_TOKEN`
2. All existing users must re-enter their key on next `/start` — **one-time friction**
3. Set `ADMIN_USERS=<your_telegram_id>` in env to designate yourself as admin
4. Remove `CODER_API_TOKEN` from env (bot no longer reads it)

**Rollback**: Revert to previous commit; restore `CODER_API_TOKEN` in env.

## Open Questions

- Should the "all users" view also apply to task creation and workspace actions, or read-only only? → Assume read-only for now; actions always use the acting user's own key.
- Should admins be able to view another user's API key? → No, show only "configured / not configured" status.
