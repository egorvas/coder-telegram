import type { Telegraf, Context } from 'telegraf';
import { mainMenuKeyboard } from '../keyboards.js';
import { showTaskDashboard } from './task-dashboard.js';
import { showWorkspaceList } from './workspace-menu.js';
import { showTemplateList } from './template-browser.js';
import { config } from '../../config.js';

const MENU_TEXT = `*Coder Bot* — choose a section:`;

export function isAdmin(ctx: Context): boolean {
  return config.adminUsers.has(ctx.from?.id ?? 0);
}

export async function showMainMenu(ctx: Context): Promise<void> {
  const keyboard = mainMenuKeyboard(isAdmin(ctx));
  try {
    await ctx.editMessageText(MENU_TEXT, { parse_mode: 'Markdown', ...keyboard });
  } catch {
    await ctx.reply(MENU_TEXT, { parse_mode: 'Markdown', ...keyboard });
  }
}

export function registerMainMenuHandlers(bot: Telegraf): void {
  // menu:tasks → show task dashboard
  bot.action('menu:tasks', async (ctx) => {
    await ctx.answerCbQuery();
    await showTaskDashboard(ctx);
  });

  // menu:workspaces → show workspace list
  bot.action('menu:workspaces', async (ctx) => {
    await ctx.answerCbQuery();
    await showWorkspaceList(ctx);
  });

  // menu:templates → show template list
  bot.action('menu:templates', async (ctx) => {
    await ctx.answerCbQuery();
    await showTemplateList(ctx);
  });

  // menu:main → back to main menu (edit in place)
  bot.action('menu:main', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });
}
