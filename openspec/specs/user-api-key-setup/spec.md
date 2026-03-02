## ADDED Requirements

### Requirement: User is prompted to enter their Coder API key on first start

When an allowed user has no Coder API key stored, the bot SHALL guide them through entering one before allowing access to the main menu.

#### Scenario: Allowed user with no key sends /start

- **WHEN** an allowed user who has no stored Coder API key sends `/start`
- **THEN** the bot SHALL reply with a setup message explaining that an API key is required, how to obtain it (link to `<CODER_URL>/settings/tokens`), and ask the user to paste their key

#### Scenario: User sends their API key as a text message during setup

- **WHEN** the bot is awaiting a key from the user and the user sends a text message
- **THEN** the bot SHALL store the key in the user's record, confirm with a success message, and display the main menu

#### Scenario: Already configured user sends /start

- **WHEN** an allowed user who already has a stored Coder API key sends `/start`
- **THEN** the bot SHALL display the main menu immediately without prompting for a key

### Requirement: User can reset their Coder API key

The bot SHALL allow an authenticated user to reset (replace) their stored Coder API key via the `/resetkey` command.

#### Scenario: User sends /resetkey

- **WHEN** an authenticated user sends `/resetkey`
- **THEN** the bot SHALL clear the user's stored key and enter the key-setup flow as if the user had no key

#### Scenario: User enters a new key after reset

- **WHEN** the bot is awaiting a key after a reset and the user sends a text message
- **THEN** the bot SHALL store the new key and confirm success with the main menu

### Requirement: Invalid or unauthorized key is rejected

If the entered key is rejected by the Coder API, the bot SHALL inform the user and ask them to try again.

#### Scenario: User enters an invalid API key

- **WHEN** the user sends a key and the validation call to `GET /api/v2/users/me` returns a non-2xx response
- **THEN** the bot SHALL reply "Invalid key — please check and try again." and remain in the key-setup waiting state
