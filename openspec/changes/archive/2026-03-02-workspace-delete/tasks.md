## 1. API client

- [x] 1.1 In `src/coder/client.ts`, add `deleteWorkspace(name: string): Promise<WorkspaceBuild>` — look up by name, then `POST /api/v2/workspaces/${ws.id}/builds` with `{ transition: 'delete' }`

## 2. Keyboard

- [x] 2.1 In `src/ui/keyboards.ts`, update `workspaceActionKeyboard(ws)` to add a `🗑 Delete` button row between Stop/Start and the Open in Coder link

## 3. Handlers

- [x] 3.1 In `src/ui/handlers/workspace-menu.ts`, add `ws:delete:<name>` handler: show confirmation prompt using `confirmKeyboard`
- [x] 3.2 In `src/ui/handlers/workspace-menu.ts`, add `ws:delete:confirm:<name>` handler: call `deleteWorkspace`, confirm with message, call `showWorkspaceList`
- [x] 3.3 In `src/ui/handlers/workspace-menu.ts`, add `ws:delete:cancel:<name>` handler: re-fetch workspace and show action menu (mirrors `ws:stop:cancel` pattern)
