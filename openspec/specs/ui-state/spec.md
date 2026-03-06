## Requirements

### Requirement: UI state tracks wizard progress per chat
The UI state store SHALL maintain per-chat wizard state including the current step, mode (`task` or `workspace`), accumulated selections, and `messageId` for single-message editing.

#### Scenario: Wizard starts
- **WHEN** the task creation wizard begins for a chat
- **THEN** the store SHALL initialize state for that chat with step 1, mode, and the wizard message ID

#### Scenario: Selection stored between steps
- **WHEN** the user makes a selection in any wizard step
- **THEN** the store SHALL update the state for that chat with the new selection and advance the step counter

#### Scenario: Wizard completes or cancels
- **WHEN** the wizard completes (task/workspace created) or is cancelled
- **THEN** the store SHALL remove the wizard state for that chat

### Requirement: UI state tracks pending key setup per chat
The UI state store SHALL track whether a chat is awaiting an API key input.

#### Scenario: Key setup initiated
- **WHEN** the user starts the key setup flow
- **THEN** the store SHALL set `pendingKeySetup = true` for that chat

#### Scenario: Key setup completed or cancelled
- **WHEN** the user sends a key or presses a button
- **THEN** the store SHALL clear the `pendingKeySetup` state

### Requirement: UI state tracks pending admin add per chat
The UI state store SHALL track whether a chat is awaiting a user ID input for the admin add-user flow.

#### Scenario: Admin add initiated
- **WHEN** an admin starts the add-user flow
- **THEN** the store SHALL set `pendingAdminAdd = true` for that chat

#### Scenario: Admin add completed or cancelled
- **WHEN** the admin sends a user ID or presses a button
- **THEN** the store SHALL clear the `pendingAdminAdd` state

### Requirement: UI state tracks global view toggle per user
The UI state store SHALL track whether a user has enabled the global (all-users) task view.

#### Scenario: Global view toggled
- **WHEN** an admin toggles the global view
- **THEN** the store SHALL set `globalView` for that user ID

### Requirement: Any button press cancels pending text input
If a user taps any inline button while in a pending text input state (key setup, admin add, or wizard), the current text-awaiting state SHALL be cleared.

#### Scenario: Button tapped during pending input
- **WHEN** a user taps any inline keyboard button while the store has a pending text input state for that chat
- **THEN** the store SHALL clear the pending state before processing the button action
