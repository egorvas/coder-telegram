## ADDED Requirements

### Requirement: Client lists AI tasks
The Coder API client SHALL provide a method to list all AI tasks for a given workspace, returning task ID, status, template name, and creation time.

#### Scenario: Tasks exist for workspace
- **WHEN** the client requests tasks for a workspace
- **THEN** the client SHALL return an array of task objects with `id`, `status`, `template_display_name`, and `created_at`

#### Scenario: No tasks for workspace
- **WHEN** the client requests tasks for a workspace with no tasks
- **THEN** the client SHALL return an empty array

### Requirement: Client creates an AI task
The Coder API client SHALL provide a method to create a new AI task in a workspace from a specified template and initial prompt.

#### Scenario: Successful task creation
- **WHEN** the client creates a task with a valid workspace, template, and prompt
- **THEN** the client SHALL return the created task object containing at minimum `id` and `status`

#### Scenario: Invalid template on create
- **WHEN** the client attempts to create a task with a non-existent template name
- **THEN** the client SHALL throw an error describing the failure

### Requirement: Client gets AI task status
The Coder API client SHALL provide a method to get the current status and details of a specific task by ID.

#### Scenario: Task exists
- **WHEN** the client requests a task by its ID
- **THEN** the client SHALL return the full task object including `id`, `status`, `template_display_name`, `created_at`

#### Scenario: Task not found
- **WHEN** the client requests a task by a non-existent ID
- **THEN** the client SHALL throw an error indicating the task was not found

### Requirement: Client retrieves task logs
The Coder API client SHALL provide a method to retrieve the log output of a specific task, returning the last N lines.

#### Scenario: Task has logs
- **WHEN** the client requests logs for an existing task
- **THEN** the client SHALL return the task's log output as a string, truncated to the last 50 lines if longer

#### Scenario: Task has no logs yet
- **WHEN** the client requests logs for a task with no output yet
- **THEN** the client SHALL return an empty string

### Requirement: Client appends a prompt to a task
The Coder API client SHALL provide a method to send a follow-up prompt to an existing AI task, appending to its conversation context.

#### Scenario: Successful prompt append
- **WHEN** the client appends a prompt to an existing active task
- **THEN** the client SHALL send the prompt to the task and return confirmation

#### Scenario: Task not active on append
- **WHEN** the client appends a prompt to a task that is no longer active
- **THEN** the client SHALL throw an error indicating the task cannot accept new input

### Requirement: Client deletes an AI task
The Coder API client SHALL provide a method to delete an AI task by ID.

#### Scenario: Successful delete
- **WHEN** the client deletes an existing task by ID
- **THEN** the task SHALL be removed and the client SHALL return without error

#### Scenario: Task not found on delete
- **WHEN** the client attempts to delete a non-existent task ID
- **THEN** the client SHALL throw an error indicating the task was not found
