## ADDED Requirements

### Requirement: Client lists all templates
The Coder API client SHALL provide a `listTemplates()` method that returns all templates visible to the authenticated user.

#### Scenario: Templates exist
- **WHEN** the client calls `listTemplates()`
- **THEN** the client SHALL return an array of template objects each containing at minimum: `id`, `name`, `display_name`, `active_version_id`

#### Scenario: No templates available
- **WHEN** the client calls `listTemplates()` and no templates exist
- **THEN** the client SHALL return an empty array

#### Scenario: API error on list
- **WHEN** the Coder API returns a non-2xx response during template listing
- **THEN** the client SHALL throw a descriptive error including the HTTP status

### Requirement: Client fetches presets for a template by name
The Coder API client SHALL provide a `getTemplatePresets(templateName: string)` method that resolves the template by name, then fetches its presets from the active template version.

#### Scenario: Template with presets found
- **WHEN** the client calls `getTemplatePresets("my-template")` and the template exists with presets
- **THEN** the client SHALL return an array of preset objects each containing: `id`, `name`, `description`

#### Scenario: Template has no presets
- **WHEN** the client calls `getTemplatePresets("my-template")` and the template has no presets defined
- **THEN** the client SHALL return an empty array

#### Scenario: Template name not found
- **WHEN** the client calls `getTemplatePresets("nonexistent")` and no template with that name exists
- **THEN** the client SHALL throw an error indicating the template was not found

#### Scenario: Template has no active version
- **WHEN** the resolved template has no `active_version_id`
- **THEN** the client SHALL throw an error indicating the template has no published version
