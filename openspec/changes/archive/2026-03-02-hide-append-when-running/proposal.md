## Why

When a Coder AI task agent is in the `working` state (actively processing), sending an append prompt returns a 502 error: "Task app is not ready to accept input." The Append button should not be shown when the agent is busy.

## What Changes

- Hide the "Append" inline keyboard button on tasks whose agent state is `working`
- Show Append only when agent state is `idle` (agent is waiting for input)

## Capabilities

### New Capabilities

- `task-append-availability`: Rules governing when the Append action is available on a task

### Modified Capabilities

<!-- none -->

## Impact

- `src/ui/handlers/tasks.ts` — task detail keyboard builder must receive agent state
- `src/store/task-sessions.ts` — `lastKnownAgentState` already stored; needs to be surfaced
- No API or schema changes
