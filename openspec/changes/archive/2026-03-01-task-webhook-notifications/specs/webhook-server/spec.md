## ADDED Requirements

### Requirement: Webhook server is optional
The HTTP webhook server SHALL only start if the `WEBHOOK_PORT` environment variable is set. Without it, the bot SHALL operate normally using manual polling commands only.

#### Scenario: WEBHOOK_PORT not set
- **WHEN** the bot starts without `WEBHOOK_PORT`
- **THEN** no HTTP server is started and the bot logs that webhook mode is disabled

#### Scenario: WEBHOOK_PORT set
- **WHEN** the bot starts with `WEBHOOK_PORT=3000`
- **THEN** an HTTP server SHALL start listening on that port and log the address

### Requirement: Webhook server receives task completion events
The webhook server SHALL accept POST requests at `/webhook` and parse the Coder task completion payload.

#### Scenario: Valid POST to /webhook
- **WHEN** a POST request is sent to `/webhook` with a valid Coder task completion payload
- **THEN** the server SHALL parse the payload and trigger the task completion flow for the associated task ID

#### Scenario: Unknown task ID in webhook
- **WHEN** the webhook payload contains a task ID not in the session store
- **THEN** the server SHALL respond 200 (to prevent retries) and log a warning

#### Scenario: Malformed payload
- **WHEN** the webhook body cannot be parsed as JSON or is missing required fields
- **THEN** the server SHALL respond with 400 and log the raw body for debugging

### Requirement: Webhook server verifies request signature
If `WEBHOOK_SECRET` is configured, the server SHALL verify the `X-Coder-Signature` header using HMAC-SHA256.

#### Scenario: Valid signature
- **WHEN** a POST arrives with a valid `X-Coder-Signature` matching the body and secret
- **THEN** the server SHALL process the request normally

#### Scenario: Invalid or missing signature
- **WHEN** `WEBHOOK_SECRET` is set and the request has a missing or incorrect signature
- **THEN** the server SHALL respond with 401 and not process the payload

#### Scenario: No secret configured
- **WHEN** `WEBHOOK_SECRET` is not set
- **THEN** the server SHALL skip signature verification and process all POST requests
