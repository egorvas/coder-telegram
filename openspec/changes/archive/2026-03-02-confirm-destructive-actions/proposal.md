## Why

Destructive and irreversible actions (delete task, stop workspace) execute immediately on button press with no confirmation. A misclick permanently deletes a task or interrupts a running workspace. Adding a "Are you sure?" step prevents accidental data loss.

## What Changes

- Clicking 🗑 Delete on a task now shows a confirmation message with ✅ Yes / ❌ No buttons instead of deleting immediately
- Clicking ⏹ Stop on a workspace now shows a confirmation message with ✅ Yes / ❌ No buttons instead of stopping immediately
- Confirming (Yes) executes the action; cancelling (No) dismisses and returns to the menu
- New callback actions: `task:delete:confirm:<id>`, `task:delete:cancel:<id>`, `ws:stop:confirm:<name>`, `ws:stop:cancel:<name>`

## Capabilities

### New Capabilities

- `confirm-destructive-actions`: Inline Yes/No confirmation step before executing delete-task and stop-workspace actions

### Modified Capabilities

## Impact

- `src/ui/keyboards.ts`: add `confirmKeyboard(yesAction, noAction)` helper
- `src/ui/handlers/task-dashboard.ts`: `task:delete:<id>` shows confirm prompt; new handlers for confirm/cancel
- `src/ui/handlers/workspace-menu.ts`: `ws:stop:<name>` shows confirm prompt; new handlers for confirm/cancel
