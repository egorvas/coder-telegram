## MODIFIED Requirements

### Requirement: Bot initializes with valid configuration

The system SHALL load `TELEGRAM_BOT_TOKEN` and `CODER_API_URL` from environment variables at startup. `CODER_API_TOKEN` is no longer required. The system SHALL fail fast with a clear error message if any remaining required variable is missing or empty.

#### Scenario: All required environment variables present

- **WHEN** the bot starts with `TELEGRAM_BOT_TOKEN` and `CODER_API_URL` set
- **THEN** the bot SHALL initialize successfully and begin polling for Telegram updates

#### Scenario: Missing required environment variable

- **WHEN** the bot starts with one or more required variables missing
- **THEN** the bot SHALL exit with a non-zero code and log which variables are missing

## ADDED Requirements

### Requirement: Bot reads ADMIN_USERS environment variable

The system SHALL read `ADMIN_USERS` as a comma-separated list of Telegram user IDs that have admin privileges.

#### Scenario: ADMIN_USERS set

- **WHEN** `ADMIN_USERS=111,222` is set
- **THEN** users 111 and 222 SHALL have admin privileges in the bot

#### Scenario: ADMIN_USERS not set

- **WHEN** `ADMIN_USERS` is not set or empty
- **THEN** no users have admin privileges

## REMOVED Requirements

### Requirement: CODER_API_TOKEN is required at startup

**Reason**: Each user now provides their own Coder API key interactively. A global token is no longer needed or used.

**Migration**: Remove `CODER_API_TOKEN` from your environment / `.env` file. Set `ADMIN_USERS` to your Telegram ID and use `/start` to enter your personal Coder API key.
