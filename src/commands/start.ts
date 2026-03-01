import type { Context } from 'telegraf';
import { mainMenuKeyboard } from '../ui/keyboards.js';

const WELCOME = `Welcome to *Coder Bot*!

Use the menu below to navigate, or use text commands directly:

*Workspaces*: /workspaces · /start\\_ws · /stop\\_ws
*AI Tasks*: /tasks · /task\\_create · /task\\_logs · /task\\_append · /task\\_delete
*Discovery*: /templates · /presets`;

export async function startCommand(ctx: Context): Promise<void> {
  await ctx.reply(WELCOME, { parse_mode: 'Markdown', ...mainMenuKeyboard() });
}
