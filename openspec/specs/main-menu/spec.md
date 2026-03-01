## ADDED Requirements

### Requirement: Main menu displayed on /start
The bot SHALL respond to `/start` with a welcome message and an inline keyboard main menu containing top-level navigation buttons.

#### Scenario: User sends /start
- **WHEN** a user sends `/start`
- **THEN** the bot SHALL send a message with a main menu inline keyboard containing buttons: "AI Tasks", "Workspaces", "Templates"

### Requirement: Main menu navigates to sections
Each main menu button SHALL open the corresponding section by editing the current message.

#### Scenario: User taps AI Tasks
- **WHEN** a user taps the "AI Tasks" button in the main menu
- **THEN** the bot SHALL edit the message to show the task dashboard

#### Scenario: User taps Workspaces
- **WHEN** a user taps the "Workspaces" button in the main menu
- **THEN** the bot SHALL edit the message to show the workspace list with per-workspace buttons

#### Scenario: User taps Templates
- **WHEN** a user taps the "Templates" button in the main menu
- **THEN** the bot SHALL edit the message to show the template list with per-template buttons

### Requirement: Back navigation returns to main menu
Every section view SHALL include a "Back" or "Main Menu" button that returns the user to the main menu.

#### Scenario: User taps Back from any section
- **WHEN** a user taps the back/main-menu button from any section
- **THEN** the bot SHALL edit the message back to the main menu inline keyboard
