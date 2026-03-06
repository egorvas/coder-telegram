## 1. Apply delta specs to existing spec files

- [x] 1.1 Update `openspec/specs/task-completion-flow/spec.md` — replace old completion flow with log message + reply-based interaction, remove Append/Delete button requirements
- [x] 1.2 Update `openspec/specs/task-dashboard/spec.md` — replace per-task Logs/Append/Delete with card re-creation, remove pause/resume
- [x] 1.3 Update `openspec/specs/task-poller/spec.md` — add live card updates, delayed log sending, auto-discovery, agent state tracking
- [x] 1.4 Update `openspec/specs/task-session-store/spec.md` — add new fields (cardMessageId, logMessageId, lastPrompt, presetName, pendingLogSend, workingStartedAt), add findByReplyMessageId, remove pending append state
- [x] 1.5 Update `openspec/specs/task-creation-wizard/spec.md` — rewrite as 3-step wizard with single dynamic message, remove workspace step
- [x] 1.6 Update `openspec/specs/task-commands/spec.md` — simplify to /tasks (dashboard) and /task_create (wizard), remove /task_logs, /task_append, /task_delete
- [x] 1.7 Update `openspec/specs/confirm-destructive-actions/spec.md` — change to inline confirmation (edit message), add workspace delete confirmation
- [x] 1.8 Update `openspec/specs/task-log-document/spec.md` — remove caption from document requirement

## 2. Remove obsolete specs

- [x] 2.1 Delete `openspec/specs/task-append-availability/spec.md` (Append button no longer exists)

## 3. Verify consistency

- [x] 3.1 Verify all updated specs are consistent with `openspec/specs/live-task-cards/spec.md`
- [x] 3.2 Verify no other specs reference removed concepts (Append button, pending append state, /task_logs, /task_append, /task_delete)
- [x] 3.3 Updated `openspec/specs/ui-state/spec.md` — removed stale "pending append" references, added key setup/admin add/global view requirements
