## ADDED Requirements

### Requirement: Two-component task representation

A task is represented in Telegram by two message types: a **live card** (persistent, editable) and a **completion log message** (sent once when AI finishes).

#### Scenario: Card is the primary representation
- **GIVEN** a task is created (via wizard or auto-discovered)
- **THEN** the bot SHALL send a single card message with inline keyboard and track its `cardMessageId` in the session store

#### Scenario: Log message is the secondary representation
- **WHEN** the AI finishes working (agent state transitions to `idle` after `working` or `complete`)
- **THEN** the bot SHALL send a separate log message (no keyboard) with parsed AI response and track its `logMessageId` in the session store

---

### Requirement: Card text format

The card message SHALL display: status emoji, task name, template/preset context, last prompt (or initial prompt), and an optional status snippet.

#### Scenario: Card header with preset
- **GIVEN** a task with template "my-template" and preset "fast-preset"
- **THEN** the card header SHALL be: `{emoji} *{taskName}* (my-template / fast-preset) — {statusLabel}`

#### Scenario: Card header without preset
- **GIVEN** a task with template "my-template" and no preset
- **THEN** the card header SHALL be: `{emoji} *{taskName}* (my-template) — {statusLabel}`

#### Scenario: Prompt shown as blockquote
- **WHEN** the task has a `lastPrompt` (from append) or `initial_prompt`
- **THEN** the card SHALL show it as a Markdown blockquote (`> ...`), truncated to 200 characters

#### Scenario: Status snippet from agent message
- **WHEN** `opts.statusSnippet` (the `current_state.message` from the API) is provided
- **THEN** the card SHALL display it in a code block, fitted to stay within Telegram's 4096-char limit

---

### Requirement: Card status indicators

The card SHALL display status via emoji and label based on task status and agent state.

#### Scenario: Agent is working
- **WHEN** `agentState === 'working'`
- **THEN** emoji = `⏳`, label = `Working…`

#### Scenario: Task active and agent idle (done)
- **WHEN** `status === 'active'` and `agentState === 'idle'`
- **THEN** emoji = `✅`, label = `Done`

#### Scenario: Task pending or initializing
- **WHEN** status is `pending` or `initializing`
- **THEN** emoji = `🔄`, label = `Pending` or `Initializing…`

#### Scenario: Task stopped
- **WHEN** status is `stopped`
- **THEN** emoji = `⏹`, label = `Stopped`

#### Scenario: Task error
- **WHEN** status is `error`
- **THEN** emoji = `❌`, label = `Error`

---

### Requirement: Card inline keyboard

The card SHALL have an inline keyboard that adapts based on agent state.

#### Scenario: Agent is NOT working
- **THEN** the keyboard SHALL show two rows:
  - Row 1: `📄 Full Log`, `🧠 Model`
  - Row 2: `🗑 Delete`, `🌐 Open` (URL button to Coder web UI)

#### Scenario: Agent is working
- **THEN** the keyboard SHALL show one row only:
  - Row 1: `🗑 Delete`, `🌐 Open`
  - (Full Log and Model buttons are hidden while working)

---

### Requirement: Card updates live via poller

The poller SHALL update the card in-place when task status or agent state changes.

#### Scenario: Status or agent state changed
- **WHEN** `status !== lastKnownStatus` or `agentState !== lastKnownAgentState`
- **THEN** the poller SHALL call `updateCard()` to edit the card message with new text and keyboard

#### Scenario: Card deleted by user
- **WHEN** `updateCard()` returns `false` (message not found)
- **THEN** the poller SHALL send a new card via `sendCard()` and update `cardMessageId` in the session

#### Scenario: Rate limit from Telegram
- **WHEN** Telegram returns "Too Many Requests"
- **THEN** `updateCard()` SHALL return `true` (treat as success, retry next cycle)

#### Scenario: Content unchanged
- **WHEN** Telegram returns "message is not modified"
- **THEN** `updateCard()` SHALL return `true` (no action needed)

---

### Requirement: Selecting task from dashboard re-creates card

When a user selects a task from the task list, the bot SHALL delete the old card (if any) and send a fresh card at the bottom of the chat.

#### Scenario: Task selected from dashboard
- **WHEN** user clicks `task:select:{id}`
- **THEN** the bot SHALL:
  1. Delete the existing card message (if `cardMessageId` exists)
  2. Send a new card with current status, `lastPrompt`, `statusSnippet`, and `presetName`
  3. Update `cardMessageId` in the session store

---

### Requirement: Completion log message format

The log message SHALL use `📝 Report` header, show execution duration, last prompt, and parsed AI response.

#### Scenario: Log message with prompt and duration
- **GIVEN** a task that finished in 2m 30s with lastPrompt "fix the bug"
- **THEN** the log message SHALL be:
  ```
  📝 *{taskName}* — Report (2m 30s)

  > fix the bug

  ```
  {parsed AI response in code block}
  ```
  ```

#### Scenario: Log message with truncated output
- **WHEN** the parsed response exceeds Telegram's limit
- **THEN** the bot SHALL truncate from the top (show the end of the log) and append `_(truncated)_`

#### Scenario: No logs available
- **WHEN** there are no logs
- **THEN** the log message SHALL show `_No logs yet._`

#### Scenario: Log message has no keyboard
- **THEN** the log message SHALL NOT have any inline keyboard (unlike the card)

