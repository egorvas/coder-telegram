## Why

Task sessions (taskId→chatId, taskName→taskId) are stored in-memory and lost on every container restart, causing webhook notifications to stop working for all previously created tasks. Users must recreate tasks after every bot restart.

## What Changes

- `TaskSessionStore` persists its two maps to a JSON file on every mutation
- On startup, the store loads sessions from the file if it exists
- A `SESSION_FILE` env var configures the path (default: `./data/sessions.json`)
- Docker Compose example updated with a `./data` volume mount

## Capabilities

### New Capabilities

- `session-persistence`: Saving and restoring task sessions (taskId→chatId, taskName→taskId) to/from disk so webhook notifications survive bot restarts

### Modified Capabilities

## Impact

- `src/store/task-sessions.ts`: add load/save logic using `node:fs`
- `src/config.ts`: add `SESSION_FILE` env var
- `README.md`: document `SESSION_FILE` and volume mount
