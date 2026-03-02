import { bot, getCoderClient } from './bot.js';
import { config } from './config.js';
import { startCommand, keySetupMessage } from './commands/start.js';
import { tasksListCommand } from './commands/tasks/list.js';
import { taskCreateCommand } from './commands/tasks/create.js';
import { workspacesCommand } from './commands/workspaces.js';
import { templatesCommand } from './commands/templates/list.js';
import { taskSessions } from './store/task-sessions.js';
import { userStore } from './store/user-store.js';
import { taskMenuKeyboard, mainMenuKeyboard } from './ui/keyboards.js';
import { startPoller } from './flows/task-poller.js';
import { uiState } from './ui/state.js';
import { registerMainMenuHandlers } from './ui/handlers/main-menu.js';
import { registerTaskDashboardHandlers } from './ui/handlers/task-dashboard.js';
import { registerWizardHandlers, handleWizardPromptInput, startWizard } from './ui/handlers/wizard.js';
import { registerWorkspaceMenuHandlers } from './ui/handlers/workspace-menu.js';
import { sanitizeText } from './utils/telegram.js';
import { registerTemplateBrowserHandlers } from './ui/handlers/template-browser.js';
import { registerAdminPanelHandlers, showAdminPanel } from './ui/handlers/admin-panel.js';
import { CoderClient } from './coder/client.js';
import { log } from './utils/logger.js';
import { handleCoderError } from './utils/coder-error.js';

// ─── Middleware: update logger ────────────────────────────────────────────────
bot.use((ctx, next) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    log.debug('tg callback', { action: ctx.callbackQuery.data, userId, chatId });
  } else if (ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text;
    if (text.startsWith('/')) {
      log.debug('tg command', { command: text.split(' ')[0], userId, chatId });
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
  // If allowlist is configured, enforce it
  if (config.allowedUsers.size > 0 && !userStore.isAllowed(userId)) {
    await ctx.reply('You don\'t have access to this bot. Contact the administrator to be added.');
    return;
  }
  return next();
});

// ─── Middleware: clear pending text input on any button press ─────────────────
bot.use(async (ctx, next) => {
  if ('callbackQuery' in ctx.update && ctx.chat?.id) {
    const chatId = ctx.chat.id;
    uiState.clearPendingAppend(chatId);
    uiState.clearPendingKeySetup(chatId);
    uiState.clearPendingAdminAdd(chatId);
    taskSessions.clearPendingAppend(chatId);
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

// ─── Unified text handler ─────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const text = sanitizeText(ctx.message.text);

  if (text.startsWith('/')) return;

  // Priority 0: key setup flow
  if (uiState.isPendingKeySetup(chatId)) {
    uiState.clearPendingKeySetup(chatId);
    try {
      const testClient = new CoderClient(config.coderApiUrl, text.trim());
      await testClient.validateKey();
      userStore.setApiKey(userId, text.trim());
      await ctx.reply('✅ API key saved! Welcome.', {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard(config.adminUsers.has(userId)),
      });
    } catch {
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

  // Priority 2: uiState pending append (from task dashboard Append button)
  const uiPending = uiState.getPendingAppend(chatId);
  if (uiPending) {
    uiState.clearPendingAppend(chatId);
    const client = getCoderClient(userId);
    if (!client) {
      await ctx.reply('You need to configure your API key first. Use /start.');
      return;
    }
    try {
      await client.appendTaskPrompt(uiPending.taskId, text);
      await ctx.reply(
        `Prompt appended to task \`${uiPending.taskId.slice(0, 8)}\`.`,
        { parse_mode: 'Markdown', ...taskMenuKeyboard(uiPending.taskId) }
      );
    } catch (err) {
      await handleCoderError(ctx, err, userId);
    }
    return;
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
log.info('bot running');