---

### Requirement: Delayed log sending

The bot SHALL delay sending the completion log by one poll cycle to ensure logs are fully written.

#### Scenario: AI finishes — first detection
- **WHEN** agent state transitions to `idle` from `working` or `complete` (while task is `active`)
- **THEN** the poller SHALL set `pendingLogSend = true` and NOT send the log yet

#### Scenario: Second poll cycle — still idle
- **WHEN** `pendingLogSend === true` and agent state is still `idle`
- **THEN** the poller SHALL fetch logs, parse them via `extractLastResponse()`, and send the log message

#### Scenario: Agent starts working again before log is sent
- **WHEN** `pendingLogSend === true` but agent state is `working`
- **THEN** the poller SHALL cancel the pending log send (`pendingLogSend = false`)

#### Scenario: First-seen done task (auto-discovered)
- **WHEN** `agentState === 'idle'` and `lastKnownAgentState === undefined` and `status === 'active'`
- **THEN** the poller SHALL treat this as `aiFinished` and set `pendingLogSend = true`

---

### Requirement: Skip log after /model change

The bot SHALL NOT send a completion log when the last prompt was a `/model` command.

#### Scenario: Model changed via button
- **WHEN** user selects a model via `task:model:set:{id}:{model}`
- **THEN** the bot SHALL call `setLastPrompt(taskId, userId, '/model {model}')` so the poller can detect it

#### Scenario: Poller detects /model as last prompt
- **WHEN** `pendingLogSend` is ready and `lastPrompt` starts with `/model`
- **THEN** the poller SHALL skip sending the log message

---

### Requirement: Reply-based interaction

Users can reply to either the card message or the log message to append a prompt to the task.

#### Scenario: User replies to card
- **WHEN** a user sends a text message replying to a card message
- **THEN** the bot SHALL call `appendTaskPrompt(taskId, text)`, update `lastPrompt`, and refresh the card

#### Scenario: User replies to log message
- **WHEN** a user sends a text message replying to a log message
- **THEN** the bot SHALL call `appendTaskPrompt(taskId, text)` and update `lastPrompt`

#### Scenario: Reply matching
- **GIVEN** `findByReplyMessageId` checks both `cardMessageId` and `logMessageId`
- **THEN** replying to either message type SHALL find the associated task

---

### Requirement: Inline delete confirmation

Deleting a task SHALL use inline confirmation (edit the same message) instead of sending a new message.

#### Scenario: User clicks Delete on card
- **WHEN** user clicks `🗑 Delete`
- **THEN** the bot SHALL edit the card to show `Delete task *{name}*? This cannot be undone.` with `✅ Yes` / `❌ No` buttons

#### Scenario: User confirms delete
- **WHEN** user clicks `✅ Yes`
- **THEN** the bot SHALL delete the task via API, remove from session store, and edit message to `🗑 Task {id} deleted.`

#### Scenario: User cancels delete
- **WHEN** user clicks `❌ No`
- **THEN** the bot SHALL restore the original card text and keyboard

---

### Requirement: Full log as document

The Full Log button SHALL send the complete log as a `.txt` file without any caption.

#### Scenario: User clicks Full Log
- **WHEN** user clicks `📄 Full Log`
- **THEN** the bot SHALL send a `.txt` document (via `replyWithDocument`) with no caption text

#### Scenario: No logs available
- **WHEN** there are no logs
- **THEN** the bot SHALL reply with "No logs yet."

---

### Requirement: Model selection from card

The Model button SHALL allow switching the AI model inline.

#### Scenario: User clicks Model
- **WHEN** user clicks `🧠 Model`
- **THEN** the bot SHALL replace the card keyboard with model options: Haiku (fast), Sonnet (balanced), Opus (smart), and a Back button

#### Scenario: User selects a model
- **WHEN** user clicks a model option
- **THEN** the bot SHALL send `/model {model}` as an appended prompt and restore the card keyboard

---

### Requirement: Working timer tracking

The session store SHALL track when the agent started working to calculate execution duration.

#### Scenario: Agent starts working
- **WHEN** `agentState` transitions to `working` (and was not previously `working`)
- **THEN** the session store SHALL set `workingStartedAt = Date.now()`

#### Scenario: Duration shown in log message
- **WHEN** a log message is sent and `workingStartedAt` exists
- **THEN** the duration SHALL be calculated as `Date.now() - workingStartedAt` and formatted as `Xs`, `Xm Ys`, or `Xh Ym`

---

### Source files

| File | Role |
|------|------|
| `src/ui/task-card.ts` | Card/log rendering: `buildCardText`, `sendCard`, `updateCard`, `sendLogMessage` |
| `src/ui/keyboards.ts` | `taskCardKeyboard`, `modelKeyboard`, `confirmKeyboard` |
| `src/flows/task-poller.ts` | Polling loop, state change detection, card updates, delayed log sending |
| `src/store/task-sessions.ts` | Session persistence: `cardMessageId`, `logMessageId`, `lastPrompt`, `pendingLogSend`, `workingStartedAt`, `presetName` |
| `src/ui/handlers/task-dashboard.ts` | `task:select`, `task:delete`, `task:fulllog`, `task:model` handlers |
| `src/index.ts` | Reply-based text handler, wizard prompt input |
