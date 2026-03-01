import type { Context } from 'telegraf';
import { showWorkspaceList } from '../ui/handlers/workspace-menu.js';

export async function workspacesCommand(ctx: Context): Promise<void> {
  await showWorkspaceList(ctx);
}
