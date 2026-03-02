### Requirement: Delete task requires confirmation
The system SHALL show a confirmation prompt before deleting a task.

#### Scenario: User clicks Delete
- **WHEN** the user taps 🗑 Delete in the task menu
- **THEN** the bot SHALL send a message asking "Delete task *<name>*? This cannot be undone." with ✅ Yes and ❌ No buttons

#### Scenario: User confirms deletion
- **WHEN** the user taps ✅ Yes on the delete confirmation
- **THEN** the bot SHALL delete the task via the Coder API and confirm deletion to the user

#### Scenario: User cancels deletion
- **WHEN** the user taps ❌ No on the delete confirmation
- **THEN** the bot SHALL dismiss and send the task menu again without deleting

### Requirement: Stop workspace requires confirmation
The system SHALL show a confirmation prompt before stopping a workspace.

#### Scenario: User clicks Stop
- **WHEN** the user taps ⏹ Stop in the workspace action menu
- **THEN** the bot SHALL send a message asking "Stop workspace *<name>*?" with ✅ Yes and ❌ No buttons

#### Scenario: User confirms stop
- **WHEN** the user taps ✅ Yes on the stop confirmation
- **THEN** the bot SHALL stop the workspace via the Coder API and confirm to the user

#### Scenario: User cancels stop
- **WHEN** the user taps ❌ No on the stop confirmation
- **THEN** the bot SHALL dismiss and show the workspace action menu again without stopping
