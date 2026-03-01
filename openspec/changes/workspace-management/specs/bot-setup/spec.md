## ADDED Requirements

### Requirement: Bot initializes with valid configuration
The system SHALL load `TELEGRAM_BOT_TOKEN`, `CODER_API_URL`, and `CODER_API_TOKEN` from environment variables at startup. The system SHALL fail fast with a clear error message if any required variable is missing or empty.

#### Scenario: All environment variables present
- **WHEN** the bot starts with all required environment variables set
- **THEN** the bot SHALL initialize successfully and begin polling for Telegram updates

#### Scenario: Missing environment variable
- **WHEN** the bot starts with one or more required environment variables missing
- **THEN** the bot SHALL exit with a non-zero code and log which variables are missing

### Requirement: Bot registers commands with Telegram
The system SHALL register the bot's command list with Telegram on startup so that users see available commands in the Telegram UI.

#### Scenario: Commands registered on startup
- **WHEN** the bot starts successfully
- **THEN** the bot SHALL set the Telegram command menu with all available workspace commands

### Requirement: Bot handles graceful shutdown
The system SHALL handle `SIGINT` and `SIGTERM` signals and stop the bot gracefully.

#### Scenario: Process receives SIGTERM
- **WHEN** the running bot process receives a SIGTERM signal
- **THEN** the bot SHALL stop polling, log a shutdown message, and exit cleanly
