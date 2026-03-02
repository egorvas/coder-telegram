import type { Context } from 'telegraf';
import { mainMenuKeyboard } from '../ui/keyboards.js';
import { userStore } from '../store/user-store.js';
import { uiState } from '../ui/state.js';
import { config } from '../config.js';

export function keySetupMessage(coderUrl: string): string {
  return (
    `*Welcome to Coder Bot!*\n\n` +
    `To get started, please enter your personal Coder API key.\n\n` +
    `You can create one at:\n\`${coderUrl}/settings/tokens\`\n\n` +
    `Just paste the key here:`
  );
}

export async function startCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!userId || !chatId) return;

  const hasKey = !!userStore.getApiKey(userId);
  if (!hasKey) {
    uiState.setPendingKeySetup(chatId);
    await ctx.reply(keySetupMessage(config.coderApiUrl), { parse_mode: 'Markdown' });
    return;
  }

  const WELCOME = `*Coder Bot* — choose a section:`;
  await ctx.reply(WELCOME, { parse_mode: 'Markdown', ...mainMenuKeyboard(config.adminUsers.has(userId)) });
}
