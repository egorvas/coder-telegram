import type { Telegraf } from 'telegraf';
import { coderClient } from '../bot.js';
import { taskSessions } from '../store/task-sessions.js';
import { notifyTaskComplete } from './task-completion.js';

export function startPoller(bot: Telegraf, intervalMs = 15_000): void {
  console.log(`Task poller started (interval: ${intervalMs}ms)`);

  setInterval(() => {
    void poll(bot);
  }, intervalMs);
}

async function poll(bot: Telegraf): Promise<void> {
  const sessions = taskSessions.getAllSessions();
  for (const { taskId, chatId, userId, lastKnownStatus } of sessions) {
    try {
      const task = await coderClient.getTask(taskId);
      const status = task.status;

      if (status === 'stopped' && lastKnownStatus !== 'stopped') {
        await notifyTaskComplete(taskId, chatId, bot);
      }

      taskSessions.updateStatus(taskId, userId, status);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('404') || message.includes('status 404')) {
        console.log(`Poller: task ${taskId.slice(0, 8)} not found, removing session`);
        taskSessions.remove(taskId, userId);
      } else {
        console.error(`Poller: error fetching task ${taskId.slice(0, 8)}:`, message);
      }
    }
  }
}
