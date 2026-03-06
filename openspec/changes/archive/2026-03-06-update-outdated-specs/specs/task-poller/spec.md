## MODIFIED Requirements

### Requirement: Poller monitors active task sessions at a fixed interval
The bot SHALL run a background interval loop that checks the status of every task registered in the session store. The interval SHALL default to 15 000 ms. A concurrency guard SHALL prevent overlapping poll cycles.

#### Scenario: Poller starts with the bot
- **WHEN** the bot starts
- **THEN** the poller SHALL start its interval loop and log the configured interval

#### Scenario: No active sessions
- **WHEN** the poller fires and the session store is empty
- **THEN** the poller SHALL skip all API calls and return immediately

#### Scenario: Previous cycle still running
- **WHEN** the poller fires while a previous cycle is still running
- **THEN** the poller SHALL skip the cycle and log a debug message

### Requirement: Poller updates live cards on state changes
The poller SHALL call `updateCard()` when a task's status or agent state changes.

#### Scenario: Status changed
- **WHEN** the poller fetches a task and `status !== lastKnownStatus`
- **THEN** the poller SHALL call `updateCard()` with the current task data, `lastPrompt`, `statusSnippet` (agent message), and `presetName`

#### Scenario: Agent state changed
- **WHEN** the poller fetches a task and `agentState !== lastKnownAgentState`
- **THEN** the poller SHALL call `updateCard()` with the updated agent state

#### Scenario: Card deleted by user
- **WHEN** `updateCard()` returns `false` (message not found)
- **THEN** the poller SHALL send a new card via `sendCard()` and update `cardMessageId`

### Requirement: Poller sends delayed completion logs
The poller SHALL delay sending completion logs by one poll cycle to ensure logs are fully written.

#### Scenario: AI finishes — first detection
- **WHEN** agent state transitions to `idle` from `working` or `complete` (while task is `active`)
- **THEN** the poller SHALL set `pendingLogSend = true` and NOT send the log yet

#### Scenario: First-seen done task (auto-discovered)
- **WHEN** `agentState === 'idle'` and `lastKnownAgentState === undefined` and `status === 'active'`
- **THEN** the poller SHALL set `pendingLogSend = true`

#### Scenario: Second poll cycle — still idle
- **WHEN** `pendingLogSend === true` and agent state is still `idle`
- **THEN** the poller SHALL fetch logs, parse them via `extractLastResponse()`, calculate duration from `workingStartedAt`, and send the log message via `sendLogMessage()`

#### Scenario: Agent starts working again before log sent
- **WHEN** `pendingLogSend === true` but agent state is `working`
- **THEN** the poller SHALL cancel the pending log send

#### Scenario: Skip log after /model change
- **WHEN** `pendingLogSend` is ready and `lastPrompt` starts with `/model`
- **THEN** the poller SHALL skip sending the log message

### Requirement: Poller handles API errors gracefully
The poller SHALL not crash on individual task fetch errors.

#### Scenario: Task returns 404 (deleted externally)
- **WHEN** `getTask(taskId)` returns a 404 error
- **THEN** the poller SHALL remove the task session from the store and log a message

#### Scenario: Auth expired
- **WHEN** `getTask(taskId)` throws a `CoderAuthError`
- **THEN** the poller SHALL clear the user's API key and log a warning

#### Scenario: Transient API error
- **WHEN** `getTask(taskId)` throws a non-404, non-auth error
- **THEN** the poller SHALL log the error and continue to the next session

### Requirement: Poller auto-discovers externally created tasks
The poller SHALL discover tasks created outside the bot (e.g., via web UI) and register them for tracking.

#### Scenario: New non-terminal task found
- **WHEN** a user has an API key and a task exists that is not in the session store and is not in a terminal state (`stopped`, `error`, `unknown`)
- **THEN** the poller SHALL register the task with `chatId = userId` (DM) and update its status

#### Scenario: Terminal task ignored
- **WHEN** a task is in a terminal state
- **THEN** the poller SHALL NOT register it

### Requirement: Poller logs a summary line per cycle at debug level
The poller SHALL emit one `debug` log line per cycle summarising the work done, with fields: `usersPolled`, `tasksChecked`, `stateChanges`.

#### Scenario: Normal cycle with active sessions
- **WHEN** the poller completes a cycle with 2 users and 5 tasks, 1 of which transitioned
- **THEN** the poller SHALL log at `debug`: `msg="poller cycle" usersPolled=2 tasksChecked=5 stateChanges=1`

### Requirement: Poller logs each state transition at info level
When a task's status or agent state changes, the poller SHALL emit `info` log lines.

#### Scenario: Task status transition
- **WHEN** a task's status changes
- **THEN** the poller SHALL log: `msg="task status change" taskId=<id> from=<old> to=<new> userId=<id>`

#### Scenario: Agent state transition
- **WHEN** a task's agent state changes
- **THEN** the poller SHALL log: `msg="task agent state change" taskId=<id> from=<old> to=<new> userId=<id>`
