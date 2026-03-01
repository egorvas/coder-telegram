## ADDED Requirements

### Requirement: Store associates task ID with Telegram chat
The task session store SHALL maintain an in-memory map from task ID to Telegram chat ID and user ID, so that notifications can be routed to the correct chat.

#### Scenario: Task registered after creation
- **WHEN** a user creates an AI task via the bot
- **THEN** the store SHALL record the task ID mapped to the user's chat ID

#### Scenario: Task session retrieved by ID
- **WHEN** the webhook server or completion flow requests the session for a task ID
- **THEN** the store SHALL return the associated chat ID, or `null` if not found

#### Scenario: Task session removed after completion
- **WHEN** the task completion flow finishes (task deleted or user dismisses)
- **THEN** the store SHALL remove the task ID entry to avoid memory leaks

### Requirement: Store supports multiple concurrent tasks
The store SHALL support any number of simultaneously active tasks mapped to different or the same chat.

#### Scenario: Two tasks from same chat
- **WHEN** a user creates two tasks in the same chat
- **THEN** both task IDs SHALL be independently tracked and each SHALL route notifications to that chat

#### Scenario: Tasks from different chats
- **WHEN** tasks are created from multiple different chats
- **THEN** each task ID SHALL route only to its originating chat

### Requirement: Store tracks pending append state per chat
The store SHALL track whether a chat is awaiting a follow-up append prompt, keyed by chat ID.

#### Scenario: Append state set after button click
- **WHEN** a user clicks the "Append" inline button for a task
- **THEN** the store SHALL mark that chat as awaiting append input, associated with the task ID

#### Scenario: Append state cleared after prompt sent
- **WHEN** the user sends the follow-up text and the prompt is appended
- **THEN** the store SHALL clear the pending append state for that chat
