import type { Context } from 'telegraf';
import { CoderAuthError } from '../coder/client.js';
import { userStore } from '../store/user-store.js';
import { uiState } from '../ui/state.js';
import { config } from '../config.js';
import { log } from './logger.js';

export { CoderAuthError };

export async function handleCoderError(ctx: Context, err: unknown, userId: number): Promise<void> {
  if (err instanceof CoderAuthError && userId) {
    log.warn('coder auth expired, resetting key', { userId });
    userStore.clearApiKey(userId);
    const chatId = ctx.chat?.id;
    if (chatId) {
      uiState.setPendingKeySetup(chatId);
    }
    await ctx.reply(
      `❌ Your Coder API key has expired or is no longer valid.\n\nEnter a new key from \`${config.coderApiUrl}/settings/tokens\`:`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
}
