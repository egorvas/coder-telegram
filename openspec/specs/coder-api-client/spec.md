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

### Requirement: Client logs every outbound request and response

The `request()` method SHALL log one line per API call containing: `method`, `path`, `status` (HTTP status code), `durationMs` (elapsed time in milliseconds). The log level SHALL be `debug`. Errors SHALL be logged at `error` level.

#### Scenario: Successful GET request

- **WHEN** the client completes a GET to `/api/v2/workspaces` with HTTP 200 in 42 ms
- **THEN** the client SHALL log at `debug`: `msg="coder api" method=GET path=/api/v2/workspaces status=200 durationMs=42`

#### Scenario: Successful POST request

- **WHEN** the client completes a POST to `/api/v2/tasks/me` with HTTP 200 in 150 ms
- **THEN** the client SHALL log at `debug`: `msg="coder api" method=POST path=/api/v2/tasks/me status=200 durationMs=150`

#### Scenario: API error response

- **WHEN** the Coder API responds with a non-2xx status
- **THEN** the client SHALL log at `error`: `msg="coder api error" method=<M> path=<P> status=<N> durationMs=<D>` before throwing

### Requirement: Client never logs the API token

The `Coder-Session-Token` header value SHALL NOT appear in any log output at any log level.

#### Scenario: Any request logged

- **WHEN** a request is logged at any level
- **THEN** the log line SHALL contain no value matching the user's API token
