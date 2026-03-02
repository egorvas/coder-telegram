## ADDED Requirements

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
