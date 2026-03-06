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

/**
 * Edit the wizard message in-place or send a new one if editing fails.
 * Returns the message_id.
 */
async function editOrSend(
  ctx: Context,
  chatId: number,
  messageId: number | undefined,
  text: string,
  keyboard: ReturnType<typeof wizardTemplateKeyboard>
): Promise<number> {
  if (messageId) {
    try {
      await bot.telegram.editMessageText(chatId, messageId, undefined, text, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
      return messageId;
    } catch {
      // Message gone or can't edit — send new one
    }
  }
  const msg = await bot.telegram.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...keyboard,
  });
  return msg.message_id;
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
    const label = mode === 'workspace' ? 'New Workspace' : 'New Task';
    const text = `*${label} — Step 1/3* — Select a template:`;
    const keyboard = wizardTemplateKeyboard(templates);

    // Try to edit the current message (if triggered from inline button)
    let msgId: number | undefined;
    try {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      msgId = (ctx.callbackQuery as { message?: { message_id: number } })?.message?.message_id;
    } catch {
      const msg = await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      msgId = msg.message_id;
    }

    uiState.setWizard(chatId, { step: 1, mode, messageId: msgId });
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

  const { templateVersionId, templateName, presetId, presetName, messageId, mode } = wizard;
  if (!templateVersionId) {
    await ctx.reply('Wizard state lost. Please start again.');
    return;
  }

  // Delete the wizard message
  if (messageId) {
    try {
      await bot.telegram.deleteMessage(chatId, messageId);
    } catch { /* already gone */ }
  }

  if (mode === 'workspace') {
    try {
      const name = `ws-${randomSuffix()}`;
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
      if (presetName) taskSessions.setPresetName(task.id, userId, presetName);
      const cardMsgId = await sendCard(bot, chatId, task, { presetName });
      taskSessions.setCardMessageId(task.id, userId, cardMsgId);
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
    const messageId = wizard?.messageId;

    try {
      const templates = await client.listTemplates();
      const tpl = templates.find((t) => t.name === templateName);
      if (!tpl) {
        await ctx.reply(`Template "${templateName}" not found.`);
        return;
      }

      const presets = await client.getTemplatePresets(tpl.active_version_id);
      const hasPresets = presets.length > 0;

      if (hasPresets) {
        const text = `*Step 2/3* — Select a preset:`;
        const keyboard = wizardPresetKeyboard(presets);
        const msgId = await editOrSend(ctx, chatId, messageId, text, keyboard);
        uiState.setWizard(chatId, {
          step: 2, mode, templateName,
          templateVersionId: tpl.active_version_id,
          messageId: msgId,
        });
      } else {
        const canSkip = mode === 'workspace';
        const text = '*Step 3/3* — No presets available (using defaults).\n\nEnter a prompt' +
          (canSkip ? ' or skip:' : ':');
        const keyboard = promptKeyboard(canSkip);
        const msgId = await editOrSend(ctx, chatId, messageId, text, keyboard);
        uiState.setWizard(chatId, {
          step: 3, mode, templateName,
          templateVersionId: tpl.active_version_id,
          messageId: msgId,
        });
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

    const canSkip = wizard.mode === 'workspace';
    const text = '*Step 3/3* — Enter a prompt' + (canSkip ? ' or skip:' : ':');
    const keyboard = promptKeyboard(canSkip);
    const msgId = await editOrSend(ctx, chatId, wizard.messageId, text, keyboard);
    uiState.setWizard(chatId, { ...wizard, step: 3, presetId, presetName, messageId: msgId });
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

  // wizard:cancel → clear state, edit message to "Cancelled"
  bot.action('wizard:cancel', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    await ctx.answerCbQuery();
    const wizard = uiState.getWizard(chatId);
    uiState.clearWizard(chatId);
    if (wizard?.messageId) {
      try {
        await bot.telegram.deleteMessage(chatId, wizard.messageId);
      } catch { /* already gone */ }
    }
  });

  // wizard:back → go back one step (edit same message)
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
        const text = '*Step 1/3* — Select a template:';
        const keyboard = wizardTemplateKeyboard(templates);
        const msgId = await editOrSend(ctx, chatId, wizard.messageId, text, keyboard);
        uiState.setWizard(chatId, { step: 1, mode: wizard.mode, messageId: msgId });
      } else if (wizard.step === 3 && wizard.templateVersionId) {
        const presets = await client.getTemplatePresets(wizard.templateVersionId);
        if (presets.length > 0) {
          const text = '*Step 2/3* — Select a preset:';
          const keyboard = wizardPresetKeyboard(presets);
          const msgId = await editOrSend(ctx, chatId, wizard.messageId, text, keyboard);
          uiState.setWizard(chatId, {
            ...wizard, step: 2, presetId: undefined, presetName: undefined, messageId: msgId,
          });
        } else {
          const templates = await client.listTemplates();
          const text = '*Step 1/3* — Select a template:';
          const keyboard = wizardTemplateKeyboard(templates);
          const msgId = await editOrSend(ctx, chatId, wizard.messageId, text, keyboard);
          uiState.setWizard(chatId, { step: 1, mode: wizard.mode, messageId: msgId });
        }
      }
    } catch (err) {
      await handleCoderError(ctx, err, ctx.from?.id ?? 0);
    }
  });
}
