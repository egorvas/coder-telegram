## MODIFIED Requirements

### Requirement: Completion notification sent to user
When the AI finishes working (agent state transitions to `idle` after `working` or `complete`), the bot SHALL send a completion log message to the originating chat. The log message SHALL have no inline keyboard.

#### Scenario: AI finishes working
- **WHEN** the poller detects agent state `idle` after `working` or `complete` (with `pendingLogSend` delay)
- **THEN** the bot SHALL send a log message with header `📝 *{name}* — Report`, the parsed AI response in a code block, and no inline keyboard

#### Scenario: Log message shows last prompt
- **WHEN** a `lastPrompt` exists for the task
- **THEN** the log message SHALL include it as a Markdown blockquote (`> ...`), truncated to 200 characters

#### Scenario: Log message shows duration
- **WHEN** `workingStartedAt` was recorded in the session
- **THEN** the log message SHALL show execution time in the header as `(Xm Ys)`

#### Scenario: Logs truncated
- **WHEN** the parsed AI response exceeds Telegram's 4096-char limit
- **THEN** the log message SHALL truncate from the top (showing the end of the log) and append `_(truncated)_`

#### Scenario: No logs available
- **WHEN** there are no logs
- **THEN** the log message SHALL show `_No logs yet._`

### Requirement: Reply-based follow-up replaces inline Append button
Users SHALL continue a task by replying to either the card message or the log message. There is no inline "Append" button.

#### Scenario: User replies to card message
- **WHEN** a user sends a text message replying to a card message
- **THEN** the bot SHALL call `appendTaskPrompt(taskId, text)`, update `lastPrompt`, and refresh the card

#### Scenario: User replies to log message
- **WHEN** a user sends a text message replying to a log message
- **THEN** the bot SHALL call `appendTaskPrompt(taskId, text)` and update `lastPrompt`

#### Scenario: Reply matching
- **GIVEN** `findByReplyMessageId` checks both `cardMessageId` and `logMessageId`
- **THEN** replying to either message type SHALL find the associated task

### Requirement: Multiple concurrent tasks handled independently
The completion flow SHALL handle notifications for multiple simultaneously running tasks without interference.

#### Scenario: Two tasks complete in sequence
- **WHEN** two tasks created from the same chat complete at different times
- **THEN** each SHALL generate its own log message, and actions on one SHALL NOT affect the other

## REMOVED Requirements

### Requirement: Inline "Append prompt" button
**Reason**: Replaced by reply-based interaction. Users reply to the card or log message to append a prompt.
**Migration**: No migration needed — reply-based interaction is already implemented in `live-task-cards`.

### Requirement: Inline "Delete task" button
**Reason**: Delete button is on the live card, not on the completion log message. Covered by `live-task-cards` spec.
**Migration**: Delete functionality is part of the card keyboard, not the completion flow.
