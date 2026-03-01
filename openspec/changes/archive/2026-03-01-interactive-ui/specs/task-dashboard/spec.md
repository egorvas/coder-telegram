## ADDED Requirements

### Requirement: Task dashboard lists all active tasks
The task dashboard SHALL show all AI tasks across all workspaces, grouped or listed with their status.

#### Scenario: Tasks exist across workspaces
- **WHEN** the task dashboard is opened
- **THEN** the bot SHALL display each task as a row showing: task name (truncated), workspace name, and status; and provide per-task action buttons: "Logs", "Append", "Delete"

#### Scenario: No tasks exist
- **WHEN** the task dashboard is opened and no tasks exist in any workspace
- **THEN** the bot SHALL display a "No active tasks" message with a "New Task" button and a back button

#### Scenario: Tasks list exceeds display limit
- **WHEN** there are more than 10 tasks total
- **THEN** the bot SHALL show the first 10 tasks and append a note with the total count

### Requirement: Task dashboard includes a New Task button
The task dashboard SHALL always include a "+ New Task" button that starts the task creation wizard.

#### Scenario: User taps New Task
- **WHEN** a user taps "+ New Task" from the task dashboard
- **THEN** the bot SHALL start the task creation wizard (Step 1: select workspace)

### Requirement: Task dashboard includes a Refresh button
The dashboard SHALL include a "Refresh" button to re-fetch current task statuses.

#### Scenario: User taps Refresh
- **WHEN** a user taps the Refresh button on the task dashboard
- **THEN** the bot SHALL re-fetch all tasks and edit the message with the updated list

### Requirement: Per-task Logs button shows task output
Each task row SHALL have a "Logs" button that fetches and displays the task's latest log output.

#### Scenario: User taps Logs for a task
- **WHEN** a user taps "Logs" for a task
- **THEN** the bot SHALL send a new message with the last 50 lines of log output and inline buttons "Append" and "Delete" for that task (reusing the task completion flow)

### Requirement: Per-task Delete button removes the task
Each task row SHALL have a "Delete" button that deletes the task after implicit confirmation.

#### Scenario: User taps Delete for a task
- **WHEN** a user taps "Delete" for a task
- **THEN** the bot SHALL delete the task via the API, confirm with a new message, and refresh the dashboard

### Requirement: Per-task Append button starts prompt input
Each task row SHALL have an "Append" button that initiates the append prompt flow.

#### Scenario: User taps Append for a task
- **WHEN** a user taps "Append" for a task
- **THEN** the bot SHALL set the pending append state for that task and ask the user to enter a follow-up prompt
