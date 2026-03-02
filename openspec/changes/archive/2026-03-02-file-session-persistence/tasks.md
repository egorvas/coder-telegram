## 1. Config

- [x] 1.1 Add `SESSION_FILE` env var to `src/config.ts` (default `./data/sessions.json`)

## 2. TaskSessionStore persistence

- [x] 2.1 Add `load()` method to `TaskSessionStore`: read JSON file on construction, populate `sessions` and `nameToId` maps; silently skip if file missing
- [x] 2.2 Add `save()` method: async `writeFile` of both maps as JSON; `mkdirSync` parent dir first; log errors
- [x] 2.3 Call `save()` in `register()`, `registerName()`, and `remove()`

## 3. Docs

- [x] 3.1 Add `SESSION_FILE` row to env vars table in `README.md`
- [x] 3.2 Add `volumes: ./data:/app/data` to Docker Compose example in `README.md`
