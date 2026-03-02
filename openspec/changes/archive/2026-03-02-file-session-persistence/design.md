## Context

`TaskSessionStore` holds two `Map` objects in memory. When the Node.js process exits (container restart, redeploy), both maps are lost. Any task created before the restart will never receive webhook notifications because `getIdByName()` returns null.

## Goals / Non-Goals

**Goals:**
- Persist `sessions` and `nameToId` maps to a JSON file on every mutation
- Load them back on startup before the bot connects
- Zero new npm dependencies (use built-in `node:fs`)

**Non-Goals:**
- Persisting `pendingAppends` (transient UI state, safe to lose)
- Supporting multiple concurrent bot instances
- Encryption or access control on the session file

## Decisions

**Async fire-and-forget writes** — `fs.writeFile` (async) is used for saves so mutations never block the event loop. Errors are logged but not thrown. Alternative (sync write) would block the event loop on every task creation.

**Sync read on startup** — `fs.readFileSync` is used once at construction time before the bot connects. Keeps init simple; there is no async constructor in JS.

**`mkdirSync({ recursive: true })`** — creates the data directory if it doesn't exist, so the bot works out of the box without pre-creating the folder.

**Default path `./data/sessions.json`** — relative to CWD (`/app` in Docker). Override via `SESSION_FILE` env var. The `./data/` directory is the natural mount point for a Docker volume.

## Risks / Trade-offs

- [Write failure] If disk is full or path is not writable, sessions are not saved → notification stops after restart. Mitigation: log the error clearly.
- [Concurrent mutations] Multiple rapid mutations trigger multiple concurrent `writeFile` calls to the same path. Last write wins — acceptable given single-process, low-frequency writes.
- [Stale sessions] Deleted tasks remain in the file. Not a correctness problem — `getIdByName` returns the id, but if the task is gone from Coder, `getTask` will fail and the error message is sent to the user.

## Migration Plan

1. Deploy new image — store loads from file (empty first run, no file yet = no change)
2. First task created after deploy → file written → sessions survive future restarts
3. No rollback concerns: old image ignores the file, new image reads it
