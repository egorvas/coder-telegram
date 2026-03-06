## MODIFIED Requirements

### Requirement: Wizard Step 1 — select template
The task creation wizard SHALL begin by presenting available templates as inline buttons in a single dynamic message. The wizard supports two modes: `task` and `workspace`.

#### Scenario: Templates available
- **WHEN** the user starts the wizard
- **THEN** the bot SHALL send a message `*{label} — Step 1/3* — Select a template:` with each template as an inline button, plus Back and Cancel buttons

#### Scenario: No templates available
- **WHEN** the user starts the wizard but no templates exist
- **THEN** the bot SHALL send "No templates available." with a main menu keyboard

#### Scenario: User selects a template
- **WHEN** the user taps a template button
- **THEN** the bot SHALL edit the same message to show Step 2 (presets) if presets exist, or Step 3 (prompt) if no presets

### Requirement: Wizard Step 2 — select preset
After selecting a template, the wizard SHALL present available presets by editing the same message.

#### Scenario: Presets available
- **WHEN** Step 2 is reached
- **THEN** the bot SHALL edit the message to show `*Step 2/3* — Select a preset:` with each preset as an inline button (name, default marker, description), plus Back and Cancel buttons

#### Scenario: User selects a preset
- **WHEN** the user taps a preset button
- **THEN** the bot SHALL store the preset ID and name, then edit the message to show Step 3

### Requirement: Wizard Step 3 — enter prompt
The wizard SHALL ask the user to type the task prompt as a free-text message by editing the same message.

#### Scenario: Prompt step shown (task mode)
- **WHEN** Step 3 is reached in task mode
- **THEN** the bot SHALL edit the message to `*Step 3/3* — Enter a prompt:` with a Cancel button

#### Scenario: Prompt step shown (workspace mode)
- **WHEN** Step 3 is reached in workspace mode
- **THEN** the bot SHALL edit the message to `*Step 3/3* — Enter a prompt or skip:` with Skip and Cancel buttons

#### Scenario: User enters prompt and task is created
- **WHEN** the user sends a text message while in Step 3 (task mode)
- **THEN** the bot SHALL delete the wizard message, create the task, send a live card, register the session, and clear wizard state

#### Scenario: User enters prompt and workspace is created
- **WHEN** the user sends a text message while in Step 3 (workspace mode)
- **THEN** the bot SHALL delete the wizard message, create the workspace, confirm with workspace details, and show the workspace list

#### Scenario: User skips prompt (workspace mode)
- **WHEN** the user taps Skip in workspace mode
- **THEN** the bot SHALL create the workspace with an empty prompt

### Requirement: Wizard uses single dynamic message
All wizard steps SHALL edit the same message instead of sending new messages. The message ID is tracked in `WizardState.messageId`.

#### Scenario: Step transition edits message
- **WHEN** the wizard advances or goes back a step
- **THEN** the bot SHALL edit the existing message via `editMessageText`, falling back to sending a new message if editing fails

#### Scenario: Wizard cancel deletes message
- **WHEN** the user taps Cancel
- **THEN** the bot SHALL delete the wizard message and clear wizard state

#### Scenario: Wizard completion deletes message
- **WHEN** the task or workspace is created
- **THEN** the bot SHALL delete the wizard message before sending the result

### Requirement: Wizard Back button navigates to previous step
The wizard SHALL include a Back button that navigates to the previous step by editing the same message.

#### Scenario: Back from Step 2 (presets) to Step 1 (templates)
- **WHEN** the user taps Back on Step 2
- **THEN** the bot SHALL re-fetch templates and edit the message to show Step 1

#### Scenario: Back from Step 3 (prompt) to Step 2 (presets)
- **WHEN** the user taps Back on Step 3 and the template has presets
- **THEN** the bot SHALL re-fetch presets and edit the message to show Step 2

#### Scenario: Back from Step 3 (prompt) to Step 1 (templates) — no presets
- **WHEN** the user taps Back on Step 3 and the template has no presets
- **THEN** the bot SHALL re-fetch templates and edit the message to show Step 1

## REMOVED Requirements

### Requirement: Wizard Step 1 — select workspace
**Reason**: Workspace selection was removed from the wizard. Tasks are created with `templateVersionId` directly, without selecting a workspace first.
**Migration**: The wizard starts at template selection (Step 1 of 3).
