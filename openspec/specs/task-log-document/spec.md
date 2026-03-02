## Requirements

### Requirement: Full log is sent as a Telegram document
The system SHALL send the complete, untruncated task log as a `.txt` file using Telegram's document API when the user requests the full log.

#### Scenario: User requests full log for a task with output
- **WHEN** a user taps "Full Log" for a task that has log output
- **THEN** the bot SHALL send a Telegram document with filename `<taskId-short>-log.txt`, the file contents SHALL be the complete raw log with no truncation, and the document SHALL have a caption showing the task short ID and status

#### Scenario: User requests full log for a task with no output
- **WHEN** a user taps "Full Log" for a task that has no log output
- **THEN** the bot SHALL reply with a text message "No logs yet." instead of sending an empty file

### Requirement: Full log document is built in memory
The system SHALL construct the log document from a `Buffer` object without writing to disk.

#### Scenario: Full log document construction
- **WHEN** the full log is requested
- **THEN** the bot SHALL create the document as `Buffer.from(rawLogs)` and pass it directly to the Telegram API without creating any temporary files
