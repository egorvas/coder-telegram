## Why

The workspace action menu currently only offers Start/Stop. There is no way to delete a workspace from the Telegram bot — users must switch to the Coder web UI to do so. Adding a Delete button closes this gap and makes the bot sufficient for full workspace lifecycle management.

## What Changes

- Add `🗑 Delete` button to the workspace action menu
- Tapping Delete shows a confirmation prompt; user must confirm before deletion proceeds
- On confirmation, call `POST /api/v2/workspaces/{id}/builds` with `{ transition: "delete" }` and return to the workspace list
- Add `deleteWorkspace(name)` method to `CoderClient`

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `workspace-action-menu`: Add context-sensitive Delete button with confirmation

## Impact

- `src/coder/client.ts` — add `deleteWorkspace(name)` method
- `src/ui/keyboards.ts` — add Delete button to `workspaceActionKeyboard`
- `src/ui/handlers/workspace-menu.ts` — add `ws:delete`, `ws:delete:confirm`, `ws:delete:cancel` handlers
