## 1. Types

- [x] 1.1 Add `CoderTemplate` type to `src/coder/types.ts` with fields: `id`, `name`, `display_name`, `active_version_id`
- [x] 1.2 Add `CoderPreset` type to `src/coder/types.ts` with fields: `id`, `name`, `description`

## 2. Coder API Client Methods

- [x] 2.1 Add `listTemplates()` method to `CoderClient` — GET `/api/v2/templates`, return `CoderTemplate[]`
- [x] 2.2 Add `getTemplatePresets(templateName: string)` method to `CoderClient` — find template by name from list, resolve `active_version_id`, GET presets endpoint, return `CoderPreset[]`
- [x] 2.3 Handle edge cases in `getTemplatePresets`: template not found → throw; no active version → throw

## 3. Bot Commands

- [x] 3.1 Create `src/commands/templates/list.ts` — `/templates` handler: fetch and format template list, truncate if needed
- [x] 3.2 Create `src/commands/templates/presets.ts` — `/presets <name>` handler: validate argument, fetch and format presets, handle not found
- [x] 3.3 Update `/task_create` usage message in `src/commands/tasks/create.ts` to mention `/templates` and `/presets`

## 4. Wire Up

- [x] 4.1 Register `/templates` and `/presets` commands in bot
- [x] 4.2 Add both commands to the Telegram command menu registered on startup
- [x] 4.3 Add both commands to the `/start` welcome message
