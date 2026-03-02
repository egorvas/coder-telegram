## ADDED Requirements

### Requirement: Sessions survive process restart
The system SHALL persist task sessions (taskId→chatId mapping and taskName→taskId mapping) to a JSON file on disk so that webhook notifications continue to work after a bot restart.

#### Scenario: Sessions loaded on startup
- **WHEN** the bot process starts and a session file exists at the configured path
- **THEN** the store SHALL populate its maps from the file before accepting any requests

#### Scenario: Sessions saved on registration
- **WHEN** a new task session is registered (taskId + chatId)
- **THEN** the store SHALL write the updated state to the session file asynchronously

#### Scenario: Name mapping saved on registration
- **WHEN** a task name is mapped to a taskId
- **THEN** the store SHALL write the updated state to the session file asynchronously

#### Scenario: No file on first run
- **WHEN** the bot starts and no session file exists
- **THEN** the store SHALL start with empty maps and proceed normally

### Requirement: Session file path is configurable
The system SHALL use the `SESSION_FILE` environment variable to determine where to write session data, defaulting to `./data/sessions.json` if not set.

#### Scenario: Custom path via env var
- **WHEN** `SESSION_FILE=/mnt/data/bot-sessions.json` is set
- **THEN** the store SHALL read from and write to that path

#### Scenario: Default path used when env var absent
- **WHEN** `SESSION_FILE` is not set
- **THEN** the store SHALL use `./data/sessions.json`

### Requirement: Data directory created automatically
The system SHALL create the parent directory of the session file if it does not exist.

#### Scenario: Directory auto-created on first write
- **WHEN** the session file's parent directory does not exist and a session is saved
- **THEN** the directory SHALL be created recursively before writing the file
