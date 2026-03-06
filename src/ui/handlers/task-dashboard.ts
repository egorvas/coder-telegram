import type { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import { bot, getCoderClient } from '../../bot.js';
import { taskListKeyboard, taskCardKeyboard, modelKeyboard, confirmKeyboard } from '../keyboards.js';
import { taskSessions } from '../../store/task-sessions.js';
import { uiState } from '../state.js';
import { userStore } from '../../store/user-store.js';
import type { CoderTask } from '../../coder/types.js';
import { startWizard } from './wizard.js';
import { sendCard, updateCard, buildCardText } from '../task-card.js';
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

export function registerTaskDashboardHandlers(botInstance: Telegraf): void {
  // dashboard:refresh → re-fetch task list
  botInstance.action('dashboard:refresh', async (ctx) => {
    await ctx.answerCbQuery('Refreshing…');
    await showTaskDashboard(ctx);
  });

  // dashboard:new → start task creation wizard
  botInstance.action('dashboard:new', async (ctx) => {
    await ctx.answerCbQuery();
    await startWizard(ctx, 'task');
  });

  // dashboard:back → return to task list
  botInstance.action('dashboard:back', async (ctx) => {
    await ctx.answerCbQuery();
    await showTaskDashboard(ctx);
  });

  // task:select:<id> → re-create full card with log inside
  botInstance.action(/^task:select:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const userId = ctx.from?.id ?? 0;
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const task = await client.getTask(taskId);
      const agentState = task.current_state?.state;
      const snippet = task.current_state?.message;

      const session = taskSessions.get(taskId, userId);
      // Delete old card if exists
      if (session?.cardMessageId) {
        try {
          await bot.telegram.deleteMessage(chatId, session.cardMessageId);
        } catch { /* already gone */ }
      }

      taskSessions.register(task.id, chatId, userId);
      const presetName = taskSessions.getPresetName(taskId, userId);
      const msgId = await sendCard(bot, chatId, task, {
        lastPrompt: session?.lastPrompt,
        statusSnippet: snippet,
        presetName,
      });
      taskSessions.setCardMessageId(task.id, userId, msgId);
      taskSessions.updateStatus(task.id, userId, task.status, agentState);
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:delete:confirm:<id> → confirmed: delete task, show toast, remove message
  botInstance.action(/^task:delete:confirm:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const userId = ctx.from?.id ?? ctx.chat?.id ?? 0;
    const chatId = ctx.chat?.id;
    await ctx.answerCbQuery(`Task ${taskId.slice(0, 8)} deleted`);
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      await client.deleteTask(taskId);
      taskSessions.remove(taskId, userId);
      if (chatId) {
        const msgId = (ctx.callbackQuery as { message?: { message_id: number } })?.message?.message_id;
        if (msgId) {
          try { await bot.telegram.deleteMessage(chatId, msgId); } catch { /* already gone */ }
        }
      }
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:delete:cancel:<id> → restore card keyboard
  botInstance.action(/^task:delete:cancel:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const userId = ctx.from?.id ?? 0;
    await ctx.answerCbQuery('Cancelled');
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const task = await client.getTask(taskId);
      const session = taskSessions.get(taskId, userId);
      const presetName = taskSessions.getPresetName(taskId, userId);
      const cardText = buildCardText(task, {
        lastPrompt: session?.lastPrompt,
        statusSnippet: task.current_state?.message,
        presetName,
      });
      const keyboard = taskCardKeyboard(taskId, task.current_state?.state);
      await ctx.editMessageText(cardText, { parse_mode: 'Markdown', ...keyboard });
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:delete:<id> → replace card with confirmation prompt
  botInstance.action(/^task:delete:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const task = await client.getTask(taskId);
      const name = task.display_name || task.name;
      await ctx.editMessageText(
        `Delete task *${name}*? This cannot be undone.`,
        { parse_mode: 'Markdown', ...confirmKeyboard(`task:delete:confirm:${taskId}`, `task:delete:cancel:${taskId}`) }
      );
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:fulllog:<id> → send complete log as a .txt document
  botInstance.action(/^task:fulllog:(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      const logs = await client.getTaskLogs(taskId);
      if (!logs) {
        await ctx.reply('No logs yet.');
        return;
      }
      await ctx.replyWithDocument(
        { source: Buffer.from(logs), filename: `${taskId.slice(0, 8)}-log.txt` },
      );
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // task:model:<id> → show model selection keyboard
  botInstance.action(/^task:model:([^:]+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(modelKeyboard(taskId).reply_markup);
  });

  // task:model:set:<id>:<model> → send /model <model> as append
  botInstance.action(/^task:model:set:([^:]+):(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const model = ctx.match[2];
    await ctx.answerCbQuery(`Model set to ${model}`);
    const client = clientOrReply(ctx);
    if (!client) return;
    try {
      await client.appendTaskPrompt(taskId, `/model ${model}`);
      taskSessions.setLastPrompt(taskId, ctx.from?.id ?? 0, `/model ${model}`);
      const agentState = taskSessions.getAgentState(taskId, ctx.from?.id ?? 0);
      await ctx.editMessageReplyMarkup(taskCardKeyboard(taskId, agentState).reply_markup);
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });
}
