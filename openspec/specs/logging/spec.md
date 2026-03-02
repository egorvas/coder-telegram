## ADDED Requirements

### Requirement: Logger singleton is available across all modules
The system SHALL provide a single `log` object exported from `src/utils/logger.ts`. All modules SHALL import `log` from that path rather than using `console` directly.

#### Scenario: Module imports logger
- **WHEN** any source module imports `{ log } from '../utils/logger.js'`
- **THEN** the module SHALL receive the shared singleton instance configured with the current `LOG_LEVEL`

### Requirement: Logger supports four severity levels
The logger SHALL support four levels in ascending severity order: `debug`, `info`, `warn`, `error`. Only messages at or above the configured level SHALL be emitted.

#### Scenario: LOG_LEVEL=info, debug call made
- **WHEN** `log.debug(...)` is called and `LOG_LEVEL` is `info`
- **THEN** no output SHALL be emitted

#### Scenario: LOG_LEVEL=debug, debug call made
- **WHEN** `log.debug(...)` is called and `LOG_LEVEL` is `debug`
- **THEN** the message SHALL be emitted

#### Scenario: LOG_LEVEL=warn, info and debug calls made
- **WHEN** `log.info(...)` or `log.debug(...)` is called and `LOG_LEVEL` is `warn`
- **THEN** no output SHALL be emitted

### Requirement: Logger emits JSON in production and human-readable text in development
The output format SHALL be selected based on the `NODE_ENV` environment variable.

#### Scenario: Production format
- **WHEN** `NODE_ENV=production`
- **THEN** each log line SHALL be a JSON object on one line with fields: `level`, `ts` (ISO timestamp), `msg`, and any extra fields passed by the caller

#### Scenario: Development format
- **WHEN** `NODE_ENV` is not `production`
- **THEN** each log line SHALL be human-readable: `[LEVEL] HH:MM:SS msg key=value ...`

### Requirement: Logger never emits sensitive values
The logger SHALL NOT emit API tokens or passwords in any output, regardless of log level.

#### Scenario: Token appears in a log call
- **GIVEN** a caller passes a field that happens to contain an API token
- **THEN** the logger SHALL emit whatever the caller passes — it is the CALLER's responsibility not to include tokens. The logger itself SHALL NOT inject token values from config.

### Requirement: Errors include stack trace in JSON mode
When `log.error(msg, { err })` is called with an `Error` object, the stack trace SHALL be included.

#### Scenario: Error logged in production
- **WHEN** `log.error('something failed', { err: new Error('oops') })` is called in production mode
- **THEN** the JSON output SHALL include an `err` field with `message` and `stack` sub-fields
