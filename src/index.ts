import { bot, getCoderClient, setBotUsername, getBotUsername } from './bot.js';
import { config } from './config.js';
import { startCommand, keySetupMessage } from './commands/start.js';
import { tasksListCommand } from './commands/tasks/list.js';
import { taskCreateCommand } from './commands/tasks/create.js';
import { workspacesCommand } from './commands/workspaces.js';
import { templatesCommand } from './commands/templates/list.js';
import { taskSessions } from './store/task-sessions.js';
import { userStore } from './store/user-store.js';
import { mainMenuKeyboard } from './ui/keyboards.js';
import { startPoller } from './flows/task-poller.js';
import { uiState } from './ui/state.js';
import { registerMainMenuHandlers } from './ui/handlers/main-menu.js';
import { registerTaskDashboardHandlers } from './ui/handlers/task-dashboard.js';
import { registerWizardHandlers, handleWizardPromptInput, startWizard } from './ui/handlers/wizard.js';
import { registerWorkspaceMenuHandlers } from './ui/handlers/workspace-menu.js';
import { sanitizeText } from './utils/telegram.js';
import { registerTemplateBrowserHandlers } from './ui/handlers/template-browser.js';
import { registerAdminPanelHandlers, showAdminPanel } from './ui/handlers/admin-panel.js';
import { updateCard, sendCard } from './ui/task-card.js';
import { CoderClient } from './coder/client.js';
import { log } from './utils/logger.js';
import { handleCoderError } from './utils/coder-error.js';
import { isGroupChat, extractMentionText } from './utils/group-chat.js';
import { groupTaskStore } from './store/group-tasks.js';

// ─── Middleware: update logger ────────────────────────────────────────────────
bot.use((ctx, next) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    log.info('tg callback', { action: ctx.callbackQuery.data, userId, chatId });
  } else if (ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text;
    if (text.startsWith('/')) {
      log.info('tg command', { command: text.split(' ')[0], userId, chatId });
    } else {
      log.debug('tg text', { userId, chatId });
    }
  }
  return next();
});

// ─── Middleware: auth guard ───────────────────────────────────────────────────
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('You don\'t have access to this bot. Contact the administrator to be added.');
    return;
  }
  // In group chats, allow all members through
  if (isGroupChat(ctx.chat?.id ?? 0)) {
    return next();
  }
  // If admins are configured, enforce access control via user store
  if (config.adminUsers.size > 0 && !userStore.isAllowed(userId)) {
    await ctx.reply(`You don't have access to this bot. Ask the administrator to add your ID: \`${userId}\``, { parse_mode: 'Markdown' });
    return;
  }
  return next();
});

// ─── Middleware: clear pending text input on any button press ─────────────────
bot.use(async (ctx, next) => {
  if ('callbackQuery' in ctx.update && ctx.chat?.id) {
    const chatId = ctx.chat.id;
    uiState.clearPendingKeySetup(chatId);
    uiState.clearPendingAdminAdd(chatId);
  }
  return next();
});

// ─── Register UI handlers ─────────────────────────────────────────────────────
registerMainMenuHandlers(bot);
registerTaskDashboardHandlers(bot);
registerWizardHandlers(bot);
registerWorkspaceMenuHandlers(bot);
registerTemplateBrowserHandlers(bot);
registerAdminPanelHandlers(bot);

// ─── Commands ─────────────────────────────────────────────────────────────────
bot.command('start', startCommand);
bot.command('tasks', tasksListCommand);
bot.command('task_create', taskCreateCommand);
bot.command('workspaces', workspacesCommand);
bot.command('workspaces_create', (ctx) => startWizard(ctx, 'workspace'));
bot.command('templates', templatesCommand);
bot.command('resetkey', async (ctx) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!userId || !chatId) return;
  userStore.clearApiKey(userId);
  uiState.setPendingKeySetup(chatId);
  await ctx.reply(keySetupMessage(config.coderApiUrl), { parse_mode: 'Markdown' });
});

