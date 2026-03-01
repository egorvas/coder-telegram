## ADDED Requirements

### Requirement: UI state tracks wizard progress per chat
The UI state store SHALL maintain per-chat wizard state including the current step and accumulated selections.

#### Scenario: Wizard starts
- **WHEN** the task creation wizard begins for a chat
- **THEN** the store SHALL initialize state for that chat with step 1 and empty selections

#### Scenario: Selection stored between steps
- **WHEN** the user makes a selection in any wizard step
- **THEN** the store SHALL update the state for that chat with the new selection and advance the step counter

#### Scenario: Wizard completes or cancels
- **WHEN** the wizard completes (task created) or is cancelled
- **THEN** the store SHALL remove the wizard state for that chat

### Requirement: UI state tracks pending append per chat
The UI state store SHALL track whether a chat is awaiting a free-text prompt input for the append flow (wizard or post-completion).

#### Scenario: Pending append set
- **WHEN** the user initiates an Append action for a specific task
- **THEN** the store SHALL record the pending append with the task ID for that chat

#### Scenario: Pending append cleared
- **WHEN** the user sends the follow-up text or presses Cancel
- **THEN** the store SHALL clear the pending append state for that chat

### Requirement: Any button press cancels pending text input
If a user taps any inline button while in a pending text input state (append prompt or wizard step 4), the current text-awaiting state SHALL be cleared.

#### Scenario: Button tapped during pending input
- **WHEN** a user taps any inline keyboard button while the store has a pending text input state for that chat
- **THEN** the store SHALL clear the pending state before processing the button action
