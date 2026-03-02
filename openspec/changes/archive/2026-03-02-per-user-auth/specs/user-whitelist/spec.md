## MODIFIED Requirements

### Requirement: Unauthorised users are rejected

The system SHALL reject all interactions from Telegram users who are not in the allowlist, and SHALL send an informative message explaining they do not have access.

#### Scenario: Unknown user sends a command

- **WHEN** a Telegram user not in the allowlist sends any message or taps any button
- **THEN** the bot SHALL reply "You don't have access to this bot. Contact the administrator to be added." and ignore the update

#### Scenario: Authorised user interacts normally

- **WHEN** a Telegram user whose ID is in the allowlist sends a command
- **THEN** the bot SHALL process the request normally

## MODIFIED Requirements

### Requirement: Whitelist is configured via environment variable and runtime admin actions

The system SHALL seed the allowed user list from the `ALLOWED_USERS` environment variable on startup, and SHALL allow admins to add or remove users at runtime. Runtime changes SHALL be persisted to the session file and survive bot restarts. Environment-configured users are always re-applied on startup regardless of runtime removals.

#### Scenario: Variable set with user IDs

- **WHEN** `ALLOWED_USERS=123,456` is set
- **THEN** users 123 and 456 SHALL be in the allowlist on startup

#### Scenario: Variable not set

- **WHEN** `ALLOWED_USERS` is not set or is empty
- **THEN** the bot starts with an empty env-sourced allowlist (only runtime-added users are allowed unless `ADMIN_USERS` implies they are allowed)

#### Scenario: Admin adds a user at runtime

- **WHEN** an admin adds user ID 789 via the admin panel
- **THEN** user 789 is immediately allowed and the change is persisted, surviving bot restart

#### Scenario: Admin removes a user at runtime

- **WHEN** an admin removes user ID 456 via the admin panel
- **THEN** user 456 is immediately denied; however if `ALLOWED_USERS` still contains 456, they will be re-allowed after the next bot restart
