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
  webhookPort: process.env.WEBHOOK_PORT ? parseInt(process.env.WEBHOOK_PORT, 10) : undefined,
  webhookSecret: process.env.WEBHOOK_SECRET,
  sessionFile: process.env.SESSION_FILE ?? './data/sessions.json',
};
