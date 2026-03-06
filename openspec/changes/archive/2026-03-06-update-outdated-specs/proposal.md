## Why

The feature branch `feature/live-task-cards` introduced major UX changes (live cards, completion logs, reply-based interaction, inline delete confirmation, single-message wizard, delayed log sending), but existing specs in `openspec/specs/` still describe the old behavior. This creates a mismatch where specs no longer reflect the actual system, making them unreliable as a reference for future changes.

## What Changes

- Update specs that describe outdated behavior to match current implementation
- Remove specs for features/commands that no longer exist
- A new `live-task-cards` spec was already created — this change ensures all related specs are consistent with it

## Capabilities

### New Capabilities

_(none — `live-task-cards` spec already created separately)_

### Modified Capabilities

- `task-completion-flow`: Outdated — describes "Append prompt" and "Delete task" buttons on completion messages. Current behavior: completion log has NO keyboard; reply-based interaction replaces append button; delete is on the card only.
- `task-dashboard`: Outdated — describes per-task "Logs/Append/Delete" buttons and pause/resume. Current behavior: selecting a task re-sends a card (not a log view); no append button; no pause/resume; card has Full Log, Model, Delete, Open buttons.
- `task-poller`: Outdated — only describes `stopped` transition notifications. Current behavior: poller updates live cards in-place, tracks agent state (`working`/`complete`/`idle`), sends delayed completion logs, handles card recreation.
- `task-session-store`: Outdated — describes pending append state and basic `getAllSessions`. Current behavior: tracks `cardMessageId`, `logMessageId`, `lastPrompt`, `presetName`, `pendingLogSend`, `workingStartedAt`, `lastKnownAgentState`; `findByReplyMessageId` for reply matching.
- `task-creation-wizard`: Outdated — describes 4-step wizard with separate messages and workspace selection. Current behavior: 3-step wizard (template → preset → prompt), single dynamic message, no workspace step, supports both task and workspace modes.
- `task-commands`: Outdated — describes `/tasks <workspace>`, `/task_create`, `/task_logs`, `/task_append`, `/task_delete` commands. Most of these are removed; current commands are `/tasks` (dashboard), `/task_create` (wizard shortcut).
- `confirm-destructive-actions`: Outdated — describes confirmation via new message. Current behavior: inline confirmation (edits current message with Yes/No).
- `task-log-document`: Outdated — describes caption on document. Current behavior: document sent without caption.
- `task-append-availability`: **Remove** — describes "Append button" which no longer exists. Replaced by reply-based interaction in `live-task-cards` spec.

## Impact

- Only `openspec/specs/` files are affected — no code changes
- 8 specs updated, 1 spec removed
- All updates are documentation-only, aligning specs with already-shipped code
