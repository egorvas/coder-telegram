import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { CoderClient } from './coder/client.js';
import { userStore } from './store/user-store.js';
import { log } from './utils/logger.js';

export const bot = new Telegraf(config.telegramBotToken);

export function getCoderClient(userId: number): CoderClient | null {
  const key = userStore.getApiKey(userId);
  if (!key) return null;
  return new CoderClient(config.coderApiUrl, key);
}

process.once('SIGINT', () => {
  log.info('shutting down');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  log.info('shutting down');
  bot.stop('SIGTERM');
});
