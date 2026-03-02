## 1. Keyboard

- [x] 1.1 In `src/ui/keyboards.ts`, update `taskMenuKeyboard` to split actions into two rows: `[📋 Logs] [📄 Full Log]` on row 1, `[✏️ Append] [🗑 Delete]` on row 2; add `Markup.button.callback('📄 Full Log', \`task:fulllog:${taskId}\`)`

## 2. Handler

- [x] 2.1 In `src/ui/handlers/task-dashboard.ts`, add `bot.action(/^task:fulllog:(.+)$/, ...)` handler: fetch logs, if empty reply "No logs yet.", otherwise send `ctx.replyWithDocument({ source: Buffer.from(logs), filename: \`${taskId.slice(0, 8)}-log.txt\` }, { caption: \`Task \${taskId.slice(0, 8)} — \${task.status}\` })`
