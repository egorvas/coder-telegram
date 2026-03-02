## ADDED Requirements

### Requirement: Admin button appears in main menu for admin users

Admins SHALL see an additional "👤 Admin" button in the main menu that non-admin users do not see.

#### Scenario: Admin user opens main menu

- **WHEN** a user whose Telegram ID is in `ADMIN_USERS` sends `/start` or taps "Main Menu"
- **THEN** the bot SHALL display the standard main menu buttons plus an extra "👤 Admin" button

#### Scenario: Non-admin user opens main menu

- **WHEN** a user whose Telegram ID is not in `ADMIN_USERS` opens the main menu
- **THEN** the bot SHALL display the standard main menu without an "👤 Admin" button

### Requirement: Admin panel lists registered users

Tapping "👤 Admin" SHALL open a panel showing all registered users with their key status.

#### Scenario: Admin taps Admin button

- **WHEN** an admin taps "👤 Admin"
- **THEN** the bot SHALL display a message listing each registered user (Telegram ID) with their key status ("key set" or "no key") and buttons: "➕ Add User", "🗑 Remove User", "👁 View Mode", and "« Back"

#### Scenario: No registered users

- **WHEN** no users are registered in the runtime allowlist
- **THEN** the bot SHALL show "No users registered." with the Add User and Back buttons

### Requirement: Admin can add a user by Telegram ID

The bot SHALL allow an admin to add a new user to the runtime allowlist by entering their Telegram ID.

#### Scenario: Admin taps Add User

- **WHEN** an admin taps "➕ Add User"
- **THEN** the bot SHALL prompt "Enter the Telegram user ID to add:" and await a text reply

#### Scenario: Admin enters a valid numeric Telegram ID

- **WHEN** the admin sends a valid integer Telegram ID in response to the add prompt
- **THEN** the bot SHALL add that ID to the runtime allowlist, persist it, confirm with "User <ID> added.", and return to the admin panel

#### Scenario: Admin enters an invalid ID

- **WHEN** the admin sends a non-numeric string in response to the add prompt
- **THEN** the bot SHALL reply "Invalid ID — please enter a numeric Telegram user ID." and remain in the add-user waiting state

### Requirement: Admin can remove a user

The bot SHALL allow an admin to remove a user from the runtime allowlist.

#### Scenario: Admin taps Remove User

- **WHEN** an admin taps "🗑 Remove User"
- **THEN** the bot SHALL show a list of registered user IDs as inline buttons, each triggering removal on tap, plus a "« Back" button

#### Scenario: Admin taps a user to remove

- **WHEN** an admin taps a user ID in the removal list
- **THEN** the bot SHALL show a confirmation prompt "Remove user <ID>? They will lose access immediately." with Yes/No buttons

#### Scenario: Admin confirms removal

- **WHEN** the admin taps Yes on the removal confirmation
- **THEN** the bot SHALL remove the user from the allowlist and their stored data, persist the change, confirm "User <ID> removed.", and return to the admin panel

#### Scenario: Admin cancels removal

- **WHEN** the admin taps No on the removal confirmation
- **THEN** the bot SHALL return to the admin panel without removing the user

### Requirement: Admin can toggle all-users view mode

Admins SHALL be able to switch between viewing their own resources only and an aggregated view of all registered users' resources.

#### Scenario: Admin taps View Mode — currently own scope

- **WHEN** an admin taps "👁 View Mode" while in own-scope mode
- **THEN** the bot SHALL switch to all-users mode, confirm "Now showing all users' resources.", and return to the admin panel with the View Mode button updated to show current state

#### Scenario: Admin taps View Mode — currently all-users mode

- **WHEN** an admin taps "👁 View Mode" while in all-users mode
- **THEN** the bot SHALL switch back to own-scope mode and confirm "Now showing your resources only."

#### Scenario: All-users workspace list

- **WHEN** an admin in all-users mode opens the Workspaces section
- **THEN** the bot SHALL aggregate workspaces from all registered users (using each user's stored API key in parallel), and display each workspace with an owner label `[username]` prepended to the name

#### Scenario: All-users task list

- **WHEN** an admin in all-users mode opens the AI Tasks section
- **THEN** the bot SHALL aggregate tasks from all registered users and display each with an owner label

#### Scenario: Individual user API fails during aggregation

- **WHEN** aggregating and one user's API call fails
- **THEN** the bot SHALL skip that user's resources, log a warning, and display the remaining results
