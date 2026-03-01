## ADDED Requirements

### Requirement: Wizard Step 1 — select workspace
The task creation wizard SHALL begin by presenting available workspaces as inline buttons for the user to select.

#### Scenario: Workspaces available
- **WHEN** the user starts the task creation wizard
- **THEN** the bot SHALL send a new message asking "Select a workspace:" with each workspace as an inline button, plus a Cancel button

#### Scenario: No workspaces available
- **WHEN** the user starts the wizard but no workspaces exist
- **THEN** the bot SHALL send a message stating no workspaces are available and offer a back button

#### Scenario: User selects a workspace
- **WHEN** the user taps a workspace button in Step 1
- **THEN** the bot SHALL store the selection in UI state and advance to Step 2 (select template)

### Requirement: Wizard Step 2 — select template
After selecting a workspace, the wizard SHALL present available templates as inline buttons.

#### Scenario: Templates available
- **WHEN** Step 2 is reached
- **THEN** the bot SHALL edit the message to show "Select a template:" with each template as an inline button, plus a Back and Cancel button

#### Scenario: User selects a template
- **WHEN** the user taps a template button in Step 2
- **THEN** the bot SHALL store the selection and advance to Step 3 (select preset)

### Requirement: Wizard Step 3 — select preset
After selecting a template, the wizard SHALL present available presets as inline buttons.

#### Scenario: Presets available
- **WHEN** Step 3 is reached
- **THEN** the bot SHALL edit the message to show "Select a preset:" with each preset as an inline button (showing name and description), plus a Back and Cancel button

#### Scenario: Template has no presets
- **WHEN** Step 3 is reached but the template has no presets
- **THEN** the bot SHALL skip to Step 4, noting "No presets available — using template defaults"

#### Scenario: User selects a preset
- **WHEN** the user taps a preset button
- **THEN** the bot SHALL store the selection and advance to Step 4 (enter prompt)

### Requirement: Wizard Step 4 — enter prompt
The wizard SHALL ask the user to type the task prompt as a free-text message.

#### Scenario: Prompt step shown
- **WHEN** Step 4 is reached
- **THEN** the bot SHALL send a message: "Enter your task prompt:" and await the user's next text message; a Cancel button SHALL be shown

#### Scenario: User enters prompt and task is created
- **WHEN** the user sends a text message while in Step 4
- **THEN** the bot SHALL call `createTask` with the accumulated wizard selections, confirm the new task with its ID, register it in the task session store, and clear wizard state

#### Scenario: Task creation fails
- **WHEN** the API returns an error during task creation
- **THEN** the bot SHALL send an error message and offer to retry (return to Step 4) or cancel

### Requirement: Wizard Cancel clears state and returns to menu
The wizard SHALL include a Cancel button on every step that aborts the flow.

#### Scenario: User taps Cancel at any step
- **WHEN** the user taps Cancel during any wizard step
- **THEN** the bot SHALL clear the wizard UI state and return to the main menu
