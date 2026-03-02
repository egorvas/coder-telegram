import type { Telegraf, Context } from 'telegraf';
import { coderClient } from '../../bot.js';
import { workspaceListKeyboard, workspaceActionKeyboard, confirmKeyboard } from '../keyboards.js';
import { startWizard } from './wizard.js';

export async function showWorkspaceList(ctx: Context): Promise<void> {
  try {
    const workspaces = await coderClient.listWorkspaces();
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
    try {
      const workspaces = await coderClient.listWorkspaces();
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

  // ws:start:<name> → start workspace, show updated action menu
  bot.action(/^ws:start:(.+)$/, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCbQuery('Starting...');
    try {
      await coderClient.startWorkspace(name);
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
    try {
      await coderClient.stopWorkspace(name);
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
    try {
      const workspaces = await coderClient.listWorkspaces();
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
