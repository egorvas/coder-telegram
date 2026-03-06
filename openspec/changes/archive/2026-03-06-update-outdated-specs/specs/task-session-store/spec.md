## MODIFIED Requirements

### Requirement: Store associates task ID with Telegram chat
The task session store SHALL maintain a per-user map from task ID to session data, persisted to a JSON file. Each session SHALL track: `chatId`, `cardMessageId`, `logMessageId`, `lastKnownStatus`, `lastKnownAgentState`, `lastPrompt`, `presetName`, `workingStartedAt`, `pendingLogSend`.

#### Scenario: Task registered after creation
- **WHEN** a user creates an AI task via the bot
- **THEN** the store SHALL record the task ID mapped to `{ chatId }` under the user's entry and persist to disk

#### Scenario: Task session retrieved by ID
- **WHEN** the system requests the session for a task ID and user ID
- **THEN** the store SHALL return the associated session, or `null` if not found

#### Scenario: Task session removed
- **WHEN** the task is deleted
- **THEN** the store SHALL remove the task ID entry and persist to disk

### Requirement: Store tracks card and log message IDs
The store SHALL track the Telegram message IDs for both the live card and the completion log message, enabling reply-based interaction.

#### Scenario: Card message ID set
- **WHEN** a card is sent or re-created
- **THEN** the store SHALL update `cardMessageId` for the task

#### Scenario: Log message ID set
- **WHEN** a completion log message is sent
- **THEN** the store SHALL update `logMessageId` for the task

#### Scenario: Reply matching via message ID
- **WHEN** `findByReplyMessageId(chatId, userId, messageId)` is called
- **THEN** the store SHALL search all sessions for the user where `cardMessageId` or `logMessageId` matches, and return the `taskId`

### Requirement: Store tracks last known status and agent state per task
The store SHALL record `lastKnownStatus` and `lastKnownAgentState` for each task, updated by the poller.

#### Scenario: Status and agent state updated after poll
- **WHEN** the poller observes a task status and agent state
- **THEN** the store SHALL update both fields and persist to disk

#### Scenario: Working timer started
- **WHEN** agent state transitions to `working` (and was not previously `working`)
- **THEN** the store SHALL set `workingStartedAt = Date.now()`

### Requirement: Store tracks last prompt and preset name
The store SHALL record `lastPrompt` (the most recent user-appended prompt) and `presetName` (from wizard selection) per task.

#### Scenario: Last prompt updated on append
- **WHEN** a user appends a prompt (via reply or model change)
- **THEN** the store SHALL update `lastPrompt` and persist

#### Scenario: Preset name set during wizard
- **WHEN** a task is created via the wizard with a preset selected
- **THEN** the store SHALL store `presetName`

### Requirement: Store tracks pending log send flag
The store SHALL track `pendingLogSend` per task for the delayed log sending mechanism.

#### Scenario: Pending log send set
- **WHEN** the poller detects AI finished (first cycle)
- **THEN** the store SHALL set `pendingLogSend = true`

#### Scenario: Pending log send cleared
- **WHEN** the log is sent or the agent resumes working
- **THEN** the store SHALL set `pendingLogSend = false`

### Requirement: Store exposes all sessions for poller iteration
The store SHALL provide a `getAllSessions()` method that returns all active sessions across all users as a flat array.

#### Scenario: Multiple users with tasks
- **WHEN** tasks from multiple users are registered
- **THEN** `getAllSessions()` SHALL return all of them including `taskId`, `chatId`, `userId`, `lastKnownStatus`, `lastKnownAgentState`, `cardMessageId`, `logMessageId`, `lastPrompt`

### Requirement: Store persists to disk
The store SHALL persist all session data to a JSON file on every mutation and load it on startup.

#### Scenario: Data loaded on startup
- **WHEN** the bot starts and the session file exists
- **THEN** the store SHALL load all sessions from the file

#### Scenario: Data preserved across restarts
- **WHEN** a session is registered, updated, or removed
- **THEN** the store SHALL write the updated state to disk, preserving other sections in the file (e.g., user registry)

## REMOVED Requirements

### Requirement: Store tracks pending append state per chat
**Reason**: The "Append" button no longer exists. Users reply to messages instead. Pending append state is no longer needed.
**Migration**: Remove any references to pending append state. Reply-based interaction uses `findByReplyMessageId` instead.
