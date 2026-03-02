## 1. Shared keyboard helper

- [x] 1.1 Add `confirmKeyboard(yesAction: string, noAction: string)` to `src/ui/keyboards.ts` — returns inline keyboard with ✅ Yes / ❌ No buttons

## 2. Task delete confirmation

- [x] 2.1 Change `task:delete:<id>` handler in `task-dashboard.ts` to show confirm prompt instead of deleting immediately
- [x] 2.2 Add `task:delete:confirm:<id>` handler — calls `coderClient.deleteTask`, replies confirmation, shows task list
- [x] 2.3 Add `task:delete:cancel:<id>` handler — shows task menu for the task (no deletion)

## 3. Workspace stop confirmation

- [x] 3.1 Change `ws:stop:<name>` handler in `workspace-menu.ts` to show confirm prompt instead of stopping immediately
- [x] 3.2 Add `ws:stop:confirm:<name>` handler — calls `coderClient.stopWorkspace`, replies confirmation
- [x] 3.3 Add `ws:stop:cancel:<name>` handler — shows workspace action menu again (no stop)
