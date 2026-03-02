import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { CoderClient } from './coder/client.js';
import { userStore } from './store/user-store.js';

export const bot = new Telegraf(config.telegramBotToken);

export function getCoderClient(userId: number): CoderClient | null {
  const key = userStore.getApiKey(userId);
  if (!key) return null;
  return new CoderClient(config.coderApiUrl, key);
}

process.once('SIGINT', () => {
  console.log('Shutting down...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Shutting down...');
  bot.stop('SIGTERM');
});
