## MODIFIED Requirements

### Requirement: Client is instantiated per user, not as a global singleton

The Coder API client SHALL be created on demand using the requesting user's stored API key. The global singleton `coderClient` SHALL be replaced with a factory function.

#### Scenario: Authenticated user triggers a bot action

- **WHEN** an authenticated user with a stored API key triggers any bot action requiring a Coder API call
- **THEN** the system SHALL instantiate a `CoderClient` using that user's key and the shared `CODER_API_URL`

#### Scenario: User has no stored API key

- **WHEN** a user without a stored API key triggers a bot action requiring a Coder API call
- **THEN** the system SHALL reply "You need to configure your API key first. Use /start." and not make any API call
