import type { Context } from 'telegraf';
import { showTaskDashboard } from '../../ui/handlers/task-dashboard.js';

export async function tasksListCommand(ctx: Context): Promise<void> {
  await showTaskDashboard(ctx);
}
