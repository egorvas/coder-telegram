## Requirements

### Requirement: List tasks command
The bot SHALL provide a `/tasks` command that opens the task dashboard with all AI tasks as inline buttons.

#### Scenario: User sends /tasks
- **WHEN** a user sends `/tasks`
- **THEN** the bot SHALL display the task dashboard with all tasks as inline buttons

### Requirement: Create task command
The bot SHALL provide a `/task_create` command that starts the task creation wizard.

#### Scenario: User sends /task_create
- **WHEN** a user sends `/task_create`
- **THEN** the bot SHALL start the task creation wizard (Step 1: select template)
