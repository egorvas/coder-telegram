## Context

The workspace action keyboard (`workspaceActionKeyboard`) currently renders:
```
[▶️ Start] or [⏹ Stop]
[🌐 Open in Coder]
[« Back]
```

The Coder API supports workspace deletion via the workspace builds endpoint:
`POST /api/v2/workspaces/{id}/builds` with `{ transition: "delete" }` → 201, async operation.

The existing task delete flow (with confirmation) is a proven pattern in the codebase and can be reused directly.

## Goals / Non-Goals

**Goals:**
- Add a 🗑 Delete button to the workspace action menu (visible regardless of status)
- Show a confirmation prompt before deleting
- Return to the workspace list after deletion

**Non-Goals:**
- Force-deleting workspaces that are in a building state
- Waiting for deletion to complete (API is async)

## Decisions

### 1. Delete button always visible (not status-conditional)
Show `🗑 Delete` on all workspace action menus regardless of running/stopped state.
**Why**: Users may want to delete a running workspace (Coder handles this via the delete build transition). Hiding it only when running adds complexity for little benefit.

### 2. Confirmation flow mirrors task delete pattern
Use the existing `confirmKeyboard(yes, no)` with `ws:delete:confirm:<name>` and `ws:delete:cancel:<name>`. The cancel handler returns the workspace action menu.
**Why**: Consistent UX with task deletion; avoids accidental deletes.

### 3. New `deleteWorkspace(name: string)` client method
Mirror `startWorkspace`/`stopWorkspace`: look up by name, then POST the build with `transition: 'delete'`.
**Why**: Consistent API client pattern; encapsulates the name→ID lookup.

### 4. Button layout after delete
```
[▶️ Start] or [⏹ Stop]
[🗑 Delete]
[🌐 Open in Coder]
[« Back]
```

## Risks / Trade-offs

- [Irreversible action] Workspace deletion cannot be undone. → Mitigated by confirmation prompt.
- [Async deletion] The workspace may still appear briefly in the list after deletion is initiated. → Acceptable; Coder's async model is consistent with start/stop.
