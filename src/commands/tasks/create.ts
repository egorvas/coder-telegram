import type { Context } from 'telegraf';
import { getCoderClient } from '../../bot.js';
import { taskSessions } from '../../store/task-sessions.js';
import { startWizard } from '../../ui/handlers/wizard.js';

export async function taskCreateCommand(ctx: Context): Promise<void> {
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const parts = text.trim().split(/\s+/);
  const templateName = parts[1];
  const prompt = parts.slice(2).join(' ');

  // No args → launch interactive wizard
  if (!templateName) {
    await startWizard(ctx);
    return;
  }

  // With args → create directly
  if (!prompt) {
    await startWizard(ctx);
    return;
  }

  const userId = ctx.from?.id;
  if (!userId) return;
  const coderClient = getCoderClient(userId);
  if (!coderClient) {
    await ctx.reply('You need to configure your API key first. Use /start.');
    return;
  }

  try {
    const templates = await coderClient.listTemplates();
    const tpl = templates.find((t: { name: string }) => t.name === templateName);
    if (!tpl) {
      await ctx.reply(`Template "${templateName}" not found. Use /templates to see available templates.`);
      return;
    }

    await ctx.reply(`Creating AI task from *${templateName}*...`, { parse_mode: 'Markdown' });
    const task = await coderClient.createTask(tpl.active_version_id, null, prompt);

    if (ctx.chat) {
      const userId = ctx.from?.id ?? ctx.chat.id;
      taskSessions.register(task.id, ctx.chat.id, userId);
    }

    await ctx.reply(
      `Task created!\nID: \`${task.id}\`\nStatus: ${task.status}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
