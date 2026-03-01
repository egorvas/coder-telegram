# Coder Telegram Bot

Telegram-бот для взаимодействия с Coder через API.

## Tech Stack

- **Runtime**: Node.js (TypeScript)
- **Module system**: ESM (`"type": "module"`)
- **Build**: `tsc` -> `dist/`
- **Dev**: `tsx watch`

## Project Structure

```
src/           - исходный код
openspec/      - спецификации (OpenSpec)
  specs/       - спеки фичей
  changes/     - активные изменения
```

## Development

```bash
npm run dev        # запуск в dev-режиме с hot reload
npm run build      # сборка
npm run start      # запуск production
npm run type-check # проверка типов
```

## Rules

- Код и комментарии на английском
- Strict TypeScript
- ESM imports (с расширением `.js` в импортах)
