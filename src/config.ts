const required = ['TELEGRAM_BOT_TOKEN', 'CODER_API_URL', 'CODER_API_TOKEN'] as const;

const missing = required.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
  coderApiUrl: process.env.CODER_API_URL!.replace(/\/$/, ''),
  coderApiToken: process.env.CODER_API_TOKEN!,
  pollIntervalMs: process.env.POLL_INTERVAL_MS ? parseInt(process.env.POLL_INTERVAL_MS, 10) : 15_000,
  sessionFile: process.env.SESSION_FILE ?? './data/sessions.json',
  allowedUsers: new Set(
    (process.env.ALLOWED_USERS ?? '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
  ),
};
