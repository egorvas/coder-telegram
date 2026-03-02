## MODIFIED Requirements

### Requirement: Per-task Logs button shows task output
Each task row SHALL have a "Logs" button that fetches and displays the task's latest log output as an inline truncated preview, and a "Full Log" button that sends the complete log as a document. The task submenu SHALL also show a context-sensitive pause or resume button based on the task's current status.

#### Scenario: User taps Logs for a task
- **WHEN** a user taps "Logs" for a task
- **THEN** the bot SHALL send a new message with the last portion of log output (truncated to fit Telegram's limit) and inline buttons for that task

#### Scenario: User taps Full Log for a task
- **WHEN** a user taps "Full Log" for a task
- **THEN** the bot SHALL send the complete log as a `.txt` Telegram document with no truncation

#### Scenario: Task submenu shows pause button for active task
- **WHEN** the task submenu is shown for a task with status `active` or `initializing`
- **THEN** the bot SHALL include an "⏸ Pause" button in the submenu keyboard

#### Scenario: Task submenu shows resume button for paused task
- **WHEN** the task submenu is shown for a task with status `paused`
- **THEN** the bot SHALL include a "▶️ Resume" button in the submenu keyboard
