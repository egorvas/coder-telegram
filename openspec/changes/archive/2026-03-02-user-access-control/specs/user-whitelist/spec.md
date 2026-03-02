## ADDED Requirements

### Requirement: Unauthorised users are rejected
The system SHALL reject all interactions from Telegram users whose ID is not in the allowed-users list.

#### Scenario: Unknown user sends a command
- **WHEN** a Telegram user not in `ALLOWED_USERS` sends any message or taps any button
- **THEN** the bot SHALL reply "Sorry, you are not authorised to use this bot." and ignore the update

#### Scenario: Authorised user interacts normally
- **WHEN** a Telegram user whose ID is in `ALLOWED_USERS` sends a command
- **THEN** the bot SHALL process the request normally

### Requirement: Whitelist is configured via environment variable
The system SHALL read the allowed user list from the `ALLOWED_USERS` environment variable.

#### Scenario: Variable set with user IDs
- **WHEN** `ALLOWED_USERS=123,456` is set
- **THEN** only users 123 and 456 SHALL be allowed to interact with the bot

#### Scenario: Variable not set
- **WHEN** `ALLOWED_USERS` is not set or is empty
- **THEN** all Telegram users SHALL be allowed (open mode, backward-compatible)
