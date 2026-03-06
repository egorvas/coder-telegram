## Context

The bot underwent a major UX overhaul on branch `feature/live-task-cards`. A new `live-task-cards` spec was created to document the new behavior, but 8 existing specs still describe the old behavior. This change updates them to match the current implementation.

## Goals / Non-Goals

**Goals:**
- Align all specs with the current codebase
- Remove specs for features that no longer exist
- Make specs reliable as a reference for future changes

**Non-Goals:**
- No code changes — this is documentation-only
- No new features or behavior changes
- Not restructuring the spec directory layout

## Decisions

1. **Update in-place vs. rewrite**: Use MODIFIED/REMOVED delta operations on existing specs rather than deleting and recreating. This preserves spec history and makes changes reviewable.

2. **Remove `task-append-availability`**: This spec describes an "Append button" that no longer exists. Reply-based interaction is fully covered in the `live-task-cards` spec, so this spec is redundant.

3. **Reference `live-task-cards` spec**: Several updated specs will reference the `live-task-cards` spec for detailed card/log behavior rather than duplicating those requirements.

## Risks / Trade-offs

- [Risk: Missing a requirement during update] → Mitigated by reading the actual source code for each spec, not just the `live-task-cards` spec.
- [Risk: Specs diverge again in the future] → Out of scope for this change, but the updated specs serve as a better baseline.
