import type { Telegraf } from 'telegraf';
import { getCoderClient } from '../bot.js';
import { taskSessions } from '../store/task-sessions.js';
import { notifyTaskComplete } from './task-completion.js';
import { log } from '../utils/logger.js';

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

  for (const { taskId, chatId, userId, lastKnownStatus } of sessions) {
    const client = getCoderClient(userId);
    if (!client) continue;

    usersSeen.add(userId);

    try {
      const task = await client.getTask(taskId);
      const status = task.status;
      tasksChecked++;

      if (status !== lastKnownStatus) {
        stateChanges++;
        log.info('task state change', { taskId, from: lastKnownStatus, to: status, userId });
      }

      if (status === 'stopped' && lastKnownStatus !== 'stopped') {
        await notifyTaskComplete(taskId, chatId, userId, bot);
      }

      taskSessions.updateStatus(taskId, userId, status);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('404') || message.includes('status 404')) {
        log.info('poller task removed', { taskId });
        taskSessions.remove(taskId, userId);
      } else {
        log.error('poller task error', { taskId, err: message });
      }
    }
  }

  log.debug('poller cycle', { usersPolled: usersSeen.size, tasksChecked, stateChanges });
}
