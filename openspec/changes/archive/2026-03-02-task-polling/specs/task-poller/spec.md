## ADDED Requirements

### Requirement: Poller monitors active task sessions at a fixed interval
The bot SHALL run a background interval loop that checks the status of every task registered in the session store. The interval SHALL default to 15 000 ms and be configurable via the `POLL_INTERVAL_MS` environment variable.

#### Scenario: Poller starts with the bot
- **WHEN** the bot starts
- **THEN** the poller SHALL start its interval loop and log the configured interval

#### Scenario: No active sessions
- **WHEN** the poller fires and the session store is empty
- **THEN** the poller SHALL skip all API calls and log nothing

### Requirement: Poller notifies user when task transitions to stopped
The poller SHALL call `notifyTaskComplete` when a task's status changes to `stopped` and the last known status was not already `stopped`.

#### Scenario: Task becomes stopped
- **WHEN** the poller fetches a task and its status is `stopped`, and the stored `lastKnownStatus` is not `stopped`
- **THEN** the poller SHALL call `notifyTaskComplete(taskId, chatId, bot)` and update `lastKnownStatus` to `stopped`

#### Scenario: Task already stopped from last poll
- **WHEN** the poller fetches a task whose status is still `stopped` and `lastKnownStatus` is already `stopped`
- **THEN** the poller SHALL NOT send a second notification

#### Scenario: Task not yet stopped
- **WHEN** the poller fetches a task whose status is `active` or `initializing`
- **THEN** the poller SHALL update `lastKnownStatus` and send no notification

### Requirement: Poller handles API errors gracefully
The poller SHALL not crash on individual task fetch errors.

#### Scenario: Task returns 404 (deleted externally)
- **WHEN** `getTask(taskId)` returns a 404 error
- **THEN** the poller SHALL remove the task session from the store and log a message

#### Scenario: Transient API error
- **WHEN** `getTask(taskId)` throws a non-404 error
- **THEN** the poller SHALL log the error and continue to the next session without crashing
