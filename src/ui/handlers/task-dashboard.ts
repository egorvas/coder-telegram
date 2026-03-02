import type { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { getCoderClient } from '../../bot.js';
import { buildLogMessage } from '../../utils/telegram.js';
import { taskListKeyboard, taskMenuKeyboard, modelKeyboard, confirmKeyboard } from '../keyboards.js';
import { taskSessions } from '../../store/task-sessions.js';
import { uiState } from '../state.js';
import { userStore } from '../../store/user-store.js';
import type { CoderTask } from '../../coder/types.js';
import { startWizard } from './wizard.js';
import { log } from '../../utils/logger.js';
import { handleCoderError, CoderAuthError } from '../../utils/coder-error.js';

interface TaskWithWorkspace {
  task: CoderTask;
  workspaceName: string;
}

function clientOrReply(ctx: Context): ReturnType<typeof getCoderClient> {
  const userId = ctx.from?.id;
  if (!userId) return null;
  const client = getCoderClient(userId);
  if (!client) {
    void ctx.reply('You need to configure your API key first. Use /start.');
  }
  return client;
}

async function fetchAllTasks(ctx: Context): Promise<TaskWithWorkspace[] | null> {
  const client = clientOrReply(ctx);
  if (!client) return null;
  const tasks = await client.listTasks();
  return tasks
    .slice(0, 10)
    .map((task) => ({ task, workspaceName: task.workspace_name }));
}

export async function showTaskDashboard(ctx: Context): Promise<void> {
  const userId = ctx.from?.id ?? 0;

  if (uiState.isGlobalView(userId)) {
    try {
      const usersWithKeys = userStore.listUsers().filter((u) => u.hasKey);
      const results = await Promise.allSettled(
        usersWithKeys.map(async (u) => {
          const c = getCoderClient(u.userId);
          if (!c) return { ownerId: u.userId, tasks: [] as CoderTask[] };
          const tasks = await c.listTasks();
          return { ownerId: u.userId, tasks };
        })
      );

      const allItems: Array<{ task: CoderTask; ownerId: number }> = [];
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled') {
          for (const task of r.value.tasks) {
            allItems.push({ task, ownerId: r.value.ownerId });
          }
        } else {
          if (r.reason instanceof CoderAuthError) {
            log.warn('coder auth expired, clearing key', { userId: usersWithKeys[i].userId });
            userStore.clearApiKey(usersWithKeys[i].userId);
          } else {
            log.warn('failed to fetch tasks', { userId: usersWithKeys[i].userId, err: String(r.reason) });
          }
        }
      }

      const lines = allItems.slice(0, 20).map(
        ({ task, ownerId }) => `• \`[${ownerId}]\` ${task.display_name || task.name} — ${task.status}`
      );
      const text = allItems.length === 0
        ? '_No tasks found across all users._'
        : `*AI Tasks — All Users* (${allItems.length}):\n\n${lines.join('\n')}`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh', 'dashboard:refresh')],
        [Markup.button.callback('« Main Menu', 'menu:main')],
      ]);

      try {
        await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      } catch {
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (err) {
      await ctx.reply(`Error loading tasks: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

  try {
    const items = await fetchAllTasks(ctx);
    if (items === null) return;
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
    await handleCoderError(ctx, err, ctx.from?.id ?? 0);
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
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const task = await client.getTask(taskId);
      const name = task.display_name || task.name;
      const prompt = task.initial_prompt
        ? `\n\n_${task.initial_prompt.slice(0, 200)}${task.initial_prompt.length > 200 ? '…' : ''}_`
        : '';
      await ctx.editMessageText(
        `*${name}*\nStatus: ${task.status}${prompt}`,
        { parse_mode: 'Markdown', ...taskMenuKeyboard(taskId) }
      );
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:logs:<id> → fetch and send logs
  bot.action(/^task:logs:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const [task, logs] = await Promise.all([
        client.getTask(taskId),
        client.getTaskLogs(taskId),
      ]);
      await ctx.reply(
        buildLogMessage(taskId, task.status, logs),
        { parse_mode: 'Markdown', ...taskMenuKeyboard(taskId) }
      );
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:delete:confirm:<id> → confirmed: delete and return to list
  bot.action(/^task:delete:confirm:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const userId = ctx.from?.id ?? ctx.chat?.id ?? 0;
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      await client.deleteTask(taskId);
      taskSessions.remove(taskId, userId);
      await ctx.reply(`Task \`${taskId.slice(0, 8)}\` deleted.`, { parse_mode: 'Markdown' });
      await showTaskDashboard(ctx);
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
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
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const task = await client.getTask(taskId);
      const name = task.display_name || task.name;
      await ctx.reply(
        `Delete task *${name}*? This cannot be undone.`,
        { parse_mode: 'Markdown', ...confirmKeyboard(`task:delete:confirm:${taskId}`, `task:delete:cancel:${taskId}`) }
      );
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:fulllog:<id> → send complete log as a .txt document
  bot.action(/^task:fulllog:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const [task, logs] = await Promise.all([
        client.getTask(taskId),
        client.getTaskLogs(taskId),
      ]);
      if (!logs) {
        await ctx.reply('No logs yet.');
        return;
      }
      await ctx.replyWithDocument(
        { source: Buffer.from(logs), filename: `${taskId.slice(0, 8)}-log.txt` },
        { caption: `Task \`${taskId.slice(0, 8)}\` — ${task.status}`, parse_mode: 'Markdown', ...taskMenuKeyboard(taskId) }
      );
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:model:<id> → show model selection keyboard
  bot.action(/^task:model:([^:]+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(modelKeyboard(taskId).reply_markup);
  });

  // task:model:set:<id>:<model> → send /model <model> as append
  bot.action(/^task:model:set:([^:]+):(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const model = ctx.match[2];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      await client.appendTaskPrompt(taskId, `/model ${model}`);
      await ctx.editMessageReplyMarkup(taskMenuKeyboard(taskId).reply_markup);
      await ctx.reply(
        `Model set to \`${model}\` for task \`${taskId.slice(0, 8)}\`.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
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
