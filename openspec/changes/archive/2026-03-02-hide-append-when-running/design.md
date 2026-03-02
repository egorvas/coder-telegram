## Context

Task sessions already track `lastKnownAgentState` (`working` | `idle`) in `task-sessions.ts`. The task detail keyboard is built in `src/ui/handlers/tasks.ts`. The Append button is always rendered regardless of agent state, causing a 502 when the agent is busy.

## Goals / Non-Goals

**Goals:**
- Conditionally render the Append button only when agent state is `idle`
- Use already-stored `lastKnownAgentState` — no new API calls needed

**Non-Goals:**
- Real-time keyboard refresh when state changes mid-view
- Disabling (greying out) the button — full removal is simpler and clearer

## Decisions

**Pass agent state to keyboard builder**
The keyboard builder function in `tasks.ts` currently doesn't receive agent state. We'll add an optional `agentState` parameter and conditionally include the Append button.

Alternative: fetch live state from the API — rejected, adds latency and complexity; stored state is sufficient since the keyboard is rendered right after a poller update.

**Hide vs disable**
Hiding is chosen over disabling (showing a non-functional button) because Telegram doesn't support visually disabled buttons, and a hidden button is unambiguous.

## Risks / Trade-offs

- **Stale state**: If the user opens a task detail message before the poller has updated `lastKnownAgentState`, the button state may be stale by up to `POLL_INTERVAL_MS` (default 15s). Acceptable — the agent state is refreshed frequently and the edge case is rare.
- **No keyboard refresh**: After agent transitions to `working`, the already-displayed keyboard still shows Append until the message is re-rendered. Mitigation: poller already re-renders task messages on state changes (or we ensure it does).
