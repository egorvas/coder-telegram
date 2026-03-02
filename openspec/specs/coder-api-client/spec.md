## ADDED Requirements

### Requirement: Client is instantiated per user, not as a global singleton

The Coder API client SHALL be created on demand using the requesting user's stored API key. The global singleton `coderClient` SHALL be replaced with a factory function.

#### Scenario: Authenticated user triggers a bot action

- **WHEN** an authenticated user with a stored API key triggers any bot action requiring a Coder API call
- **THEN** the system SHALL instantiate a `CoderClient` using that user's key and the shared `CODER_API_URL`

#### Scenario: User has no stored API key

- **WHEN** a user without a stored API key triggers a bot action requiring a Coder API call
- **THEN** the system SHALL reply "You need to configure your API key first. Use /start." and not make any API call

### Requirement: Client authenticates with Coder API
The Coder API client SHALL send the API token in the `Coder-Session-Token` header with every request to the Coder API.

#### Scenario: Authenticated request
- **WHEN** the client makes any request to the Coder API
- **THEN** the request SHALL include the `Coder-Session-Token` header with the configured token value

### Requirement: Client lists workspaces
The client SHALL provide a method to list all workspaces visible to the authenticated user.

#### Scenario: Workspaces exist
- **WHEN** the client requests the workspace list
- **THEN** the client SHALL return an array of workspace objects containing at minimum: `id`, `name`, `owner_name`, and `latest_build.status`

#### Scenario: No workspaces
- **WHEN** the client requests the workspace list and no workspaces exist
- **THEN** the client SHALL return an empty array

### Requirement: Client starts a workspace
The client SHALL provide a method to start a workspace by name, triggering a new build with `start` transition.

#### Scenario: Start existing stopped workspace
- **WHEN** the client sends a start request for a valid workspace name
- **THEN** the client SHALL create a build with transition `start` and return the build information

#### Scenario: Workspace not found
- **WHEN** the client sends a start request for a non-existent workspace name
- **THEN** the client SHALL throw an error indicating the workspace was not found

### Requirement: Client stops a workspace
The client SHALL provide a method to stop a workspace by name, triggering a new build with `stop` transition.

#### Scenario: Stop existing running workspace
- **WHEN** the client sends a stop request for a valid workspace name
- **THEN** the client SHALL create a build with transition `stop` and return the build information

#### Scenario: Workspace not found on stop
- **WHEN** the client sends a stop request for a non-existent workspace name
- **THEN** the client SHALL throw an error indicating the workspace was not found

### Requirement: Client handles API errors
The client SHALL handle non-2xx responses from the Coder API and throw descriptive errors.

#### Scenario: API returns error status
- **WHEN** the Coder API responds with a non-2xx status code
- **THEN** the client SHALL throw an error containing the HTTP status and response message
