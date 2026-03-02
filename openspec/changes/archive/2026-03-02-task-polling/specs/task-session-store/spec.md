## ADDED Requirements

### Requirement: Store tracks last known status per task
The task session store SHALL record the most recently observed task status (`lastKnownStatus`) for each registered task, updated by the poller on each poll cycle.

#### Scenario: Last known status updated after poll
- **WHEN** the poller fetches a task and observes a status
- **THEN** the store SHALL update `lastKnownStatus` for that task to the observed value

#### Scenario: Last known status initially undefined
- **WHEN** a task is first registered
- **THEN** `lastKnownStatus` SHALL be `undefined`, causing the first poll to evaluate the status without a prior comparison

### Requirement: Store exposes all sessions for poller iteration
The store SHALL provide a `getAllSessions()` method that returns all active sessions across all users as a flat array: `Array<{ taskId, chatId, userId, lastKnownStatus }>`.

#### Scenario: Multiple users with tasks
- **WHEN** tasks from multiple users are registered
- **THEN** `getAllSessions()` SHALL return all of them in a single flat array

## REMOVED Requirements

### Requirement: Store supports task name → ID cross-user lookup
**Reason**: Task name lookup was only needed by the webhook server to route inbound Coder notifications. With the webhook removed, the bot always has `taskId` directly and no cross-user name lookup is needed.
**Migration**: Remove `registerName`, `getIdByName`, and the `nameToId` map. No replacement needed.
