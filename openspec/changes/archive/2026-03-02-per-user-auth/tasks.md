## 1. User Store

- [x] 1.1 Create `src/store/user-store.ts` with `UserStore` class: in-memory map `userId → { coderApiKey?: string, allowed: boolean }`, persisted under `registry` key in the session JSON file
- [x] 1.2 Add methods: `setApiKey(userId, key)`, `getApiKey(userId): string|null`, `addUser(userId)`, `removeUser(userId)`, `listUsers(): Array<{userId, hasKey}>`
- [x] 1.3 On `UserStore` construction, seed allowed users from `config.allowedUsers` (env) and load persisted `registry` from session file
- [x] 1.4 Add `isAllowed(userId): boolean` method that checks both env-seeded and runtime-added users
- [x] 1.5 Export singleton `userStore` from `user-store.ts`

## 2. Config

- [x] 2.1 In `src/config.ts`, remove `CODER_API_TOKEN` from the required variables array
- [x] 2.2 Add `adminUsers: new Set(...)` reading from `ADMIN_USERS` env var (same pattern as `allowedUsers`)
- [x] 2.3 Update `.env.example`: remove `CODER_API_TOKEN`, add `ADMIN_USERS=` comment

## 3. CoderClient Factory

- [x] 3.1 In `src/bot.ts`, remove the singleton `coderClient` export
- [x] 3.2 Add and export `getCoderClient(userId: number): CoderClient | null` — looks up key via `userStore.getApiKey(userId)`, returns `new CoderClient(config.coderApiUrl, key)` or `null` if no key
- [x] 3.3 Update all files that currently import `coderClient` from `bot.ts` to import `getCoderClient` instead, and add a guard that replies "Use /start to configure your API key." when `getCoderClient` returns null

## 4. Auth Middleware & /start Flow

- [x] 4.1 In `src/index.ts`, update the auth middleware to use `userStore.isAllowed(userId)` instead of `config.allowedUsers`; non-allowed users receive "You don't have access to this bot. Contact the administrator to be added."
- [x] 4.2 Add `pendingKeySetup` tracking to `uiState` (or directly in index.ts): `setPendingKeySetup(chatId)`, `isPendingKeySetup(chatId): boolean`, `clearPendingKeySetup(chatId)`
- [x] 4.3 Update the `/start` command handler: if user has no stored API key, send the setup message ("Please enter your Coder API key. You can find it at `<CODER_URL>/settings/tokens`") and set pending key setup state
- [x] 4.4 In the unified text handler (`bot.on('text', ...)`), add a branch at the top: if `isPendingKeySetup(chatId)`, treat the text as the API key — validate it via `GET /api/v2/users/me`, store on success or reply error on failure
- [x] 4.5 Add `/resetkey` command handler: clear the user's stored API key, set pending key setup, send setup message

## 5. Main Menu — Admin Button

- [x] 5.1 Update `mainMenuKeyboard()` in `src/ui/keyboards.ts` to accept `isAdmin: boolean` parameter and conditionally add a "👤 Admin" button
- [x] 5.2 Update all callers of `mainMenuKeyboard()` to pass `config.adminUsers.has(userId)` (thread `userId` through where needed)

## 6. Admin Panel UI

- [x] 6.1 Create `src/ui/handlers/admin-panel.ts` with `showAdminPanel(ctx)` function that sends the user list message and inline keyboard
- [x] 6.2 Register `menu:admin` action handler: calls `showAdminPanel`
- [x] 6.3 Register `admin:add` action handler: sets pending "add user" state, prompts for Telegram ID
- [x] 6.4 Add `admin:add` branch to the text handler: validate numeric ID, call `userStore.addUser()`, persist, confirm, show admin panel
- [x] 6.5 Register `admin:remove` action handler: shows list of registered user IDs as inline buttons
- [x] 6.6 Register `admin:remove:<id>` action handler: shows confirmation prompt
- [x] 6.7 Register `admin:remove:confirm:<id>` and `admin:remove:cancel:<id>` handlers: confirm removes user + persists; cancel returns to admin panel
- [x] 6.8 Register `admin:viewmode` toggle handler: flips a per-user flag in `uiState` between own-scope and all-users; confirms the change and refreshes admin panel button label

## 7. All-Users Aggregated View

- [x] 7.1 In `src/ui/handlers/workspace-menu.ts`, update `showWorkspaceList` to check `uiState.isGlobalView(userId)`: if true, call `getCoderClient` for every user returned by `userStore.listUsers()` in parallel via `Promise.allSettled`, merge results, and prepend each workspace name with `[ownerLabel]`
- [x] 7.2 In `src/ui/handlers/task-dashboard.ts`, update `showTaskDashboard` similarly for all-users mode
- [x] 7.3 In `src/ui/state.ts`, add `setGlobalView(userId, enabled)` and `isGlobalView(userId): boolean` methods

## 8. Wire Up & Cleanup

- [x] 8.1 Register `admin-panel` handlers in `src/index.ts` alongside the other handler registrations
- [x] 8.2 Update `src/flows/task-poller.ts`: the poller calls `getCoderClient(userId)` per session instead of a global client — verify it passes `userId` correctly
- [x] 8.3 Update `src/flows/task-completion.ts` if it references `coderClient` directly
- [x] 8.4 Run `npm run type-check` and fix any remaining type errors
