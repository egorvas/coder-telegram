## 1. UI State Store

- [x] 1.1 Create `src/ui/state.ts` — `UiStateStore` class: per-chat wizard state (step, workspaceName, templateName, presetName) and pending append state; methods: `getWizard`, `setWizard`, `clearWizard`, `setPendingAppend`, `getPendingAppend`, `clearPendingAppend`
- [x] 1.2 Export singleton `uiState` instance

## 2. Keyboard Builders

- [x] 2.1 Create `src/ui/keyboards.ts` — `mainMenuKeyboard()`: inline keyboard with AI Tasks / Workspaces / Templates buttons
- [x] 2.2 Add `taskDashboardKeyboard(tasks)`: rows with task name+status button + Logs / Append / Delete buttons per task, plus Refresh and New Task buttons
- [x] 2.3 Add `workspaceListKeyboard(workspaces)`: one button per workspace showing name + status
- [x] 2.4 Add `workspaceActionKeyboard(workspace)`: Start or Stop button (context-sensitive) + Back button
- [x] 2.5 Add `templateListKeyboard(templates)`: one button per template + Back button
- [x] 2.6 Add `presetListKeyboard(presets, templateName)`: one button per preset (name + description) + Back and Cancel buttons
- [x] 2.7 Add `wizardWorkspaceKeyboard(workspaces)`: workspace selection for Step 1 + Cancel
- [x] 2.8 Add `wizardTemplateKeyboard(templates)`: template selection for Step 2 + Back + Cancel
- [x] 2.9 Add `cancelKeyboard()`: single Cancel button for Step 4 (prompt input)

## 3. Main Menu

- [x] 3.1 Create `src/ui/handlers/main-menu.ts` — update `/start` handler to send main menu keyboard
- [x] 3.2 Register callback handler for `menu:tasks` → show task dashboard
- [x] 3.3 Register callback handler for `menu:workspaces` → show workspace list
- [x] 3.4 Register callback handler for `menu:templates` → show template list
- [x] 3.5 Register callback handler for `menu:main` (back button) → edit message to main menu

## 4. Task Dashboard

- [x] 4.1 Create `src/ui/handlers/task-dashboard.ts` — fetch tasks from all workspaces, render dashboard with `taskDashboardKeyboard`
- [x] 4.2 Register callback handler for `dashboard:refresh` → re-fetch and edit message
- [x] 4.3 Register callback handler for `dashboard:new` → start wizard (step 1)
- [x] 4.4 Register callback handler for `task:logs:<id>` → fetch and send logs + action keyboard
- [x] 4.5 Register callback handler for `task:delete:<id>` → delete task, confirm, refresh dashboard
- [x] 4.6 Register callback handler for `task:append:<id>` → set pending append in uiState, ask for prompt

## 5. Task Creation Wizard

- [x] 5.1 Create `src/ui/handlers/wizard.ts` — step 1: fetch workspaces, send wizard workspace keyboard
- [x] 5.2 Register callback handler for `wizard:ws:<name>` → store workspace, fetch templates, show step 2
- [x] 5.3 Register callback handler for `wizard:tpl:<name>` → store template, fetch presets, show step 3 (or step 4 if no presets)
- [x] 5.4 Register callback handler for `wizard:preset:<name>` → store preset, show step 4 (prompt input)
- [x] 5.5 Add text message handler: if chat has wizard step 4 state → create task, register session, confirm, clear wizard state
- [x] 5.6 Register callback handler for `wizard:cancel` → clear wizard state, return to main menu
- [x] 5.7 Register callback handler for `wizard:back` → decrement step, re-render previous step

## 6. Workspace Action Menu

- [x] 6.1 Create `src/ui/handlers/workspace-menu.ts` — workspace list view using `workspaceListKeyboard`
- [x] 6.2 Register callback handler for `ws:select:<name>` → show workspace action menu
- [x] 6.3 Register callback handler for `ws:start:<name>` → start workspace, confirm, refresh action menu
- [x] 6.4 Register callback handler for `ws:stop:<name>` → stop workspace, confirm, refresh action menu
- [x] 6.5 Register callback handler for `ws:back` → return to workspace list

## 7. Template Browser (UI)

- [x] 7.1 Create `src/ui/handlers/template-browser.ts` — template list view using `templateListKeyboard`
- [x] 7.2 Register callback handler for `tpl:select:<name>` → fetch presets, show preset list (read-only, with Back)

## 8. Integration

- [x] 8.1 Register all UI callback handlers in `src/bot.ts`
- [x] 8.2 Add general text message handler: check `uiState` for pending append → call `appendTaskPrompt`, confirm, clear state
- [x] 8.3 Ensure any inline button press clears pending text input state (in callback query middleware)
