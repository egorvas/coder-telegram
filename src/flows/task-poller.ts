import type { Telegraf } from 'telegraf';
import { getCoderClient } from '../bot.js';
import { taskSessions } from '../store/task-sessions.js';
import { sendCard, updateCard, sendLogMessage } from '../ui/task-card.js';
import { buildStatusSnippet, extractLastResponse } from '../utils/log-parser.js';
import { log } from '../utils/logger.js';
import { CoderAuthError } from '../utils/coder-error.js';
import { userStore } from '../store/user-store.js';

let polling = false;

export function startPoller(bot: Telegraf, intervalMs = 15_000): void {
  log.info('task poller started', { intervalMs });

  setInterval(() => {
    void poll(bot);
  }, intervalMs);
}

async function poll(bot: Telegraf): Promise<void> {
  if (polling) {
    log.debug('poller skipped — previous cycle still running');
    return;
  }
  polling = true;
  try {
    await doPoll(bot);
  } finally {
    polling = false;
  }
}

async function doPoll(bot: Telegraf): Promise<void> {
  // Auto-discover tasks created externally (e.g. via web UI)
  await discoverNewTasks();

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

      // Send log message when AI finishes or task hits terminal state
      const aiFinished = agentState === 'idle' && lastKnownAgentState === 'working' && status === 'active';
      const firstSeenDone = agentState === 'idle' && lastKnownAgentState === undefined && status === 'active';
      const terminalStatuses = ['stopped', 'error', 'unknown'];
      const hitTerminal = terminalStatuses.includes(status) && !terminalStatuses.includes(lastKnownStatus ?? '');

      if (aiFinished || firstSeenDone || hitTerminal) {
        try {
          const logs = await client.getTaskLogs(taskId);
          const cleaned = extractLastResponse(logs);
          // Calculate working duration
          const startedAt = taskSessions.getWorkingStartedAt(taskId, userId);
          const durationMs = startedAt ? Date.now() - startedAt : undefined;
          const logMsgId = await sendLogMessage(bot, chatId, task, cleaned, durationMs);
          taskSessions.setLogMessageId(taskId, userId, logMsgId);
        } catch (err) {
          log.warn('completion log message failed', { taskId, err: String(err) });
        }

        // Create card if one didn't exist (legacy sessions)
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

/**
 * Discover tasks created outside the bot (e.g. via web UI) and register them
 * so the poller can track their status and send notifications.
 */
async function discoverNewTasks(): Promise<void> {
  const usersWithKeys = userStore.listUsers().filter((u) => u.hasKey);

  for (const { userId } of usersWithKeys) {
    const client = getCoderClient(userId);
    if (!client) continue;

    try {
      const tasks = await client.listTasks();
      const terminalStatuses = ['stopped', 'error', 'unknown'];

      for (const task of tasks) {
        // Skip terminal tasks — no point tracking them
        if (terminalStatuses.includes(task.status)) continue;
        // Skip tasks already tracked
        if (taskSessions.get(task.id, userId)) continue;

        // Register new task — chatId = userId for DMs
        log.info('auto-discovered task', { taskId: task.id, userId, status: task.status });
        taskSessions.register(task.id, userId, userId);
        taskSessions.updateStatus(task.id, userId, task.status, task.current_state?.state);
      }
    } catch (err) {
      if (err instanceof CoderAuthError) {
        log.warn('coder auth expired during discovery, clearing key', { userId });
        userStore.clearApiKey(userId);
      } else {
        log.debug('task discovery failed', { userId, err: String(err) });
      }
    }
  }
}
