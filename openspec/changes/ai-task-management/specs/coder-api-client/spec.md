## ADDED Requirements

### Requirement: Client exposes task API methods
The Coder API client SHALL expose task management methods alongside workspace methods, using the same authentication and error handling patterns.

#### Scenario: Task methods available on client
- **WHEN** code accesses the CoderClient instance
- **THEN** the instance SHALL have methods: `listTasks`, `createTask`, `getTask`, `getTaskLogs`, `appendTaskPrompt`, `deleteTask`
