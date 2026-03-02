import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import type { Telegraf } from 'telegraf';
import { config } from '../config.js';
import { taskSessions } from '../store/task-sessions.js';
import { notifyTaskComplete } from '../flows/task-completion.js';
import type { WebhookMeta } from '../flows/task-completion.js';

interface CoderNotification {
  _version: string;
  msg_id: string;
  payload: {
    notification_name: string;
    user_username: string;
    labels: { task?: string; workspace?: string };
    actions: Array<{ label: string; url: string }>;
    title: string;
    body: string;
  };
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return signature === `sha256=${expected}`;
}

export function startWebhookServer(bot: Telegraf): void {
  if (!config.webhookPort) {
    console.log('Webhook mode disabled (WEBHOOK_PORT not set).');
    return;
  }

  const server = createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook') {
      res.writeHead(404).end();
      return;
    }

    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Signature verification
      if (config.webhookSecret) {
        const signature = req.headers['x-coder-signature'] as string | undefined;
        if (!signature || !verifySignature(body, signature, config.webhookSecret)) {
          res.writeHead(401).end('Unauthorized');
          return;
        }
      }

      // Parse payload
      let notification: CoderNotification;
      try {
        notification = JSON.parse(body) as CoderNotification;
        if (!notification.payload?.labels?.task) throw new Error('Missing payload.labels.task');
      } catch {
        console.error('Webhook: malformed payload:', body);
        res.writeHead(400).end('Bad Request');
        return;
      }

      const { notification_name, title, labels } = notification.payload;
      const taskName = labels.task ?? '';
      console.log(`Webhook: [${notification_name}] task="${taskName}"`);

      if (notification_name !== 'Task Idle') {
        console.log(`Webhook: ignoring event "${notification_name}"`);
        res.writeHead(200).end('OK');
        return;
      }

      const result = taskSessions.getIdByName(taskName);
      if (!result) {
        console.warn(`Webhook: no session for task name "${taskName}"`);
        res.writeHead(200).end('OK');
        return;
      }

      // Notify asynchronously — respond immediately
      res.writeHead(200).end('OK');
      const { taskId, chatId } = result;
      const meta: WebhookMeta = {
        title: notification.payload.title,
        body: notification.payload.body,
      };
      notifyTaskComplete(taskId, chatId, bot, meta).catch((err: unknown) => {
        console.error('Webhook: notification failed:', err);
      });
    });
  });

  server.listen(config.webhookPort, () => {
    console.log(`Webhook server listening on port ${config.webhookPort}`);
  });
}
