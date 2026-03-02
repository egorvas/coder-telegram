## ADDED Requirements

### Requirement: Task sessions are stored per user
The system SHALL store each user's task sessions under their own Telegram user ID key in the session file.

#### Scenario: Two users create tasks
- **WHEN** user A (id=111) and user B (id=222) each create a task
- **THEN** the session file SHALL contain separate entries under keys "111" and "222"

#### Scenario: Session lookup is user-scoped
- **WHEN** the bot looks up a task session for user A
- **THEN** it SHALL only find tasks registered by user A, not user B

### Requirement: Webhook routing searches across all users
The system SHALL find the correct chat to notify for a webhook event regardless of which user created the task.

#### Scenario: Webhook arrives for task owned by any user
- **WHEN** a webhook notification arrives with a task name
- **THEN** the system SHALL search all users' session data to find the matching chatId and deliver the notification
