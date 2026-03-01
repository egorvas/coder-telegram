import type { Telegraf } from 'telegraf';
import { coderClient } from '../bot.js';
import { taskSessions } from '../store/task-sessions.js';
import { taskMenuKeyboard } from '../ui/keyboards.js';

export interface WebhookMeta {
  title: string;
  body: string;
}

export async function notifyTaskComplete(taskId: string, bot: Telegraf, meta?: WebhookMeta): Promise<void> {
  const session = taskSessions.get(taskId);
  if (!session) {
    console.warn(`notifyTaskComplete: no session for task ${taskId}`);
    return;
  }

  const { chatId } = session;

  try {
    const task = await coderClient.getTask(taskId);
    const name = task.display_name || task.name;
    const prompt = task.initial_prompt
      ? `\n\n_${task.initial_prompt.slice(0, 200)}${task.initial_prompt.length > 200 ? '…' : ''}_`
      : '';

    const header = meta?.title
      ? `🤖 *${meta.title}*${meta.body ? `\n${meta.body}` : ''}\n\n`
      : '🤖 *AI Task Update*\n\n';

    await bot.telegram.sendMessage(
      chatId,
      `${header}*${name}* — ${task.status}${prompt}`,
      { parse_mode: 'Markdown', ...taskMenuKeyboard(taskId) }
    );
  } catch (err) {
    await bot.telegram.sendMessage(
      chatId,
      `Task \`${taskId.slice(0, 8)}\` completed, but failed to fetch details: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
