import type { Telegraf } from 'telegraf';
import type { CoderTask } from '../coder/types.js';
import { taskCardKeyboard } from './keyboards.js';
import { sanitizeText, fitLogs } from '../utils/telegram.js';
import { stripAnsi } from '../utils/log-parser.js';
import { log } from '../utils/logger.js';

const TG_LIMIT = 4096;

function statusEmoji(status: string, agentState?: string): string {
  if (agentState === 'working') return '⏳';
  if (status === 'active' && agentState === 'idle') return '✅';
  switch (status) {
    case 'pending':
    case 'initializing':
      return '🔄';
    case 'active':
      return '🔄';
    case 'paused':
      return '⏸';
    case 'stopped':
      return '⏹';
    case 'error':
      return '❌';
    default:
      return '❓';
  }
}

function statusLabel(status: string, agentState?: string): string {
  if (agentState === 'working') return 'Working…';
  if (status === 'active' && agentState === 'idle') return 'Done';
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'initializing':
      return 'Initializing…';
    case 'paused':
      return 'Paused';
    case 'stopped':
      return 'Stopped';
    case 'error':
      return 'Error';
    default:
      return status;
  }
}

export interface CardTextOptions {
  lastPrompt?: string;
  statusSnippet?: string;
}

/**
 * Build the card text for a task. Fits within Telegram's 4096-char limit.
 */
export function buildCardText(task: CoderTask, opts?: CardTextOptions): string {
  const name = task.display_name || task.name;
  const emoji = statusEmoji(task.status, task.current_state?.state);
  const label = statusLabel(task.status, task.current_state?.state);

  let text = `${emoji} *${name}*\nStatus: ${label}`;

  // Initial prompt (truncated)
  if (task.initial_prompt) {
    const prompt = task.initial_prompt.slice(0, 200);
    const ellipsis = task.initial_prompt.length > 200 ? '…' : '';
    text += `\n\n> ${prompt}${ellipsis}`;
  }

  // Last user prompt
  if (opts?.lastPrompt) {
    const trimmed = opts.lastPrompt.slice(0, 200);
    text += `\n\n✏️ You: ${trimmed}`;
  }

  // Status snippet (AI response or agent message)
  if (opts?.statusSnippet) {
    const cleaned = sanitizeText(stripAnsi(opts.statusSnippet));
    // Reserve space for the rest of the message
    const available = TG_LIMIT - text.length - 20; // 20 = safety margin + \n\n```\n...\n```
    if (available > 50 && cleaned.length > 0) {
      const { text: fitted } = fitLogs(cleaned, text.length + 4);
      text += `\n\n\`\`\`\n${fitted}\n\`\`\``;
    }
  }

  // Footer
  text += '\n\n_Reply to this message to continue_';

  return text;
}

/**
 * Send a new card message. Returns the message_id.
 */
export async function sendCard(
  bot: Telegraf,
  chatId: number,
  task: CoderTask,
  opts?: CardTextOptions
): Promise<number> {
  const text = buildCardText(task, opts);
  const keyboard = taskCardKeyboard(task.id, task.current_state?.state);
  const msg = await bot.telegram.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...keyboard,
  });
  return msg.message_id;
}

/**
 * Send a log message with the AI's response. User can reply to it to continue.
 * Returns the message_id.
 */
export async function sendLogMessage(
  bot: Telegraf,
  chatId: number,
  task: CoderTask,
  cleanedLogs: string
): Promise<number> {
  const name = task.display_name || task.name;
  const emoji = statusEmoji(task.status, task.current_state?.state);
  const label = statusLabel(task.status, task.current_state?.state);
  const keyboard = taskCardKeyboard(task.id, task.current_state?.state);

  const header = `${emoji} *${name}* — ${label}`;
  const footer = '\n\n_Reply to this message to continue_';
  const headerLen = header.length + footer.length + 4; // +4 for \n\n

  if (!cleanedLogs) {
    const msg = await bot.telegram.sendMessage(chatId, `${header}\n\n_No logs yet._${footer}`, {
      parse_mode: 'Markdown',
      ...keyboard,
    });
    return msg.message_id;
  }

  const { text: fitted, wasTruncated } = fitLogs(cleanedLogs, headerLen);
  const truncNote = wasTruncated ? '\n_(truncated — showing last portion)_' : '';
  const fullText = `${header}\n\n\`\`\`\n${fitted}\n\`\`\`${truncNote}${footer}`;

  const msg = await bot.telegram.sendMessage(chatId, fullText, {
    parse_mode: 'Markdown',
    ...keyboard,
  });
  return msg.message_id;
}

/**
 * Update an existing card message in-place.
 * Returns true if successful, false if the message was deleted by the user.
 */
export async function updateCard(
  bot: Telegraf,
  chatId: number,
  messageId: number,
  task: CoderTask,
  opts?: CardTextOptions
): Promise<boolean> {
  const text = buildCardText(task, opts);
  const keyboard = taskCardKeyboard(task.id, task.current_state?.state);
  try {
    await bot.telegram.editMessageText(chatId, messageId, undefined, text, {
      parse_mode: 'Markdown',
      ...keyboard,
    });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('message is not modified')) {
      // Nothing changed — expected during polling
      return true;
    }
    if (msg.includes('message to edit not found') || msg.includes('MESSAGE_ID_INVALID')) {
      log.warn('card message deleted by user', { chatId, messageId });
      return false;
    }
    if (msg.includes('Too Many Requests')) {
      log.warn('telegram rate limit on card update', { chatId, messageId });
      return true; // Will retry next poll cycle
    }
    log.error('card update failed', { chatId, messageId, err: msg });
    return true; // Don't recreate on unknown errors
  }
}
