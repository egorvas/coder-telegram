## MODIFIED Requirements

### Requirement: Completion notification sent to user
When a task transitions to `stopped` (detected by the poller), the bot SHALL send a notification to the originating chat with the task status and an inline keyboard.

#### Scenario: Task stopped detected by poller
- **WHEN** the poller detects a task has transitioned to `stopped`
- **THEN** the bot SHALL send a message to the originating chat containing: task name, status, truncated initial prompt (if any), and the task menu keyboard

#### Scenario: User manually checks completed task
- **WHEN** a user opens the task submenu for a task in a completed state
- **THEN** the bot SHALL show the task detail with the current status and inline buttons

## REMOVED Requirements

### Requirement: Completion notification includes webhook metadata title and body
**Reason**: The webhook carried a `title` and `body` from the Coder notification payload, which were shown in the notification header. The poller has no such metadata.
**Migration**: The notification header is replaced with a fixed `🤖 *AI Task Update*` string. The `WebhookMeta` type and parameter are removed from `notifyTaskComplete`.
