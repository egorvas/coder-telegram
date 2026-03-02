import type { Telegraf } from 'telegraf';
import { coderClient } from '../bot.js';
import { taskMenuKeyboard } from '../ui/keyboards.js';

export async function notifyTaskComplete(taskId: string, chatId: number, bot: Telegraf): Promise<void> {
  try {
    const task = await coderClient.getTask(taskId);
    const name = task.display_name || task.name;
    const prompt = task.initial_prompt
      ? `\n\n_${task.initial_prompt.slice(0, 200)}${task.initial_prompt.length > 200 ? '…' : ''}_`
      : '';

    await bot.telegram.sendMessage(
      chatId,
      `🤖 *AI Task Update*\n\n*${name}* — ${task.status}${prompt}`,
      { parse_mode: 'Markdown', ...taskMenuKeyboard(taskId, task.status) }
    );
  } catch (err) {
    await bot.telegram.sendMessage(
      chatId,
      `Task \`${taskId.slice(0, 8)}\` completed, but failed to fetch details: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
