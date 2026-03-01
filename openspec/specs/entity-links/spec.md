## ADDED Requirements

### Requirement: Task submenu has Open in Coder button
The task submenu keyboard SHALL include a URL button that opens the task detail page in the Coder web UI. The URL SHALL be constructed as `{CODER_API_URL}/tasks/{taskId}`.

#### Scenario: User opens task in Coder
- **WHEN** user views the task submenu
- **THEN** a "🌐 Open in Coder" URL button is visible that navigates to the task page in the browser

### Requirement: Workspace action menu has Open in Coder button
The workspace action keyboard SHALL include a URL button that opens the workspace page in the Coder web UI. The URL SHALL be constructed as `{CODER_API_URL}/@me/{workspaceName}`.

#### Scenario: User opens workspace in Coder
- **WHEN** user views the workspace action menu
- **THEN** a "🌐 Open in Coder" URL button is visible that navigates to the workspace page in the browser

### Requirement: Template preset view has Open in Coder button
The preset list keyboard SHALL include a URL button that opens the template page in the Coder web UI. The URL SHALL be constructed as `{CODER_API_URL}/templates/{templateName}`.

#### Scenario: User opens template in Coder
- **WHEN** user views the preset list for a template
- **THEN** a "🌐 Open in Coder" URL button is visible that navigates to the template page in the browser
