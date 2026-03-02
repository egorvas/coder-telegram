## ADDED Requirements

### Requirement: User can pause an active task
The system SHALL allow the user to pause a task that is in `active` or `initializing` status via a button in the task submenu.

#### Scenario: User pauses an active task
- **WHEN** a user taps "⏸ Pause" on an active task
- **THEN** the bot SHALL call `POST /api/v2/tasks/me/{id}/pause`, re-fetch the task, and update the submenu message to reflect the new status and keyboard

#### Scenario: Pause button is absent for non-active tasks
- **WHEN** the task status is not `active` or `initializing`
- **THEN** the bot SHALL NOT show the "⏸ Pause" button in the task submenu

### Requirement: User can resume a paused task
The system SHALL allow the user to resume a task that is in `paused` status via a button in the task submenu.

#### Scenario: User resumes a paused task
- **WHEN** a user taps "▶️ Resume" on a paused task
- **THEN** the bot SHALL call `POST /api/v2/tasks/me/{id}/resume`, re-fetch the task, and update the submenu message to reflect the new status and keyboard

#### Scenario: Resume button is absent for non-paused tasks
- **WHEN** the task status is not `paused`
- **THEN** the bot SHALL NOT show the "▶️ Resume" button in the task submenu