// ─── Group chat commands ──────────────────────────────────────────────────────
bot.command('set_task', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  if (!isGroupChat(chatId)) {
    await ctx.reply('This command works only in group chats.');
    return;
  }
  const args = ctx.message.text.split(/\s+/).slice(1);
  const taskId = args[0];
  if (!taskId) {
    await ctx.reply('Usage: /set\\_task `<taskId>`', { parse_mode: 'Markdown' });
    return;
  }
  const client = getCoderClient(userId);
  if (!client) {
    await ctx.reply('You need to configure your API key first. DM me /start.');
    return;
  }
  try {
    const task = await client.getTask(taskId);
    // Remove previous binding if any
    const prev = groupTaskStore.get(chatId);
    if (prev) {
      taskSessions.remove(prev.taskId, prev.ownerUserId);
    }
    // Bind task to this group
    groupTaskStore.set(chatId, taskId, userId);
    taskSessions.register(taskId, chatId, userId);
    taskSessions.updateStatus(taskId, userId, task.status, task.current_state?.state);
    const cardMsgId = await sendCard(bot, chatId, task);
    taskSessions.setCardMessageId(taskId, userId, cardMsgId);
    groupTaskStore.setCardMessageId(chatId, cardMsgId);
    log.info('group task set', { chatId, taskId, userId });
  } catch (err) {
    await handleCoderError(ctx, err, userId);
  }
});

bot.command('unset_task', async (ctx) => {
  const chatId = ctx.chat.id;
  if (!isGroupChat(chatId)) {
    await ctx.reply('This command works only in group chats.');
    return;
  }
  const binding = groupTaskStore.get(chatId);
  if (!binding) {
    await ctx.reply('No task is bound to this group.');
    return;
  }
  taskSessions.remove(binding.taskId, binding.ownerUserId);
  groupTaskStore.remove(chatId);
  await ctx.reply('Task unbound from this group.');
  log.info('group task unset', { chatId, taskId: binding.taskId });
});

bot.command('task_status', async (ctx) => {
  const chatId = ctx.chat.id;
  if (!isGroupChat(chatId)) return;
  const binding = groupTaskStore.get(chatId);
  if (!binding) {
    await ctx.reply('No task is bound to this group. Use /set\\_task `<taskId>`', { parse_mode: 'Markdown' });
    return;
  }
  const client = getCoderClient(binding.ownerUserId);
  if (!client) {
    await ctx.reply('Task owner\'s API key is no longer valid.');
    return;
  }
  try {
    const task = await client.getTask(binding.taskId);
    const presetName = taskSessions.getPresetName(binding.taskId, binding.ownerUserId);
    const lastPrompt = taskSessions.get(binding.taskId, binding.ownerUserId)?.lastPrompt;
    const cardMsgId = await sendCard(bot, chatId, task, { presetName, lastPrompt });
    taskSessions.setCardMessageId(binding.taskId, binding.ownerUserId, cardMsgId);
    groupTaskStore.setCardMessageId(chatId, cardMsgId);
  } catch (err) {
    await handleCoderError(ctx, err, binding.ownerUserId);
  }
});

