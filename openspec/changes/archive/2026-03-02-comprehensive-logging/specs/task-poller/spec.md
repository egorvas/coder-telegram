## ADDED Requirements

### Requirement: Poller logs a summary line per cycle at debug level
The poller SHALL emit one `debug` log line per cycle summarising the work done, with fields: `usersPolled`, `tasksChecked`, `stateChanges`.

#### Scenario: Normal cycle with active sessions
- **WHEN** the poller completes a cycle with 2 users and 5 tasks, 1 of which transitioned
- **THEN** the poller SHALL log at `debug`: `msg="poller cycle" usersPolled=2 tasksChecked=5 stateChanges=1`

#### Scenario: Empty session store
- **WHEN** the poller fires and the session store is empty
- **THEN** the poller SHALL NOT emit a cycle log line (no work was done)

### Requirement: Poller logs each state transition at info level
When a task's status changes, the poller SHALL emit one `info` log line per transition with fields: `taskId`, `from` (previous status), `to` (new status), `userId`.

#### Scenario: Task transitions to stopped
- **WHEN** a task changes from `active` to `stopped`
- **THEN** the poller SHALL log at `info`: `msg="task state change" taskId=<id> from=active to=stopped userId=<id>`

### Requirement: Poller logs errors at error level without crashing
API errors that occur during polling SHALL be logged at `error` level with fields: `taskId`, `err` (error message), before the poller continues.

#### Scenario: Transient API error on one task
- **WHEN** `getTask(taskId)` throws during a cycle
- **THEN** the poller SHALL log at `error`: `msg="poller task error" taskId=<id> err=<message>` and continue to the next task
