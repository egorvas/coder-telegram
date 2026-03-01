## ADDED Requirements

### Requirement: List tasks command
The bot SHALL provide a `/tasks <workspace>` command that lists all AI tasks for a given workspace.

#### Scenario: Tasks exist
- **WHEN** a user sends `/tasks myworkspace`
- **THEN** the bot SHALL reply with a formatted list of tasks showing ID, template name, status, and creation date

#### Scenario: No tasks for workspace
- **WHEN** a user sends `/tasks myworkspace` and no tasks exist
- **THEN** the bot SHALL reply indicating no tasks were found for that workspace

#### Scenario: Missing workspace argument
- **WHEN** a user sends `/tasks` without a workspace name
- **THEN** the bot SHALL reply with usage instructions: `/tasks <workspace_name>`

#### Scenario: API error during list
- **WHEN** the Coder API returns an error during task listing
- **THEN** the bot SHALL reply with a user-friendly error message

### Requirement: Create task command
The bot SHALL provide a `/task_create <workspace> <template> <prompt>` command that creates a new AI task.

#### Scenario: Successful task creation
- **WHEN** a user sends `/task_create myworkspace my-template Write tests for the auth module`
- **THEN** the bot SHALL create the task and reply with the new task ID and status

#### Scenario: Missing arguments on create
- **WHEN** a user sends `/task_create` with fewer than 3 arguments
- **THEN** the bot SHALL reply with usage instructions: `/task_create <workspace> <template> <prompt>`

#### Scenario: Template not found on create
- **WHEN** a user sends `/task_create` with an invalid template name
- **THEN** the bot SHALL reply indicating the template was not found

### Requirement: Get task logs command
The bot SHALL provide a `/task_logs <id>` command that returns the log output of a task.

#### Scenario: Task has logs
- **WHEN** a user sends `/task_logs abc123`
- **THEN** the bot SHALL reply with the last 50 lines of the task's log output, with a note if truncated

#### Scenario: Task has no logs
- **WHEN** a user sends `/task_logs abc123` and the task has no output yet
- **THEN** the bot SHALL reply indicating the task has no logs yet

#### Scenario: Missing task ID on logs
- **WHEN** a user sends `/task_logs` without a task ID
- **THEN** the bot SHALL reply with usage instructions: `/task_logs <task_id>`

#### Scenario: Task not found on logs
- **WHEN** a user sends `/task_logs` with a non-existent ID
- **THEN** the bot SHALL reply indicating the task was not found

### Requirement: Append prompt to task command
The bot SHALL provide a `/task_append <id> <prompt>` command that sends a follow-up prompt to an existing task.

#### Scenario: Successful prompt append
- **WHEN** a user sends `/task_append abc123 Add error handling too`
- **THEN** the bot SHALL append the prompt to the task and reply with a confirmation message

#### Scenario: Missing arguments on append
- **WHEN** a user sends `/task_append` with fewer than 2 arguments
- **THEN** the bot SHALL reply with usage instructions: `/task_append <task_id> <prompt>`

#### Scenario: Task not found on append
- **WHEN** a user sends `/task_append` with a non-existent task ID
- **THEN** the bot SHALL reply indicating the task was not found

### Requirement: Delete task command
The bot SHALL provide a `/task_delete <id>` command that deletes an AI task.

#### Scenario: Successful delete
- **WHEN** a user sends `/task_delete abc123`
- **THEN** the bot SHALL delete the task and reply with a confirmation message

#### Scenario: Missing task ID on delete
- **WHEN** a user sends `/task_delete` without a task ID
- **THEN** the bot SHALL reply with usage instructions: `/task_delete <task_id>`

#### Scenario: Task not found on delete
- **WHEN** a user sends `/task_delete` with a non-existent task ID
- **THEN** the bot SHALL reply indicating the task was not found
