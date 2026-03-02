## MODIFIED Requirements

### Requirement: Workspace action menu offers Start, Stop, and Delete
Tapping a workspace SHALL open an action menu with contextual Start/Stop buttons based on current status, plus a Delete button always visible.

#### Scenario: User taps a running workspace
- **WHEN** the user taps a workspace that is currently running
- **THEN** the bot SHALL edit the message to show the workspace name, status, and buttons: "Stop", "Delete", "Open in Coder", and "Back"

#### Scenario: User taps a stopped workspace
- **WHEN** the user taps a workspace that is currently stopped
- **THEN** the bot SHALL edit the message to show the workspace name, status, and buttons: "Start", "Delete", "Open in Coder", and "Back"

#### Scenario: User taps Start
- **WHEN** the user taps "Start" in the workspace action menu
- **THEN** the bot SHALL call the start workspace API, confirm with a success message, and show the updated workspace list

#### Scenario: User taps Stop
- **WHEN** the user taps "Stop" in the workspace action menu
- **THEN** the bot SHALL prompt for confirmation before calling the stop API

## ADDED Requirements

### Requirement: User can delete a workspace
The bot SHALL allow the user to delete any workspace via a button in the workspace action menu.

#### Scenario: User taps Delete
- **WHEN** the user taps "🗑 Delete" on a workspace
- **THEN** the bot SHALL show a confirmation prompt: "Delete workspace *<name>*? This cannot be undone." with Yes and No buttons

#### Scenario: User confirms deletion
- **WHEN** the user taps "Yes" on the delete confirmation
- **THEN** the bot SHALL call `POST /api/v2/workspaces/{id}/builds` with `transition: "delete"`, confirm with a message, and return to the workspace list

#### Scenario: User cancels deletion
- **WHEN** the user taps "No" on the delete confirmation
- **THEN** the bot SHALL show the workspace action menu again without deleting
