import type { Telegraf } from 'telegraf';
import type { CoderTask } from '../coder/types.js';
import { taskCardKeyboard, logMessageKeyboard } from './keyboards.js';
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

  let text = `${emoji} *${name}* — ${label}`;

  // Show last prompt if available, otherwise initial prompt
  const prompt = opts?.lastPrompt || task.initial_prompt;
  if (prompt) {
    const trimmed = prompt.slice(0, 200);
    const ellipsis = prompt.length > 200 ? '…' : '';
    text += `\n\n> ${trimmed}${ellipsis}`;
  }

  // Status snippet (AI response or agent message)
  if (opts?.statusSnippet) {
    const cleaned = sanitizeText(stripAnsi(opts.statusSnippet));
    const available = TG_LIMIT - text.length - 20;
    if (available > 50 && cleaned.length > 0) {
      const { text: fitted } = fitLogs(cleaned, text.length + 4);
      text += `\n\n\`\`\`\n${fitted}\n\`\`\``;
    }
  }

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

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `${hr}h ${remMin}m` : `${hr}h`;
}

/**
 * Send a log message with the AI's response. User can reply to it to continue.
 * Returns the message_id.
 */
export async function sendLogMessage(
  bot: Telegraf,
  chatId: number,
  task: CoderTask,
  cleanedLogs: string,
  durationMs?: number
): Promise<number> {
  const name = task.display_name || task.name;
  const emoji = statusEmoji(task.status, task.current_state?.state);
  const label = statusLabel(task.status, task.current_state?.state);
  const keyboard = logMessageKeyboard(task.id);

  const durationStr = durationMs ? ` (${formatDuration(durationMs)})` : '';
  const header = `${emoji} *${name}* — ${label}${durationStr}`;
  const headerLen = header.length + 4; // +4 for \n\n

  if (!cleanedLogs) {
    const msg = await bot.telegram.sendMessage(chatId, `${header}\n\n_No logs yet._`, {
      parse_mode: 'Markdown',
      ...keyboard,
    });
    return msg.message_id;
  }

  const { text: fitted, wasTruncated } = fitLogs(cleanedLogs, headerLen);
  const truncNote = wasTruncated ? '\n_(truncated)_' : '';
  const fullText = `${header}\n\n\`\`\`\n${fitted}\n\`\`\`${truncNote}`;

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
