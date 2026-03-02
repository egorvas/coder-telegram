import type { Telegraf } from 'telegraf';
import { getCoderClient } from '../bot.js';
import { taskMenuKeyboard } from '../ui/keyboards.js';
import { log } from '../utils/logger.js';

export async function notifyTaskComplete(taskId: string, chatId: number, userId: number, bot: Telegraf, triggerStatus: string): Promise<void> {
  const client = getCoderClient(userId);
  if (!client) return; // user has no key configured, skip notification

  log.info('task notify sending', { taskId, chatId, userId, triggerStatus });

  try {
    const task = await client.getTask(taskId);
    const name = task.display_name || task.name;
    const prompt = task.initial_prompt
      ? `\n\n_${task.initial_prompt.slice(0, 200)}${task.initial_prompt.length > 200 ? '…' : ''}_`
      : '';

    await bot.telegram.sendMessage(
      chatId,
      `🤖 *AI Task Update*\n\n*${name}* — ${task.status}${prompt}`,
      { parse_mode: 'Markdown', ...taskMenuKeyboard(taskId) }
    );
    log.info('task notify sent', { taskId, userId, status: task.status });
  } catch (err) {
    log.error('task notify failed', { taskId, err: err instanceof Error ? err.message : String(err) });
    await bot.telegram.sendMessage(
      chatId,
      `Task \`${taskId.slice(0, 8)}\` completed, but failed to fetch details: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
