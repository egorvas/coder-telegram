import { log } from './utils/logger.js';

const required = ['TELEGRAM_BOT_TOKEN', 'CODER_API_URL'] as const;

const missing = required.filter((v) => !process.env[v]);
if (missing.length > 0) {
  log.error('missing required environment variables', { missing: missing.join(', ') });
  process.exit(1);
}

function parseIdList(env: string | undefined): Set<number> {
  return new Set(
    (env ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
  );
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  coderApiUrl: process.env.CODER_API_URL!.replace(/\/$/, ''),
  pollIntervalMs: process.env.POLL_INTERVAL_MS ? parseInt(process.env.POLL_INTERVAL_MS, 10) : 15_000,
  sessionFile: process.env.SESSION_FILE ?? './data/sessions.json',
  adminUsers: parseIdList(process.env.ADMIN_USERS),
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
