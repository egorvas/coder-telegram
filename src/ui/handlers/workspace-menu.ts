import type { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { getCoderClient } from '../../bot.js';
import { workspaceListKeyboard, workspaceActionKeyboard, confirmKeyboard } from '../keyboards.js';
import { startWizard } from './wizard.js';
import { uiState } from '../state.js';
import { userStore } from '../../store/user-store.js';
import { log } from '../../utils/logger.js';

function clientOrReply(ctx: Context): ReturnType<typeof getCoderClient> {
  const userId = ctx.from?.id;
  if (!userId) return null;
  const client = getCoderClient(userId);
  if (!client) {
    void ctx.reply('You need to configure your API key first. Use /start.');
  }
  return client;
}

export async function showWorkspaceList(ctx: Context): Promise<void> {
  const userId = ctx.from?.id ?? 0;

  if (uiState.isGlobalView(userId)) {
    try {
      const usersWithKeys = userStore.listUsers().filter((u) => u.hasKey);
      const results = await Promise.allSettled(
        usersWithKeys.map(async (u) => {
          const c = getCoderClient(u.userId);
          if (!c) return [];
          return c.listWorkspaces();
        })
      );

      const lines: string[] = [];
      let total = 0;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled') {
          for (const ws of r.value) {
            lines.push(`• \`[${ws.owner_name}]\` ${ws.name} — ${ws.latest_build.status}`);
            total++;
          }
        } else {
          log.warn('failed to fetch workspaces', { userId: usersWithKeys[i].userId, err: String(r.reason) });
        }
      }

      const text = total === 0
        ? '_No workspaces found across all users._'
        : `*Workspaces — All Users* (${total}):\n\n${lines.join('\n')}`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh', 'ws:refresh')],
        [Markup.button.callback('« Main Menu', 'menu:main')],
      ]);

      try {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } catch {
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

  const client = clientOrReply(ctx);
  if (!client) return;
  try {
    const workspaces = await client.listWorkspaces();
    const keyboard = workspaceListKeyboard(workspaces);

    if (workspaces.length === 0) {
      try {
        await ctx.editMessageText('No workspaces found.', keyboard);
      } catch {
        await ctx.reply('No workspaces found.', keyboard);
      }
      return;
    }

    const text = `*Workspaces* (${workspaces.length}):`;
    try {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function registerWorkspaceMenuHandlers(bot: Telegraf): void {
  // ws:select:<name> → show action menu
  bot.action(/^ws:select:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const workspaces = await client.listWorkspaces();
      const ws = workspaces.find((w) => w.name === name);
      if (!ws) {
        await ctx.reply(`Workspace not found: ${name}`);
        return;
      }
      await ctx.editMessageText(
        `*${ws.name}* — ${ws.latest_build.status}`,
        { parse_mode: 'Markdown', ...workspaceActionKeyboard(ws) }
      );
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // ws:start:<name> → start workspace
  bot.action(/^ws:start:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery('Starting...');
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      await client.startWorkspace(name);
      await ctx.reply(`Workspace *${name}* start initiated.`, { parse_mode: 'Markdown' });
      await showWorkspaceList(ctx);
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // ws:stop:confirm:<name> → confirmed: stop workspace
  bot.action(/^ws:stop:confirm:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery('Stopping...');
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      await client.stopWorkspace(name);
      await ctx.reply(`Workspace *${name}* stop initiated.`, { parse_mode: 'Markdown' });
      await showWorkspaceList(ctx);
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // ws:stop:cancel:<name> → cancelled: show workspace action menu
  bot.action(/^ws:stop:cancel:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const workspaces = await client.listWorkspaces();
      const ws = workspaces.find((w) => w.name === name);
      if (ws) {
        await ctx.reply(`Workspace *${name}*`, { parse_mode: 'Markdown', ...workspaceActionKeyboard(ws) });
      } else {
        await showWorkspaceList(ctx);
      }
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // ws:stop:<name> → show confirmation prompt
  bot.action(/^ws:stop:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply(
      `Stop workspace *${name}*?`,
      { parse_mode: 'Markdown', ...confirmKeyboard(`ws:stop:confirm:${name}`, `ws:stop:cancel:${name}`) }
    );
  });

  // ws:delete:confirm:<name> → confirmed: delete workspace
  bot.action(/^ws:delete:confirm:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery('Deleting...');
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      await client.deleteWorkspace(name);
      await ctx.reply(`Workspace *${name}* deletion initiated.`, { parse_mode: 'Markdown' });
      await showWorkspaceList(ctx);
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // ws:delete:cancel:<name> → cancelled: show workspace action menu
  bot.action(/^ws:delete:cancel:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const workspaces = await client.listWorkspaces();
      const ws = workspaces.find((w) => w.name === name);
      if (ws) {
        await ctx.reply(`Workspace *${name}*`, { parse_mode: 'Markdown', ...workspaceActionKeyboard(ws) });
      } else {
        await showWorkspaceList(ctx);
      }
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // ws:delete:<name> → show confirmation prompt
  bot.action(/^ws:delete:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply(
      `Delete workspace *${name}*? This cannot be undone.`,
      { parse_mode: 'Markdown', ...confirmKeyboard(`ws:delete:confirm:${name}`, `ws:delete:cancel:${name}`) }
    );
  });

  // ws:refresh → reload workspace list
  bot.action('ws:refresh', async (ctx) => {
    await ctx.answerCbQuery('Refreshing...');
    await showWorkspaceList(ctx);
  });

  // ws:new → start workspace creation wizard
  bot.action('ws:new', async (ctx) => {
    await ctx.answerCbQuery();
    await startWizard(ctx, 'workspace');
  });

  // ws:back → return to workspace list
  bot.action('ws:back', async (ctx) => {
    await ctx.answerCbQuery();
    await showWorkspaceList(ctx);
  });
}
