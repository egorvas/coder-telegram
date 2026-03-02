## Context

Telegram messages have a hard 4096-character limit. The current log handler (`task:logs:<id>`) uses `buildLogMessage` + `fitLogs` to truncate logs to the last ~3500 chars. For long AI tasks this discards the most important early output.

Telegram supports sending files as documents via `sendDocument` / `replyWithDocument`. Clients render `.txt` files inline (viewable without downloading). The Telegraf API accepts `{ source: Buffer, filename: string }` as an `InputFile`, so no disk I/O is needed.

## Goals / Non-Goals

**Goals:**
- Let users read the full, untruncated log from within Telegram
- Zero disk I/O — build the document entirely in memory
- Keep the existing truncated-preview "Logs" button for a quick inline glance

**Non-Goals:**
- Replacing the existing "Logs" button (the truncated view is still useful for short logs)
- Log streaming / live updates
- Pagination or search within logs

## Decisions

### 1. In-memory Buffer, not temp file
`Buffer.from(rawLogs)` passed as `{ source: Buffer, filename }` to `ctx.replyWithDocument`.
**Why**: no filesystem dependency, no cleanup risk, simpler code.
Alternatives considered: writing to `/tmp` — rejected (cleanup logic, potential race conditions under concurrent requests).

### 2. "Full Log" as a separate button, not replacing "Logs"
The existing "Logs" button stays for fast inline preview. "Full Log" is added to the task submenu as a second action.
**Why**: inline preview is still convenient when logs fit in a message; the document is the fallback for large output.
Alternative: always send as document — rejected (degrades UX for short logs which are fine inline).

### 3. Filename: `<task-id-short>-log.txt`
E.g. `a1b2c3d4-log.txt`.
**Why**: identifies the source at a glance in Telegram's file list; `.txt` ensures inline preview on all clients.

### 4. Caption on the document
Send a brief caption: `Task <short-id> — <status>` so the context is visible without opening the file.

## Risks / Trade-offs

- [Large logs] Coder may return very large logs. Telegram's file upload limit is 50 MB — well beyond any realistic log size → no mitigation needed.
- [Extra button in keyboard] The task submenu now has 4 action buttons in the first row (Logs, Full Log, Append, Delete), which may feel crowded. → Split into two rows: `[📋 Logs] [📄 Full Log]` and `[✏️ Append] [🗑 Delete]`.
