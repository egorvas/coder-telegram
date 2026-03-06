## MODIFIED Requirements

### Requirement: Task dashboard lists all active tasks
The task dashboard SHALL show all AI tasks as inline buttons with name and status, limited to 10 tasks.

#### Scenario: Tasks exist
- **WHEN** the task dashboard is opened
- **THEN** the bot SHALL display each task as an inline button showing: `{name} — {status}`, plus `🔄 Refresh` and `➕ New Task` buttons, and a `« Main Menu` back button

#### Scenario: No tasks exist
- **WHEN** the task dashboard is opened and no tasks exist
- **THEN** the bot SHALL display "No active tasks found." with `🔄 Refresh`, `➕ New Task`, and `« Main Menu` buttons

### Requirement: Task dashboard includes a New Task button
The task dashboard SHALL always include a "➕ New Task" button that starts the task creation wizard.

#### Scenario: User taps New Task
- **WHEN** a user taps "➕ New Task" from the task dashboard
- **THEN** the bot SHALL start the task creation wizard (Step 1: select template)

### Requirement: Task dashboard includes a Refresh button
The dashboard SHALL include a "🔄 Refresh" button to re-fetch current task statuses.

#### Scenario: User taps Refresh
- **WHEN** a user taps the Refresh button on the task dashboard
- **THEN** the bot SHALL re-fetch all tasks and edit the message with the updated list

### Requirement: Selecting a task re-creates the live card
Selecting a task from the dashboard SHALL delete the old card (if any) and send a fresh card at the bottom of the chat.

#### Scenario: User taps a task
- **WHEN** a user taps a task button in the dashboard
- **THEN** the bot SHALL delete the existing card message (if `cardMessageId` exists), send a new card via `sendCard()` with current status, `lastPrompt`, `statusSnippet`, and `presetName`, and update `cardMessageId` in the session store

## REMOVED Requirements

### Requirement: Per-task Logs button shows task output
**Reason**: Replaced by the live card with inline `📄 Full Log` button. Task selection re-creates a card, not a log view.
**Migration**: Full Log is available as a button on the live card keyboard.

### Requirement: Per-task Delete button removes the task
**Reason**: Delete is on the live card keyboard with inline confirmation. Not a separate dashboard action.
**Migration**: Delete functionality is part of the card keyboard (`task:delete:{id}`).

### Requirement: Per-task Append button starts prompt input
**Reason**: Replaced by reply-based interaction. Users reply to the card or log message.
**Migration**: No migration needed — reply-based interaction is implemented.

### Requirement: Task submenu shows pause button for active task
**Reason**: Pause/resume functionality was removed from the bot.
**Migration**: None needed.

### Requirement: Task submenu shows resume button for paused task
**Reason**: Pause/resume functionality was removed from the bot.
**Migration**: None needed.
