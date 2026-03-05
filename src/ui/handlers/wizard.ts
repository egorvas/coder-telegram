import type { Telegraf, Context } from 'telegraf';
import { bot, getCoderClient } from '../../bot.js';
import { uiState, type WizardState } from '../state.js';
import { taskSessions } from '../../store/task-sessions.js';
import {
  wizardTemplateKeyboard,
  wizardPresetKeyboard,
  promptKeyboard,
  mainMenuKeyboard,
} from '../keyboards.js';
import { sendCard } from '../task-card.js';
import { showWorkspaceList } from './workspace-menu.js';
import { config } from '../../config.js';
import { handleCoderError } from '../../utils/coder-error.js';
import { log } from '../../utils/logger.js';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
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

export async function startWizard(ctx: Context, mode: 'task' | 'workspace' = 'task'): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const client = clientOrReply(ctx);
  if (!client) return;

  try {
    const templates = await client.listTemplates();
    if (templates.length === 0) {
      const userId = ctx.from?.id ?? 0;
      await ctx.reply('No templates available.', mainMenuKeyboard(config.adminUsers.has(userId)));
      return;
    }
    uiState.setWizard(chatId, { step: 1, mode });
    const label = mode === 'workspace' ? 'New Workspace' : 'New Task';
    await ctx.reply(`*${label} — Step 1/3* — Select a template:`, {
      parse_mode: 'Markdown',
      ...wizardTemplateKeyboard(templates),
    });
  } catch (err) {
    await handleCoderError(ctx, err, ctx.from?.id ?? 0);
  }
}

async function createFromWizard(ctx: Context, wizard: WizardState, prompt: string): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const client = clientOrReply(ctx);
  if (!client) return;

  uiState.clearWizard(chatId);

  const { templateVersionId, templateName, presetId, presetName, mode } = wizard;
  if (!templateVersionId) {
    await ctx.reply('Wizard state lost. Please start again.');
    return;
  }

  if (mode === 'workspace') {
    try {
      const name = `ws-${randomSuffix()}`;
      await ctx.reply(`Creating workspace *${name}* from *${templateName ?? 'template'}*...`, { parse_mode: 'Markdown' });
      const ws = await client.createWorkspace(templateVersionId, presetId ?? null, name);
      log.info('workspace created', { name: ws.name, template: templateName, userId: ctx.from?.id });
      await ctx.reply(
        `Workspace created!\nName: \`${ws.name}\`\nStatus: ${ws.latest_build.status}`,
        { parse_mode: 'Markdown' }
      );
      await showWorkspaceList(ctx);
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  } else {
    try {
      const task = await client.createTask(templateVersionId, presetId ?? null, prompt);
      const userId = ctx.from?.id ?? chatId;
      log.info('task created', { taskId: task.id, template: templateName, preset: presetName, userId });
      taskSessions.register(task.id, chatId, userId);
      const messageId = await sendCard(bot, chatId, task);
      taskSessions.setCardMessageId(task.id, userId, messageId);
      taskSessions.updateStatus(task.id, userId, task.status, task.current_state?.state);
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  }
}

export async function handleWizardPromptInput(
  ctx: Context,
  promptText: string,
  wizard: WizardState
): Promise<void> {
  await createFromWizard(ctx, wizard, promptText);
}

export function registerWizardHandlers(bot: Telegraf): void {
  // wizard:tpl:<name> → step 1: store template, show presets or prompt
  bot.action(/^wizard:tpl:(.+)$/, async (ctx) => {
    const templateName = ctx.match[1];
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;

    const wizard = uiState.getWizard(chatId);
    const mode = wizard?.mode ?? 'task';

    try {
      const templates = await client.listTemplates();
      const tpl = templates.find((t) => t.name === templateName);
      if (!tpl) {
        await ctx.reply(`Template "${templateName}" not found.`);
        return;
      }

      const presets = await client.getTemplatePresets(tpl.active_version_id);
      uiState.setWizard(chatId, {
        step: presets.length > 0 ? 2 : 3,
        mode,
        templateName,
        templateVersionId: tpl.active_version_id,
      });

      if (presets.length > 0) {
        await ctx.reply('*Step 2/3* — Select a preset:', {
          parse_mode: 'Markdown',
          ...wizardPresetKeyboard(presets),
        });
      } else {
        const canSkip = mode === 'workspace';
        await ctx.reply(
          '*Step 3/3* — No presets available (using defaults).\n\nEnter a prompt' +
          (canSkip ? ' or skip:' : ':'),
          { parse_mode: 'Markdown', ...promptKeyboard(canSkip) }
        );
      }
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });

  // wizard:preset:<id> → store preset, show prompt input (step 3)
  bot.action(/^wizard:preset:(.+)$/, async (ctx) => {
    const presetId = ctx.match[1];
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;

    const wizard = uiState.getWizard(chatId);
    if (!wizard) return;

    let presetName = presetId;
    try {
      if (wizard.templateVersionId) {
        const presets = await client.getTemplatePresets(wizard.templateVersionId);
        const preset = presets.find((p) => p.ID === presetId);
        if (preset) presetName = preset.Name;
      }
    } catch { /* use id as fallback */ }

    uiState.setWizard(chatId, { ...wizard, step: 3, presetId, presetName });
    const canSkip = wizard.mode === 'workspace';
    await ctx.reply(
      '*Step 3/3* — Enter a prompt' + (canSkip ? ' or skip:' : ':'),
      { parse_mode: 'Markdown', ...promptKeyboard(canSkip) }
    );
  });

  // wizard:skip → workspace mode: create without prompt
  bot.action('wizard:skip', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();

    const wizard = uiState.getWizard(chatId);
    if (!wizard || wizard.mode !== 'workspace') return;

    await createFromWizard(ctx, wizard, '');
  });

  // wizard:cancel → clear state, return to main menu
  bot.action('wizard:cancel', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();
    uiState.clearWizard(chatId);
    const userId = ctx.from?.id ?? 0;
    await ctx.reply('Wizard cancelled.', mainMenuKeyboard(config.adminUsers.has(userId)));
  });

  // wizard:back → go back one step
  bot.action('wizard:back', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();
    const client = clientOrReply(ctx);
    if (!client) return;

    const wizard = uiState.getWizard(chatId);
    if (!wizard) return;

    try {
      if (wizard.step === 2) {
        const templates = await client.listTemplates();
        uiState.setWizard(chatId, { step: 1, mode: wizard.mode });
        await ctx.reply('*Step 1/3* — Select a template:', {
          parse_mode: 'Markdown',
          ...wizardTemplateKeyboard(templates),
        });
      } else if (wizard.step === 3 && wizard.templateVersionId) {
        const presets = await client.getTemplatePresets(wizard.templateVersionId);
        if (presets.length > 0) {
          uiState.setWizard(chatId, { ...wizard, step: 2, presetId: undefined, presetName: undefined });
          await ctx.reply('*Step 2/3* — Select a preset:', {
            parse_mode: 'Markdown',
            ...wizardPresetKeyboard(presets),
          });
        } else {
          const templates = await client.listTemplates();
          uiState.setWizard(chatId, { step: 1, mode: wizard.mode });
          await ctx.reply('*Step 1/3* — Select a template:', {
            parse_mode: 'Markdown',
            ...wizardTemplateKeyboard(templates),
          });
        }
      }
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });
}
