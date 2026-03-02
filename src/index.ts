import { bot, coderClient } from './bot.js';
import { config } from './config.js';
import { startCommand } from './commands/start.js';
import { tasksListCommand } from './commands/tasks/list.js';
import { taskCreateCommand } from './commands/tasks/create.js';
import { workspacesCommand } from './commands/workspaces.js';
import { templatesCommand } from './commands/templates/list.js';
import { taskSessions } from './store/task-sessions.js';
import { taskMenuKeyboard } from './ui/keyboards.js';
import { startPoller } from './flows/task-poller.js';
import { uiState } from './ui/state.js';
import { registerMainMenuHandlers } from './ui/handlers/main-menu.js';
import { registerTaskDashboardHandlers } from './ui/handlers/task-dashboard.js';
import { registerWizardHandlers, handleWizardPromptInput, startWizard } from './ui/handlers/wizard.js';
import { registerWorkspaceMenuHandlers } from './ui/handlers/workspace-menu.js';
import { sanitizeText } from './utils/telegram.js';
import { registerTemplateBrowserHandlers } from './ui/handlers/template-browser.js';

// ─── Middleware: auth guard ───────────────────────────────────────────────────
bot.use(async (ctx, next) => {
  if (config.allowedUsers.size > 0) {
    const userId = ctx.from?.id;
    if (!userId || !config.allowedUsers.has(userId)) {
      await ctx.reply('Sorry, you are not authorised to use this bot.');
      return;
    }
  }
  return next();
});

// ─── Middleware: clear pending text input on any button press ─────────────────
bot.use(async (ctx, next) => {
  if ('callbackQuery' in ctx.update && ctx.chat?.id) {
    const chatId = ctx.chat.id;
    uiState.clearPendingAppend(chatId);
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

// ─── Commands ─────────────────────────────────────────────────────────────────
bot.command('start', startCommand);
bot.command('tasks', tasksListCommand);
bot.command('task_create', taskCreateCommand);
bot.command('workspaces', workspacesCommand);
bot.command('workspaces_create', (ctx) => startWizard(ctx, 'workspace'));
bot.command('templates', templatesCommand);

// ─── Unified text handler ─────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const text = sanitizeText(ctx.message.text);

  if (text.startsWith('/')) return;

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
    try {
      await coderClient.appendTaskPrompt(uiPending.taskId, text);
      await ctx.reply(
        `Prompt appended to task \`${uiPending.taskId.slice(0, 8)}\`.`,
        { parse_mode: 'Markdown', ...taskMenuKeyboard(uiPending.taskId) }
      );
    } catch (err) {
      await ctx.reply(`Failed to append: ${err instanceof Error ? err.message : String(err)}`);
    }
    return;
  }

});

// ─── Telegram command menu ────────────────────────────────────────────────────
await bot.telegram.setMyCommands([
  { command: 'tasks', description: 'AI tasks dashboard' },
  { command: 'task_create', description: 'Create a new AI task' },
  { command: 'workspaces', description: 'Manage workspaces' },
  { command: 'workspaces_create', description: 'Create a new workspace' },
  { command: 'templates', description: 'Browse templates and presets' },
]);

// ─── Start ────────────────────────────────────────────────────────────────────
startPoller(bot, config.pollIntervalMs);
console.log('Coder Telegram bot starting...');
await bot.launch();
console.log('Bot is running.');
