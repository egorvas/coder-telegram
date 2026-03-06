## MODIFIED Requirements

### Requirement: Delete task requires confirmation
The system SHALL show an inline confirmation by editing the current message when deleting a task.

#### Scenario: User clicks Delete on card
- **WHEN** the user taps `🗑 Delete` on the task card
- **THEN** the bot SHALL edit the card message to show `Delete task *{name}*? This cannot be undone.` with `✅ Yes` and `❌ No` buttons

#### Scenario: User confirms deletion
- **WHEN** the user taps `✅ Yes` on the delete confirmation
- **THEN** the bot SHALL delete the task via the Coder API, remove from session store, and edit the message to `🗑 Task {id} deleted.`

#### Scenario: User cancels deletion
- **WHEN** the user taps `❌ No` on the delete confirmation
- **THEN** the bot SHALL restore the original card text and keyboard by re-fetching the task

### Requirement: Stop workspace requires confirmation
The system SHALL show an inline confirmation by editing the current message when stopping a workspace.

#### Scenario: User clicks Stop
- **WHEN** the user taps `⏹ Stop` in the workspace action menu
- **THEN** the bot SHALL edit the message to show `Stop workspace *{name}*?` with `✅ Yes` and `❌ No` buttons

#### Scenario: User confirms stop
- **WHEN** the user taps `✅ Yes` on the stop confirmation
- **THEN** the bot SHALL stop the workspace via the Coder API, confirm, and return to the workspace list

#### Scenario: User cancels stop
- **WHEN** the user taps `❌ No` on the stop confirmation
- **THEN** the bot SHALL restore the workspace action menu by re-fetching and editing the message

### Requirement: Delete workspace requires confirmation
The system SHALL show an inline confirmation by editing the current message when deleting a workspace.

#### Scenario: User clicks Delete workspace
- **WHEN** the user taps `🗑 Delete` in the workspace action menu
- **THEN** the bot SHALL edit the message to show `Delete workspace *{name}*? This cannot be undone.` with `✅ Yes` and `❌ No` buttons

#### Scenario: User confirms workspace deletion
- **WHEN** the user taps `✅ Yes` on the delete confirmation
- **THEN** the bot SHALL delete the workspace via the Coder API and edit the message to confirm deletion

#### Scenario: User cancels workspace deletion
- **WHEN** the user taps `❌ No` on the delete confirmation
- **THEN** the bot SHALL restore the workspace action menu
