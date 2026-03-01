## 1. keyboards.ts — add URL buttons

- [x] 1.1 Import `config` from `../../config.js` (or `../config.js`) in `keyboards.ts`
- [x] 1.2 Add `Markup.button.url('🌐 Open in Coder', ...)` row to `taskMenuKeyboard` using `config.coderApiUrl + '/tasks/' + taskId`
- [x] 1.3 Add `Markup.button.url('🌐 Open in Coder', ...)` row to `workspaceActionKeyboard` using `config.coderApiUrl + '/@me/' + ws.name`
- [x] 1.4 Add `templateName` parameter to `presetListKeyboard` (already has `_templateName`, remove underscore) and add URL button row using `config.coderApiUrl + '/templates/' + templateName`

## 2. Update callers of presetListKeyboard

- [x] 2.1 Update `template-browser.ts` to pass `templateName` to `presetListKeyboard` (it already passes it as second arg — just remove the `_` from the parameter name in keyboards.ts)

## 3. Type-check

- [x] 3.1 Run `npm run type-check` and fix any errors
