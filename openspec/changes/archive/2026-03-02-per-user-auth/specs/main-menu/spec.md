## MODIFIED Requirements

### Requirement: Main menu displayed on /start

The bot SHALL respond to `/start` conditionally: if the user has a stored Coder API key, it SHALL show the main menu; if the user has no key, it SHALL start the API key setup flow instead.

#### Scenario: User with configured key sends /start

- **WHEN** an allowed user who has a stored Coder API key sends `/start`
- **THEN** the bot SHALL send a message with the main menu inline keyboard

#### Scenario: User without configured key sends /start

- **WHEN** an allowed user who has no stored Coder API key sends `/start`
- **THEN** the bot SHALL send the key-setup prompt instead of the main menu

## ADDED Requirements

### Requirement: Main menu includes Admin button for admin users

The main menu keyboard SHALL include an extra "👤 Admin" button for users whose Telegram ID is in `ADMIN_USERS`.

#### Scenario: Admin user sees Admin button

- **WHEN** an admin user's main menu is displayed
- **THEN** the inline keyboard SHALL include buttons: "🤖 AI Tasks", "💻 Workspaces", "📋 Templates", and "👤 Admin"

#### Scenario: Regular user does not see Admin button

- **WHEN** a non-admin user's main menu is displayed
- **THEN** the inline keyboard SHALL include only: "🤖 AI Tasks", "💻 Workspaces", "📋 Templates"
