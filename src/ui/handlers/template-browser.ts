import type { Telegraf, Context } from 'telegraf';
import { getCoderClient } from '../../bot.js';
import { templateListKeyboard, presetListKeyboard } from '../keyboards.js';

function clientOrReply(ctx: Context): ReturnType<typeof getCoderClient> {
  const userId = ctx.from?.id;
  if (!userId) return null;
  const client = getCoderClient(userId);
  if (!client) {
    void ctx.reply('You need to configure your API key first. Use /start.');
  }
  return client;
}

export async function showTemplateList(ctx: Context): Promise<void> {
  const client = clientOrReply(ctx);
  if (!client) return;
  try {
    const templates = await client.listTemplates();
    const keyboard = templateListKeyboard(templates);
    const text =
      templates.length > 0
        ? `*Templates* (${templates.length}${templates.length > 20 ? ', showing 20' : ''}):`
        : 'No templates found.';

    try {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function registerTemplateBrowserHandlers(bot: Telegraf): void {
  // tpl:select:<name> → fetch and show presets (read-only)
  bot.action(/^tpl:select:(.+)$/, async (ctx) => {
    const templateName = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const templates = await client.listTemplates();
      const tpl = templates.find((t) => t.name === templateName);
      if (!tpl) {
        await ctx.reply(`Template "${templateName}" not found.`);
        return;
      }
      const presets = await client.getTemplatePresets(tpl.active_version_id);
      const keyboard = presetListKeyboard(presets, templateName);

      if (presets.length === 0) {
        await ctx.editMessageText(
          `*${templateName}* — No presets defined.`,
          { parse_mode: 'Markdown', ...keyboard }
        );
        return;
      }

      const lines = presets.map((p) => `• \`${p.Name}\`${p.Description ? ` — ${p.Description}` : ''}${p.Default ? ' ✓' : ''}`);
      await ctx.editMessageText(
        `*${templateName}* presets:\n\n${lines.join('\n')}`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // tpl:refresh → reload template list
  bot.action('tpl:refresh', async (ctx) => {
    await ctx.answerCbQuery('Refreshing...');
    await showTemplateList(ctx);
  });

  // tpl:preset:noop → no-op (preset buttons in browser are display-only)
  bot.action('tpl:preset:noop', async (ctx) => {
    await ctx.answerCbQuery();
  });
}
