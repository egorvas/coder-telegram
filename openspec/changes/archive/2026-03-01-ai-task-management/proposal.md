## Why

Coder supports AI tasks — autonomous agents running inside workspaces. Developers need to manage these tasks directly from Telegram: create them from templates, monitor logs, update prompts, and clean up finished tasks. This makes the bot a complete control surface for AI-assisted development workflows.

## What Changes

- Extend the Coder API client with AI task endpoints: create, list, get, append prompt, delete task
- Add bot commands for task management: `/tasks`, `/task_create <template>`, `/task_logs <id>`, `/task_append <id> <prompt>`, `/task_delete <id>`
- Extend the `coder-api-client` capability with task-related methods
- Add task management commands as a new capability

## Capabilities

### New Capabilities
- `coder-task-api`: Coder API client methods for AI task operations (create, list, get status, get logs, append, delete)
- `task-commands`: Telegram bot commands for interacting with AI tasks

### Modified Capabilities
- `coder-api-client`: Extend with task-related API methods (new methods added, no existing behavior changed)

## Impact

- **API**: Uses Coder's task/AI agent endpoints (part of Coder's experimental AI features)
- **Code**: New modules `src/coder/tasks.ts` and `src/commands/tasks/`; extend `CoderClient`
- **Bot commands**: 5 new commands registered with Telegram
- **Dependencies**: No new external dependencies — uses the same fetch-based Coder client
