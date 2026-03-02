## 1. Expose agent state from task sessions

- [x] 1.1 Add `getAgentState(taskId: string): string | undefined` method to `src/store/task-sessions.ts` that returns `lastKnownAgentState` for a given task ID

## 2. Update keyboard builder

- [x] 2.1 Add optional `agentState?: string` parameter to `taskMenuKeyboard` in `src/ui/keyboards.ts`
- [x] 2.2 Conditionally omit the Append button row entry when `agentState === 'working'`

## 3. Pass agent state at all call sites

- [x] 3.1 In `src/ui/handlers/task-dashboard.ts` `task:view` action: look up `taskSessions.getAgentState(taskId)` and pass to `taskMenuKeyboard`
- [x] 3.2 In `src/ui/handlers/task-dashboard.ts` `task:logs` action: same lookup and pass
- [x] 3.3 In `src/ui/handlers/task-dashboard.ts` `task:delete:cancel` action: same lookup and pass
- [x] 3.4 In `src/ui/handlers/task-dashboard.ts` `task:logs:full` action: same lookup and pass
- [x] 3.5 In `src/ui/handlers/task-dashboard.ts` `task:model:set` action: same lookup and pass
- [x] 3.6 In `src/flows/task-completion.ts`: pass agent state when calling `taskMenuKeyboard` (if used there)
