## Why

Creating an AI task requires knowing a valid template name and preset — but users currently have no way to discover these from the bot. Without this, the `/task_create` command is a guessing game. This change adds commands to list templates and their presets so users can pick the right combination before creating a task.

## What Changes

- Add Coder API client methods to list templates and fetch presets for a given template
- Add bot commands: `/templates` (list all templates) and `/presets <template>` (list presets for a template)
- Update the `/task_create` help text to guide users toward using `/templates` and `/presets` first
- Add TypeScript types for `CoderTemplate` and `CoderPreset`

## Capabilities

### New Capabilities
- `template-api`: Coder API client methods for listing templates and fetching template presets
- `template-commands`: Telegram bot commands for browsing templates and their presets

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- **API**: Uses Coder's `/api/v2/templates` and `/api/v2/templates/{id}/versions/{version}/presets` (or equivalent) endpoints
- **Code**: New types in `src/coder/types.ts`; new methods on `CoderClient`; new command files `src/commands/templates/`
- **Bot**: 2 new commands added to the Telegram command menu
- **Dependencies**: No new external packages
