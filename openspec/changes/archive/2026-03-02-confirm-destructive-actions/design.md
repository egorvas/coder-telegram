## Context

Telegraf callback actions are limited to 64 bytes per callback_data. Current action strings like `task:delete:<uuid>` (e.g. `task:delete:abc12345-...`) already use ~45 bytes, leaving ~19 bytes for a confirm/cancel suffix.

Current flow: button press → immediate API call.
New flow: button press → confirm prompt → second button press → API call.

## Goals / Non-Goals

**Goals:**
- One confirmation step for `task:delete:<id>` and `ws:stop:<name>`
- Reusable confirm keyboard helper in `keyboards.ts`
- Minimal changes — no new state, no wizard

**Non-Goals:**
- Confirmation for start workspace (non-destructive)
- Confirmation for append (non-destructive)
- Timeout or auto-cancel of confirmation prompt

## Decisions

**Encode action in callback_data** — confirm/cancel carry the full action inline (`task:delete:confirm:<id>`, `task:delete:cancel:<id>`). No server state needed. Alternative (store pending action in uiState) adds complexity for no benefit.

**Edit original message vs. new message** — the confirm prompt replaces the keyboard on the existing message via `ctx.editMessageReplyMarkup` or sends a new reply. Sending a new reply is simpler and avoids issues with edited message constraints. The original menu message remains visible as context.

**Shared `confirmKeyboard(yesAction, noAction)`** — single helper in `keyboards.ts` takes the two callback strings and returns `Markup.inlineKeyboard([[✅ Yes, ❌ No]])`. Keeps both handlers DRY.

## Risks / Trade-offs

- [64-byte limit] UUIDs are 36 chars; `task:delete:confirm:` is 20 chars → 56 total, within limit. Workspace names are truncated to 51 chars in existing buttons — same truncation applies here.
- [Double-confirm spam] User can tap Yes multiple times before API responds. Telegraf will answer the second cbQuery with an error, which is silently swallowed. No data integrity risk since delete/stop are idempotent.
