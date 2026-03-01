## Context

The `ai-task-management` change adds task CRUD commands. Once a task is created, the user loses awareness of it unless they manually poll `/task_logs`. This change adds a completion notification layer: either Coder pushes a webhook, or the user manually checks — both paths lead to the same interactive flow in Telegram.

Multiple tasks can run simultaneously, so state must be keyed by task ID, not by chat or user.

## Goals / Non-Goals

**Goals:**
- Track which Telegram chat created each task (task-session store)
- Optional HTTP webhook server that receives Coder callbacks and notifies users
- Unified completion flow: log delivery + inline keyboard (Append / Delete)
- Graceful degradation: full functionality without `WEBHOOK_PORT` configured

**Non-Goals:**
- Persistent storage across restarts (in-memory only for now)
- Real-time log streaming
- Webhook retry logic or delivery guarantees
- Supporting multiple Telegram users with different Coder accounts

## Decisions

**Decision: In-memory task session store (Map) vs. persistent DB**
Use a `Map<taskId, { chatId, userId }>` in process memory. Rationale: this is a personal/small-team bot; persistence adds complexity. If the bot restarts, in-flight tasks are lost — acceptable for now. The store is a single module so it can be swapped for Redis later without touching callers.

**Decision: Built-in `node:http` vs. Express for webhook server**
Use `node:http` directly. The webhook endpoint is a single POST route — Express would be overkill and adds a dependency. The server only starts if `WEBHOOK_PORT` is set.

**Decision: Inline keyboard buttons vs. follow-up text commands**
Use Telegram inline keyboard buttons (Append / Delete) attached to the completion notification message. This avoids the user needing to remember command syntax after being notified. Callback data encodes `action:taskId` (e.g., `append:abc123`, `delete:abc123`).

**Decision: "Append" button flow**
Clicking "Append" puts the user into a one-shot prompt state: the bot asks "What do you want to add?" and waits for the next text message from that chat, then calls `appendTaskPrompt`. State is stored as `pendingAppend: taskId` in the session store keyed by chatId.

**Decision: Webhook secret verification**
If `WEBHOOK_SECRET` is set, the server checks the `X-Coder-Signature` header (HMAC-SHA256 of the body). Requests with invalid or missing signatures are rejected with 401. Without `WEBHOOK_SECRET`, verification is skipped (dev/trusted network mode).

## Risks / Trade-offs

- **In-memory store lost on restart** → Tasks created before a restart won't receive notifications. Mitigation: user can still poll `/task_logs` manually.
- **Coder webhook format unknown / unstable** → Wrap parsing in try/catch; log raw payload on parse error. If Coder doesn't support webhooks, the bot still works via manual commands.
- **Append awaiting state conflict** → If user triggers two Appends simultaneously, the second overwrites the first. Mitigation: acceptable for a personal bot; document the limitation.
- **Long logs overflowing Telegram message limit** → Truncate to last 50 lines with a trailing note; 4096 char Telegram limit applies.

## Open Questions

- Does Coder's AI task API actually emit webhooks, and what is the payload schema? → Need to verify against Coder docs or source. The webhook server is designed to be adapted once the schema is known.
- Should the completion flow also re-fetch task status (to show "succeeded" vs "failed")? → Assume yes; show status alongside logs.
