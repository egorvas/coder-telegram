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

export type ReportFormat = 'code' | 'markdown' | 'html';

const REPORT_FORMATS = new Set<string>(['code', 'markdown', 'html']);

function parseReportFormat(env: string | undefined): ReportFormat {
  const val = (env ?? 'code').toLowerCase();
  if (REPORT_FORMATS.has(val)) return val as ReportFormat;
  return 'code';
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  coderApiUrl: process.env.CODER_API_URL!.replace(/\/$/, ''),
  pollIntervalMs: process.env.POLL_INTERVAL_MS ? parseInt(process.env.POLL_INTERVAL_MS, 10) : 15_000,
  sessionFile: process.env.SESSION_FILE ?? './data/sessions.json',
  adminUsers: parseIdList(process.env.ADMIN_USERS),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  reportFormat: parseReportFormat(process.env.REPORT_FORMAT),
};
