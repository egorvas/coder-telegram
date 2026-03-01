## ADDED Requirements

### Requirement: Workspace list shows workspaces as buttons
When navigating to the Workspaces section, the bot SHALL show each workspace as a tappable button.

#### Scenario: Workspaces exist
- **WHEN** the user navigates to the Workspaces section
- **THEN** the bot SHALL display each workspace as an inline button showing its name and current status, plus a back-to-menu button

#### Scenario: No workspaces exist
- **WHEN** the user navigates to the Workspaces section and no workspaces exist
- **THEN** the bot SHALL show a "No workspaces found" message with a back button

### Requirement: Workspace action menu offers Start and Stop
Tapping a workspace SHALL open an action menu with contextual Start/Stop buttons based on current status.

#### Scenario: User taps a running workspace
- **WHEN** the user taps a workspace that is currently running
- **THEN** the bot SHALL edit the message to show the workspace name, status, and buttons: "Stop" and "Back"

#### Scenario: User taps a stopped workspace
- **WHEN** the user taps a workspace that is currently stopped
- **THEN** the bot SHALL edit the message to show the workspace name, status, and buttons: "Start" and "Back"

#### Scenario: User taps Start
- **WHEN** the user taps "Start" in the workspace action menu
- **THEN** the bot SHALL call the start workspace API, confirm with a success message, and show the updated action menu

#### Scenario: User taps Stop
- **WHEN** the user taps "Stop" in the workspace action menu
- **THEN** the bot SHALL call the stop workspace API, confirm with a success message, and show the updated action menu
