## Context

Coder organizes AI task creation around templates and presets. A template defines the base environment; a preset defines a named configuration of that template (e.g., resource sizes, parameters). The Coder API exposes these separately: `GET /api/v2/templates` returns all templates, and `GET /api/v2/templates/{template_id}/versions/{version_id}/presets` returns presets for a specific template version.

The bot currently has a `CoderClient` with workspace and task methods. This change adds two more methods following the same pattern.

## Goals / Non-Goals

**Goals:**
- Expose template list and per-template preset list via `CoderClient`
- Provide two bot commands for discovery: `/templates` and `/presets <template_name>`
- Format output clearly so users can copy template/preset names into `/task_create`

**Non-Goals:**
- Creating or modifying templates/presets
- Caching template data between requests
- Interactive template selection wizard (inline keyboards for selection — future improvement)

## Decisions

**Decision: Look up template by name for `/presets <name>` vs. requiring template ID**
Users know template names, not IDs. The `/presets` command SHALL accept a template name, look it up in the template list to get its ID and active version ID, then fetch presets. One extra API call, but far better UX than requiring opaque IDs.

**Decision: Show preset name and description in output**
Presets have a `name` and `description` field. Both SHALL be shown to help users understand what each preset configures (e.g., "Large" vs "Small" instances). The name is what gets passed to `/task_create`.

**Decision: `/templates` output format**
Each template shown as: `• <display_name> (name: <name>)` — display name for readability, technical name for copy-paste into commands.

**Decision: New command files follow existing pattern**
`src/commands/templates/list.ts` and `src/commands/templates/presets.ts` — mirrors the `src/commands/tasks/` structure.

## Risks / Trade-offs

- **Preset API endpoint uncertainty** → Coder's preset endpoint may differ from assumed path. Mitigation: wrap in try/catch with a descriptive error; document the assumed endpoint in code comments so it's easy to adjust.
- **Template with no active version** → Some templates may lack a published version. Mitigation: skip or show a warning for templates without a resolvable version ID.
- **Long template/preset lists** → If there are many templates, output may exceed Telegram's 4096-char limit. Mitigation: truncate with a count note (e.g., "showing 20 of 35").

## Open Questions

- Exact Coder API path for presets per template version — needs verification against running Coder instance or API docs.
- Does Coder return presets at the template level or only at the template-version level? If version-level, we must resolve the "active" version first.
