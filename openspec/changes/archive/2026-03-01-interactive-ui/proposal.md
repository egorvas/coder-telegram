## Why

All existing commands require users to remember exact syntax and opaque IDs, making the bot tedious to use — especially when managing multiple AI tasks simultaneously. This change replaces text-heavy command interaction with a menu-driven, button-based UI that lets users navigate, create, and control AI tasks without ever typing an ID or looking up a template name.

## What Changes

- Add a **main menu** (inline keyboard) accessible via `/start` and a persistent "Menu" button — sections: Workspaces, AI Tasks, Templates
- Add a **task dashboard** showing all active tasks across workspaces with per-task action buttons (Logs / Append / Delete / Refresh)
- Add a **task creation wizard** — a guided multi-step flow: pick workspace → pick template → pick preset → enter prompt; no command syntax required
- Add a **workspace action menu** — tapping a workspace shows Start / Stop buttons inline
- Add a **template browser flow** — tapping a template shows its presets as inline buttons
- All existing text commands remain functional as shortcuts (backward compatible)
- Add a `ui-state` store to track per-chat navigation context (current wizard step, selected workspace, etc.)

## Capabilities

### New Capabilities
- `main-menu`: Entry point inline keyboard with top-level sections; persistent navigation via callback queries
- `task-dashboard`: Live list of all active tasks with per-task inline action buttons; supports N concurrent tasks
- `task-creation-wizard`: Multi-step guided flow for creating an AI task (workspace → template → preset → prompt)
- `workspace-action-menu`: Inline keyboard shown when a workspace is selected, offering Start/Stop actions
- `ui-state`: Per-chat state store tracking current wizard step and selections, enabling multi-step conversation flows

### Modified Capabilities
<!-- No existing spec-level behavior changes — new UI layer on top -->

## Impact

- **Code**: New `src/ui/` directory with menu builders, wizard logic, and UI state store; new callback query handlers wired into bot
- **Existing commands**: Still work as-is; no breaking changes
- **Dependencies**: No new packages — Telegraf's `InlineKeyboard` API used throughout
- **State**: UI state is in-memory per chat, separate from the task session store from `task-webhook-notifications`
