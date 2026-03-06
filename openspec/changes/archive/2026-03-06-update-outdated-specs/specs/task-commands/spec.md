## MODIFIED Requirements

### Requirement: List tasks command
The bot SHALL provide a `/tasks` command that opens the task dashboard (inline keyboard with task list).

#### Scenario: User sends /tasks
- **WHEN** a user sends `/tasks`
- **THEN** the bot SHALL display the task dashboard with all tasks as inline buttons

### Requirement: Create task command
The bot SHALL provide a `/task_create` command that starts the task creation wizard.

#### Scenario: User sends /task_create
- **WHEN** a user sends `/task_create`
- **THEN** the bot SHALL start the task creation wizard (Step 1: select template)

## REMOVED Requirements

### Requirement: Get task logs command
**Reason**: The `/task_logs <id>` command was removed. Logs are accessible via the Full Log button on the live card.
**Migration**: Use the `📄 Full Log` button on the task card.

### Requirement: Append prompt to task command
**Reason**: The `/task_append <id> <prompt>` command was removed. Users append prompts by replying to the card or log message.
**Migration**: Reply to the task card or log message with text.

### Requirement: Delete task command
**Reason**: The `/task_delete <id>` command was removed. Users delete tasks via the `🗑 Delete` button on the card.
**Migration**: Use the Delete button on the task card.
