## Context

The bot already has (in `workspace-management` change) a Coder API client and a Telegraf-based bot structure. AI tasks in Coder are managed via the `/api/v2/workspaces/{workspace_id}/tasks` and related endpoints. Tasks represent autonomous AI agent runs inside workspaces — they have an ID, status, logs, and an associated template.

## Goals / Non-Goals

**Goals:**
- Extend `CoderClient` with task CRUD operations using the same auth pattern
- Add 5 new Telegram commands covering the task lifecycle
- Keep the same module structure established in `workspace-management`

**Non-Goals:**
- Real-time log streaming (polling only)
- Task scheduling or automation
- Parsing or rendering AI task output (raw text/logs returned as-is)

## Decisions

**Decision: Extend CoderClient vs. separate TaskClient**
Extend the existing `CoderClient` class with task methods rather than creating a separate client. Rationale: tasks are still Coder API resources; splitting would duplicate auth logic. If the client grows beyond ~10 methods, extract to separate files but keep the same class.

**Decision: Task commands as separate files per command**
Mirror the workspace-commands pattern — one file per command in `src/commands/tasks/`. This keeps files small and composable, and matches the existing convention.

**Decision: Append prompt vs. replace prompt**
Coder's AI task API supports appending follow-up prompts to an existing task (like a conversation). We expose this as `/task_append <id> <prompt>` — it adds context without restarting the task.

**Decision: Log retrieval by pagination**
Coder task logs can be large. Return the last N lines (e.g., last 50) by default to keep Telegram messages readable. No pagination UI in the bot.

## Risks / Trade-offs

- **Coder AI task API stability**: The task API may be experimental/unstable → Mitigation: wrap calls in try/catch, surface API errors to user clearly
- **Long logs in Telegram**: Task logs can be very long → Mitigation: truncate to last 50 lines, add a note when truncated
- **Task ID UX**: Users must copy/paste task IDs, which is clunky → Mitigation: `/tasks` list shows IDs clearly; future improvement could use inline keyboards