// ─── Unified text handler ─────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const text = sanitizeText(ctx.message.text);

  // ─── Group chat routing ──────────────────────────────────────────────────
  if (isGroupChat(chatId)) {
    const binding = groupTaskStore.get(chatId);
    if (!binding) return; // no task bound → ignore

    const client = getCoderClient(binding.ownerUserId);
    if (!client) return;

    // Reply to task card/log → append prompt
    if (ctx.message.reply_to_message) {
      const repliedMsgId = ctx.message.reply_to_message.message_id;
      const match = groupTaskStore.findByReplyMessageId(chatId, repliedMsgId);
      if (match) {
        log.info('group task append via reply', { taskId: binding.taskId, fromUserId: userId });
        try {
          await client.appendTaskPrompt(binding.taskId, text);
          taskSessions.setLastPrompt(binding.taskId, binding.ownerUserId, text);
          const task = await client.getTask(binding.taskId);
          const cardMsgId = taskSessions.getCardMessageId(binding.taskId, binding.ownerUserId);
          if (cardMsgId) {
            await updateCard(bot, chatId, cardMsgId, task, { lastPrompt: text });
          }
        } catch (err) {
          await handleCoderError(ctx, err, binding.ownerUserId);
        }
        return;
      }
    }

    // @mention → append prompt
    const mentionText = extractMentionText(ctx.message.text, getBotUsername());
    if (mentionText) {
      const sanitized = sanitizeText(mentionText);
      log.info('group task append via mention', { taskId: binding.taskId, fromUserId: userId });
      try {
        await client.appendTaskPrompt(binding.taskId, sanitized);
        taskSessions.setLastPrompt(binding.taskId, binding.ownerUserId, sanitized);
        const task = await client.getTask(binding.taskId);
        const cardMsgId = taskSessions.getCardMessageId(binding.taskId, binding.ownerUserId);
        if (cardMsgId) {
          await updateCard(bot, chatId, cardMsgId, task, { lastPrompt: sanitized });
        }
      } catch (err) {
        await handleCoderError(ctx, err, binding.ownerUserId);
      }
      return;
    }

    // Regular message → ignore
    return;
  }

  // Priority 0: key setup flow
  if (uiState.isPendingKeySetup(chatId)) {
    uiState.clearPendingKeySetup(chatId);
    log.info('key setup attempt', { userId, chatId });
    try {
      const testClient = new CoderClient(config.coderApiUrl, text.trim());
      await testClient.validateKey();
      userStore.setApiKey(userId, text.trim());
      log.info('key setup success', { userId });
      await ctx.reply(
        `✅ API key saved! Welcome.\n\n` +
        `Don't forget to connect your GitHub account to check out repositories:\n` +
        `${config.coderApiUrl}/settings/external-auth`,
        { parse_mode: 'Markdown', ...mainMenuKeyboard(config.adminUsers.has(userId)) }
      );
    } catch {
      log.warn('key setup failed', { userId });
      uiState.setPendingKeySetup(chatId); // re-enter setup state
      await ctx.reply('❌ Invalid key — please check and try again.');
    }
    return;
  }

  // Priority 0.5: admin add-user flow
  if (uiState.isPendingAdminAdd(chatId) && config.adminUsers.has(userId)) {
    uiState.clearPendingAdminAdd(chatId);
    const newId = parseInt(text.trim(), 10);
    if (isNaN(newId)) {
      await ctx.reply('Invalid ID — please enter a numeric Telegram user ID.');
      uiState.setPendingAdminAdd(chatId);
      return;
    }
    log.info('admin add user', { byUserId: userId, newUserId: newId });
    userStore.addUser(newId);
    await ctx.reply(`User ${newId} added.`);
    await showAdminPanel(ctx);
    return;
  }

  // Priority 1: wizard step 3 — create task from entered prompt
  const wizard = uiState.getWizard(chatId);
  if (wizard?.step === 3) {
    await handleWizardPromptInput(ctx, text, wizard);
    return;
  }

  // Priority 2: reply to a task card or log message → append prompt
  if (ctx.message.reply_to_message) {
    const repliedMsgId = ctx.message.reply_to_message.message_id;
    const session = taskSessions.findByReplyMessageId(chatId, userId, repliedMsgId);
    if (session) {
      const client = getCoderClient(userId);
      if (!client) {
        await ctx.reply('You need to configure your API key first. Use /start.');
        return;
      }
      log.info('task append via reply', { taskId: session.taskId, userId });
      try {
        await client.appendTaskPrompt(session.taskId, text);
        taskSessions.setLastPrompt(session.taskId, userId, text);
        // Update the card to reflect the new prompt
        const task = await client.getTask(session.taskId);
        const cardMsgId = taskSessions.getCardMessageId(session.taskId, userId);
        if (cardMsgId) {
          await updateCard(bot, chatId, cardMsgId, task, {
            lastPrompt: text,
          });
        }
      } catch (err) {
        await handleCoderError(ctx, err, userId);
      }
      return;
    }
  }
});

// ─── Telegram command menu ────────────────────────────────────────────────────
await bot.telegram.setMyCommands([
  { command: 'start', description: 'Start / show main menu' },
  { command: 'resetkey', description: 'Reset your Coder API key' },
  { command: 'tasks', description: 'AI tasks dashboard' },
  { command: 'task_create', description: 'Create a new AI task' },
  { command: 'workspaces', description: 'Manage workspaces' },
  { command: 'workspaces_create', description: 'Create a new workspace' },
  { command: 'templates', description: 'Browse templates and presets' },
]);

// ─── Start ────────────────────────────────────────────────────────────────────
startPoller(bot, config.pollIntervalMs);
log.info('bot starting');
await bot.launch();
setBotUsername(bot.botInfo!.username);
log.info('bot running', { username: bot.botInfo!.username });
