import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { CoderClient } from './coder/client.js';

export const bot = new Telegraf(config.telegramBotToken);
export const coderClient = new CoderClient(config.coderApiUrl, config.coderApiToken);

process.once('SIGINT', () => {
  console.log('Shutting down...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Shutting down...');
  bot.stop('SIGTERM');
});
