## ADDED Requirements

### Requirement: List workspaces command
The bot SHALL provide a `/workspaces` command that displays all workspaces with their current status.

#### Scenario: User has workspaces
- **WHEN** a user sends `/workspaces`
- **THEN** the bot SHALL reply with a formatted list showing each workspace name, owner, and status (e.g., running, stopped, failed)

#### Scenario: No workspaces available
- **WHEN** a user sends `/workspaces` and no workspaces exist
- **THEN** the bot SHALL reply with a message indicating no workspaces were found

#### Scenario: API error during list
- **WHEN** a user sends `/workspaces` and the Coder API returns an error
- **THEN** the bot SHALL reply with a user-friendly error message

### Requirement: Start workspace command
The bot SHALL provide a `/start_ws <name>` command that starts a workspace by name.

#### Scenario: Successful start
- **WHEN** a user sends `/start_ws myworkspace`
- **THEN** the bot SHALL initiate the workspace start and reply with a confirmation message

#### Scenario: Missing workspace name
- **WHEN** a user sends `/start_ws` without a workspace name
- **THEN** the bot SHALL reply with usage instructions: `/start_ws <workspace_name>`

#### Scenario: Workspace not found on start
- **WHEN** a user sends `/start_ws nonexistent`
- **THEN** the bot SHALL reply indicating the workspace was not found

### Requirement: Stop workspace command
The bot SHALL provide a `/stop_ws <name>` command that stops a workspace by name.

#### Scenario: Successful stop
- **WHEN** a user sends `/stop_ws myworkspace`
- **THEN** the bot SHALL initiate the workspace stop and reply with a confirmation message

#### Scenario: Missing workspace name on stop
- **WHEN** a user sends `/stop_ws` without a workspace name
- **THEN** the bot SHALL reply with usage instructions: `/stop_ws <workspace_name>`

#### Scenario: Workspace not found on stop
- **WHEN** a user sends `/stop_ws nonexistent`
- **THEN** the bot SHALL reply indicating the workspace was not found

### Requirement: Help / start command
The bot SHALL respond to the `/start` command (Telegram default) with a welcome message and list of available commands.

#### Scenario: User sends /start
- **WHEN** a user sends `/start`
- **THEN** the bot SHALL reply with a welcome message and a list of available commands with descriptions
