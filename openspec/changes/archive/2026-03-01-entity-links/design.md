## Context

The bot already has `config.coderApiUrl` (the Coder instance base URL) available globally. Telegraf's `Markup.button.url(label, url)` creates inline URL buttons alongside callback buttons. Coder's web UI uses predictable URL patterns for entities.

Current keyboard functions are in `src/ui/keyboards.ts` and receive the necessary entity data (task id, workspace name, template name) as arguments. The config must be passed in or imported to construct URLs.

## Goals / Non-Goals

**Goals:**
- Add an "🌐 Open in Coder" URL button to task submenu, workspace action menu, and template preset view
- Derive URLs from `config.coderApiUrl` without adding new env vars

**Non-Goals:**
- Deep-linking into specific task log lines or workspace terminals
- URL buttons on list views (only detail / action views get links)

## Decisions

**Import `config` directly in `keyboards.ts`**
`keyboards.ts` is a pure builder module — importing `config` there is the minimal change vs. threading the base URL through every caller. Alternative: pass `baseUrl` as a parameter to each keyboard function — rejected as it would change all call sites unnecessarily.

**URL patterns:**
- Task: `{baseUrl}/tasks/{taskId}`
- Workspace: `{baseUrl}/@me/{workspaceName}` (Coder uses `@me` for the current user)
- Template: `{baseUrl}/templates/{templateName}`

**Button placement:**
- Task submenu: third row, full-width "🌐 Open in Coder"
- Workspace action menu: second row alongside "« Back"
- Preset list: appended as a row above "« Templates"

## Risks / Trade-offs

- [URL validity] Coder URL structure may differ between versions → Mitigation: use the simplest documented paths; easily updated in one file
- [Config coupling] `keyboards.ts` gains a config import → acceptable, config is a stable singleton with no side effects
