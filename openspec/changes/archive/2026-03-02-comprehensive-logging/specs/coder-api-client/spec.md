## ADDED Requirements

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
