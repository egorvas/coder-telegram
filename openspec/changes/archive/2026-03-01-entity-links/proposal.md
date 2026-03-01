## Why

Users need a way to open tasks, workspaces, and templates directly in the Coder web UI from the Telegram bot. Currently all interactions happen only inside Telegram, with no quick path to the full Coder interface for deeper inspection or actions.

## What Changes

- Task submenu gains an "Open in Coder" URL button linking to the task detail page
- Workspace action menu gains an "Open in Coder" URL button linking to the workspace page
- Template preset view gains an "Open in Coder" URL button linking to the template page
- The Coder base URL (already in `CODER_API_URL`) is used to construct all links

## Capabilities

### New Capabilities

- `entity-links`: Inline URL buttons that open Coder web UI pages for tasks, workspaces, and templates

### Modified Capabilities

- `task-dashboard`: Task submenu keyboard gains a URL button row
- `workspace-action-menu`: Workspace action keyboard gains a URL button row

## Impact

- `src/ui/keyboards.ts`: `taskMenuKeyboard`, `workspaceActionKeyboard`, `presetListKeyboard` — add `Markup.button.url(...)` buttons
- `src/config.ts`: `coderApiUrl` is already exported and used for API calls; the same value drives link construction
- No new dependencies required (`Markup.button.url` is part of Telegraf)
