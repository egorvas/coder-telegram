import type { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { userStore } from '../../store/user-store.js';
import { uiState } from '../state.js';
import { config } from '../../config.js';
import { mainMenuKeyboard } from '../keyboards.js';

export async function showAdminPanel(ctx: Context): Promise<void> {
  const users = userStore.listUsers();
  const viewMode = uiState.isGlobalView(ctx.from?.id ?? 0);

  const lines = users.length === 0
    ? ['No users registered.']
    : users.map((u) => `• ${u.userId} — ${u.hasKey ? 'key set' : 'no key'}`);

  const text = `*Admin Panel*\n\n${lines.join('\n')}\n\nView mode: ${viewMode ? '👁 All users' : '👤 Own scope'}`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Add User', 'admin:add'),
      Markup.button.callback('🗑 Remove User', 'admin:remove'),
    ],
    [Markup.button.callback(viewMode ? '👤 Switch to Own Scope' : '👁 Switch to All Users', 'admin:viewmode')],
    [Markup.button.callback('« Main Menu', 'menu:main')],
  ]);

  try {
    await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
  } catch {
    await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  }
}

export function registerAdminPanelHandlers(bot: Telegraf): void {
  // menu:admin → show admin panel (admin only)
  bot.action('menu:admin', async (ctx) => {
    await ctx.answerCbQuery();
    if (!config.adminUsers.has(ctx.from?.id ?? 0)) return;
    await showAdminPanel(ctx);
  });

  // admin:add → prompt for user ID
  bot.action('admin:add', async (ctx) => {
    await ctx.answerCbQuery();
    if (!config.adminUsers.has(ctx.from?.id ?? 0)) return;
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    uiState.setPendingAdminAdd(chatId);
    await ctx.reply('Enter the Telegram user ID to add:');
  });

  // admin:remove → show list of users as removal buttons
  bot.action('admin:remove', async (ctx) => {
    await ctx.answerCbQuery();
    if (!config.adminUsers.has(ctx.from?.id ?? 0)) return;
    const users = userStore.listUsers();
    if (users.length === 0) {
      await ctx.reply('No users to remove.');
      return;
    }
    const buttons = users.map((u) => [
      Markup.button.callback(`${u.userId}`, `admin:remove:${u.userId}`),
    ]);
    buttons.push([Markup.button.callback('« Back', 'menu:admin')]);
    await ctx.reply('Select a user to remove:', Markup.inlineKeyboard(buttons));
  });

  // admin:remove:<id> → show confirmation
  bot.action(/^admin:remove:confirm:(.+)$/, async (ctx) => {
    const targetId = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery();
    if (!config.adminUsers.has(ctx.from?.id ?? 0)) return;
    userStore.removeUser(targetId);
    await ctx.reply(`User ${targetId} removed.`);
    await showAdminPanel(ctx);
  });

  bot.action(/^admin:remove:cancel:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await showAdminPanel(ctx);
  });

  bot.action(/^admin:remove:(\d+)$/, async (ctx) => {
    const targetId = ctx.match[1];
    await ctx.answerCbQuery();
    if (!config.adminUsers.has(ctx.from?.id ?? 0)) return;
    await ctx.reply(
      `Remove user ${targetId}? They will lose access immediately.`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Yes', `admin:remove:confirm:${targetId}`),
          Markup.button.callback('❌ No', `admin:remove:cancel:${targetId}`),
        ],
      ])
    );
  });

  // admin:viewmode → toggle global/own view
  bot.action('admin:viewmode', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id ?? 0;
    if (!config.adminUsers.has(userId)) return;
    const current = uiState.isGlobalView(userId);
    uiState.setGlobalView(userId, !current);
    await showAdminPanel(ctx);
  });

  // admin:back → return to main menu
  bot.action('admin:back', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from?.id ?? 0;
    const keyboard = mainMenuKeyboard(config.adminUsers.has(userId));
    try {
      await ctx.editMessageText('*Coder Bot* — choose a section:', { parse_mode: 'Markdown', ...keyboard });
    } catch {
      await ctx.reply('*Coder Bot* — choose a section:', { parse_mode: 'Markdown', ...keyboard });
    }
  });
}
