## ADDED Requirements

### Requirement: Completion notification sent to user
When a task completes (via webhook or manual check), the bot SHALL send a notification to the originating chat with the task status, truncated logs, and an inline keyboard.

#### Scenario: Task completed via webhook
- **WHEN** the webhook server receives a task completion event
- **THEN** the bot SHALL send a message to the originating chat containing: task ID, final status (e.g., succeeded/failed), last 50 lines of logs, and inline buttons "Append prompt" and "Delete task"

#### Scenario: User manually checks completed task
- **WHEN** a user sends `/task_logs <id>` for a task that is in a completed state
- **THEN** the bot SHALL send the logs and additionally include inline buttons "Append prompt" and "Delete task"

#### Scenario: Logs truncated
- **WHEN** the task log output exceeds 50 lines
- **THEN** the notification message SHALL include only the last 50 lines and append a note: "(showing last 50 lines)"

### Requirement: Inline "Append prompt" button
The completion message SHALL include an inline button that initiates a follow-up prompt flow.

#### Scenario: User clicks Append button
- **WHEN** a user clicks the "Append prompt" button on a completion message
- **THEN** the bot SHALL reply asking: "What do you want to add to the task?" and await the user's next text message

#### Scenario: User sends follow-up prompt
- **WHEN** the user responds with text while in pending append state
- **THEN** the bot SHALL call `appendTaskPrompt` with the task ID and the user's text, then confirm with a success message and clear the pending state

#### Scenario: Append fails
- **WHEN** the append API call fails (e.g., task no longer active)
- **THEN** the bot SHALL send a user-friendly error message and clear the pending state

### Requirement: Inline "Delete task" button
The completion message SHALL include an inline button that deletes the task.

#### Scenario: User clicks Delete button
- **WHEN** a user clicks the "Delete task" button on a completion message
- **THEN** the bot SHALL call `deleteTask` for the associated task ID, confirm deletion with a message, and remove the session from the store

#### Scenario: Delete fails
- **WHEN** the delete API call fails
- **THEN** the bot SHALL send a user-friendly error message

### Requirement: Multiple concurrent tasks handled independently
The completion flow SHALL handle notifications for multiple simultaneously running tasks without interference.

#### Scenario: Two tasks complete in sequence
- **WHEN** two tasks created from the same chat complete at different times
- **THEN** each SHALL generate its own notification message with its own inline keyboard, and actions on one SHALL NOT affect the other
