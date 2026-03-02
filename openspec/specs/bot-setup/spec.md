## ADDED Requirements

### Requirement: Bot initializes with valid configuration

The system SHALL load `TELEGRAM_BOT_TOKEN` and `CODER_API_URL` from environment variables at startup. `CODER_API_TOKEN` is no longer required. The system SHALL fail fast with a clear error message if any remaining required variable is missing or empty.

#### Scenario: All required environment variables present

- **WHEN** the bot starts with `TELEGRAM_BOT_TOKEN` and `CODER_API_URL` set
- **THEN** the bot SHALL initialize successfully and begin polling for Telegram updates

#### Scenario: Missing required environment variable

- **WHEN** the bot starts with one or more required variables missing
- **THEN** the bot SHALL exit with a non-zero code and log which variables are missing

### Requirement: Bot reads ADMIN_USERS environment variable

The system SHALL read `ADMIN_USERS` as a comma-separated list of Telegram user IDs that have admin privileges.

#### Scenario: ADMIN_USERS set

- **WHEN** `ADMIN_USERS=111,222` is set
- **THEN** users 111 and 222 SHALL have admin privileges in the bot

#### Scenario: ADMIN_USERS not set

- **WHEN** `ADMIN_USERS` is not set or empty
- **THEN** no users have admin privileges

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

### Requirement: Bot reads LOG_LEVEL environment variable

The system SHALL read the `LOG_LEVEL` environment variable at startup and pass it to the logger singleton. Valid values are `debug`, `info`, `warn`, `error`. The default SHALL be `info` if the variable is absent or invalid.

#### Scenario: LOG_LEVEL=debug set

- **WHEN** the bot starts with `LOG_LEVEL=debug`
- **THEN** the logger SHALL emit debug-level messages in addition to info, warn, and error

#### Scenario: LOG_LEVEL not set

- **WHEN** `LOG_LEVEL` is absent
- **THEN** the logger SHALL default to `info` level

### Requirement: Logger is initialized before any other module

The logger singleton SHALL be configured (level and format applied) before the bot, poller, or any handler module is instantiated.

#### Scenario: Startup sequence

- **WHEN** the bot process starts
- **THEN** the logger SHALL be ready before the first Telegram update handler is registered

## REMOVED Requirements

### Requirement: CODER_API_TOKEN is required at startup

**Reason**: Each user now provides their own Coder API key interactively. A global token is no longer needed or used.

**Migration**: Remove `CODER_API_TOKEN` from your environment / `.env` file. Set `ADMIN_USERS` to your Telegram ID and use `/start` to enter your personal Coder API key.
