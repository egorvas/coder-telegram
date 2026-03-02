## Why

Task logs are currently truncated to fit Telegram's 4096-character message limit, making them nearly useless for long-running AI tasks that produce detailed output. Users have no way to see the full log from within Telegram.

## What Changes

- Add a **"Full Log"** button to the task submenu that sends the complete log as a `.txt` file
- The file is built in memory (no disk I/O) using a `Buffer`, so no temp file management is needed
- The existing **"Logs"** button keeps its current behaviour (truncated inline preview) for quick glances
- The truncated preview's footer note ("truncated — showing last portion") remains as a signal that a full log is available

## Capabilities

### New Capabilities
- `task-log-document`: Sending the full task log as a Telegram document (`.txt` file) so users can read it without truncation

### Modified Capabilities
- `task-dashboard`: A new "Full Log" button is added to the task submenu keyboard

## Impact

- `src/ui/keyboards.ts` — add "📄 Full Log" button to `taskMenuKeyboard`
- `src/ui/handlers/task-dashboard.ts` — add `task:fulllog:<id>` action handler
- No new dependencies (Telegraf's `ctx.replyWithDocument` is already available)
- No disk I/O — log is streamed as an in-memory `Buffer`
