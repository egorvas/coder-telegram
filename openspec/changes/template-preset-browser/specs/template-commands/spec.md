## ADDED Requirements

### Requirement: List templates command
The bot SHALL provide a `/templates` command that displays all available Coder templates.

#### Scenario: Templates exist
- **WHEN** a user sends `/templates`
- **THEN** the bot SHALL reply with a formatted list showing each template's display name and technical name (for use in commands)

#### Scenario: No templates available
- **WHEN** a user sends `/templates` and no templates exist
- **THEN** the bot SHALL reply with a message indicating no templates were found

#### Scenario: List exceeds message limit
- **WHEN** the template list would exceed Telegram's character limit
- **THEN** the bot SHALL show as many templates as fit and append a note with the total count (e.g., "showing 20 of 35 templates")

#### Scenario: API error during template list
- **WHEN** the Coder API returns an error
- **THEN** the bot SHALL reply with a user-friendly error message

### Requirement: List presets command
The bot SHALL provide a `/presets <template_name>` command that shows all presets for a given template.

#### Scenario: Template has presets
- **WHEN** a user sends `/presets my-template`
- **THEN** the bot SHALL reply with a formatted list of presets showing each preset's name and description

#### Scenario: Template has no presets
- **WHEN** a user sends `/presets my-template` and the template has no presets
- **THEN** the bot SHALL reply indicating the template has no presets defined

#### Scenario: Missing template name argument
- **WHEN** a user sends `/presets` without a template name
- **THEN** the bot SHALL reply with usage instructions: `/presets <template_name>`

#### Scenario: Template not found
- **WHEN** a user sends `/presets nonexistent`
- **THEN** the bot SHALL reply indicating the template was not found

#### Scenario: API error during preset fetch
- **WHEN** the Coder API returns an error
- **THEN** the bot SHALL reply with a user-friendly error message

### Requirement: Task create command references template discovery
The bot's `/task_create` command help text SHALL mention `/templates` and `/presets` so users know how to find valid values.

#### Scenario: User sends /task_create without arguments
- **WHEN** a user sends `/task_create` without arguments
- **THEN** the usage message SHALL include a hint such as: "Use /templates to list templates and /presets <template> to see available presets"
