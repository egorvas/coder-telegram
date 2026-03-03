import type { Telegraf } from 'telegraf';
import { getCoderClient } from '../bot.js';
import { taskSessions } from '../store/task-sessions.js';
import { sendCard, updateCard } from '../ui/task-card.js';
import { buildStatusSnippet } from '../utils/log-parser.js';
import { log } from '../utils/logger.js';
import { CoderAuthError } from '../utils/coder-error.js';
import { userStore } from '../store/user-store.js';

export function startPoller(bot: Telegraf, intervalMs = 15_000): void {
  log.info('task poller started', { intervalMs });

  setInterval(() => {
    void poll(bot);
  }, intervalMs);
}

async function poll(bot: Telegraf): Promise<void> {
  const sessions = taskSessions.getAllSessions();
  if (sessions.length === 0) return;

  let tasksChecked = 0;
  let stateChanges = 0;
  const usersSeen = new Set<number>();

  for (const { taskId, chatId, userId, lastKnownStatus, lastKnownAgentState, cardMessageId, lastPrompt } of sessions) {
    const client = getCoderClient(userId);
    if (!client) continue;

    usersSeen.add(userId);

    try {
      const task = await client.getTask(taskId);
      const status = task.status;
      const agentState = task.current_state?.state;
      const agentMessage = task.current_state?.message;
      tasksChecked++;

      const statusChanged = status !== lastKnownStatus;
      const agentStateChanged = agentState !== undefined && agentState !== lastKnownAgentState;

      if (statusChanged) {
        stateChanges++;
        log.info('task status change', { taskId, from: lastKnownStatus, to: status, userId });
      }

      if (agentStateChanged) {
        stateChanges++;
        log.info('task agent state change', { taskId, from: lastKnownAgentState, to: agentState, userId });
      }

      // Update card if state changed
      if (cardMessageId && (statusChanged || agentStateChanged)) {
        let snippet: string | undefined;

        // Fetch logs only when agent finishes or task reaches terminal state
        if (agentState === 'idle' || ['stopped', 'error', 'unknown'].includes(status)) {
          try {
            const logs = await client.getTaskLogs(taskId);
            snippet = buildStatusSnippet(agentMessage, logs);
          } catch {
            snippet = agentMessage;
          }
        } else {
          snippet = agentMessage;
        }

        const success = await updateCard(bot, chatId, cardMessageId, task, {
          lastPrompt,
          statusSnippet: snippet,
        });

        if (!success) {
          // Card was deleted by user — send a new one
          const newMsgId = await sendCard(bot, chatId, task, {
            lastPrompt,
            statusSnippet: snippet,
          });
          taskSessions.setCardMessageId(taskId, userId, newMsgId);
        }
      }

      // Send completion ping when AI finishes
      if (agentState === 'idle' && lastKnownAgentState === 'working' && status === 'active') {
        const name = task.display_name || task.name;
        try {
          await bot.telegram.sendMessage(
            chatId,
            `✅ *${name}* — done`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          log.warn('completion ping failed', { taskId, err: String(err) });
        }
      }

      // Terminal status notification (if no card existed)
      const terminalStatuses = ['stopped', 'error', 'unknown'];
      if (terminalStatuses.includes(status) && !terminalStatuses.includes(lastKnownStatus ?? '')) {
        if (!cardMessageId) {
          const msgId = await sendCard(bot, chatId, task);
          taskSessions.setCardMessageId(taskId, userId, msgId);
        }
      }

      taskSessions.updateStatus(taskId, userId, status, agentState);
    } catch (err) {
      if (err instanceof CoderAuthError) {
        log.warn('coder auth expired in poller, clearing key', { userId });
        userStore.clearApiKey(userId);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('404') || message.includes('status 404')) {
          log.info('poller task removed', { taskId });
          taskSessions.remove(taskId, userId);
        } else {
          log.error('poller task error', { taskId, err: message });
        }
      }
    }
  }

  log.debug('poller cycle', { usersPolled: usersSeen.size, tasksChecked, stateChanges });
}
