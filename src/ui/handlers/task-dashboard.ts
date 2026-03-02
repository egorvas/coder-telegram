import type { Telegraf, Context } from 'telegraf';
import { coderClient } from '../../bot.js';
import { buildLogMessage } from '../../utils/telegram.js';
import { taskListKeyboard, taskMenuKeyboard, confirmKeyboard } from '../keyboards.js';
import { taskSessions } from '../../store/task-sessions.js';
import { uiState } from '../state.js';
import type { CoderTask } from '../../coder/types.js';
import { startWizard } from './wizard.js';

interface TaskWithWorkspace {
  task: CoderTask;
  workspaceName: string;
}

async function fetchAllTasks(): Promise<TaskWithWorkspace[]> {
  const tasks = await coderClient.listTasks();
  return tasks
    .slice(0, 10)
    .map((task) => ({ task, workspaceName: task.workspace_name }));
}

export async function showTaskDashboard(ctx: Context): Promise<void> {
  try {
    const items = await fetchAllTasks();
    const tasks = items.map((i) => i.task);
    const keyboard = taskListKeyboard(tasks);

    const text = tasks.length === 0
      ? 'No active tasks found.'
      : `*AI Tasks* (${tasks.length}):`;

    try {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  } catch (err) {
    await ctx.reply(`Error loading tasks: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function registerTaskDashboardHandlers(bot: Telegraf): void {
  // dashboard:refresh → re-fetch task list
  bot.action('dashboard:refresh', async (ctx) => {
    await ctx.answerCbQuery('Refreshing...');
    await showTaskDashboard(ctx);
  });

  // dashboard:new → start task creation wizard
  bot.action('dashboard:new', async (ctx) => {
    await ctx.answerCbQuery();
    await startWizard(ctx, 'task');
  });

  // dashboard:back → return to task list
  bot.action('dashboard:back', async (ctx) => {
    await ctx.answerCbQuery();
    await showTaskDashboard(ctx);
  });

  // task:select:<id> → show task submenu
  bot.action(/^task:select:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    try {
      const task = await coderClient.getTask(taskId);
      const name = task.display_name || task.name;
      const prompt = task.initial_prompt
        ? `\n\n_${task.initial_prompt.slice(0, 200)}${task.initial_prompt.length > 200 ? '…' : ''}_`
        : '';
      await ctx.editMessageText(
        `*${name}*\nStatus: ${task.status}${prompt}`,
        { parse_mode: 'Markdown', ...taskMenuKeyboard(taskId) }
      );
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // task:logs:<id> → fetch and send logs
  bot.action(/^task:logs:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    try {
      const [task, logs] = await Promise.all([
        coderClient.getTask(taskId),
        coderClient.getTaskLogs(taskId),
      ]);
      await ctx.reply(
        buildLogMessage(taskId, task.status, logs),
        { parse_mode: 'Markdown', ...taskMenuKeyboard(taskId) }
      );
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // task:delete:confirm:<id> → confirmed: delete and return to list
  bot.action(/^task:delete:confirm:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    try {
      await coderClient.deleteTask(taskId);
      taskSessions.remove(taskId);
      await ctx.reply(`Task \`${taskId.slice(0, 8)}\` deleted.`, { parse_mode: 'Markdown' });
      await showTaskDashboard(ctx);
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // task:delete:cancel:<id> → cancelled: show task menu
  bot.action(/^task:delete:cancel:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply('Deletion cancelled.', taskMenuKeyboard(taskId));
  });

  // task:delete:<id> → show confirmation prompt
  bot.action(/^task:delete:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    try {
      const task = await coderClient.getTask(taskId);
      const name = task.display_name || task.name;
      await ctx.reply(
        `Delete task *${name}*? This cannot be undone.`,
        { parse_mode: 'Markdown', ...confirmKeyboard(`task:delete:confirm:${taskId}`, `task:delete:cancel:${taskId}`) }
      );
    } catch (err) {
      await ctx.reply(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // task:append:<id> → set pending append, ask for prompt
  bot.action(/^task:append:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();
    uiState.setPendingAppend(chatId, taskId);
    await ctx.reply(
      `What do you want to add to task \`${taskId.slice(0, 8)}\`?`,
      { parse_mode: 'Markdown' }
    );
  });
}
