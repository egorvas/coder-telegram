import type { Context } from 'telegraf';
import { showTemplateList } from '../../ui/handlers/template-browser.js';

export async function templatesCommand(ctx: Context): Promise<void> {
  await showTemplateList(ctx);
}
