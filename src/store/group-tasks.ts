import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

interface GroupTaskBinding {
  taskId: string;
  ownerUserId: number;
  cardMessageId?: number;
  logMessageId?: number;
}

class GroupTaskStore {
  // chatId → binding
  private bindings = new Map<number, GroupTaskBinding>();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = readFileSync(config.sessionFile, 'utf-8');
      const data = JSON.parse(raw) as { groupTasks?: Record<string, GroupTaskBinding> };
      for (const [chatId, binding] of Object.entries(data.groupTasks ?? {})) {
        this.bindings.set(parseInt(chatId, 10), binding);
      }
      if (this.bindings.size > 0) {
        log.info('group tasks loaded', { count: this.bindings.size });
      }
    } catch {
      // File doesn't exist yet
    }
  }

  private save(): void {
    let existing: Record<string, unknown> = {};
    try {
      if (existsSync(config.sessionFile)) {
        existing = JSON.parse(readFileSync(config.sessionFile, 'utf-8')) as Record<string, unknown>;
      }
    } catch { /* ignore */ }
    const groupTasks: Record<string, GroupTaskBinding> = {};
    for (const [chatId, binding] of this.bindings) {
      groupTasks[String(chatId)] = binding;
    }
    mkdirSync(dirname(config.sessionFile), { recursive: true });
    try {
      writeFileSync(config.sessionFile, JSON.stringify({ ...existing, groupTasks }, null, 2));
    } catch (err) {
      log.error('failed to save group tasks', { err: String(err) });
    }
  }

  set(chatId: number, taskId: string, ownerUserId: number): void {
    this.bindings.set(chatId, { taskId, ownerUserId });
    this.save();
  }

  get(chatId: number): GroupTaskBinding | null {
    return this.bindings.get(chatId) ?? null;
  }

  remove(chatId: number): void {
    this.bindings.delete(chatId);
    this.save();
  }

  getAll(): Array<{ chatId: number } & GroupTaskBinding> {
    return [...this.bindings.entries()].map(([chatId, b]) => ({ chatId, ...b }));
  }

  setCardMessageId(chatId: number, messageId: number): void {
    const binding = this.bindings.get(chatId);
    if (binding) {
      binding.cardMessageId = messageId;
      this.save();
    }
  }

  setLogMessageId(chatId: number, messageId: number): void {
    const binding = this.bindings.get(chatId);
    if (binding) {
      binding.logMessageId = messageId;
      this.save();
    }
  }

  findByReplyMessageId(chatId: number, messageId: number): GroupTaskBinding | null {
    const binding = this.bindings.get(chatId);
    if (!binding) return null;
    if (binding.cardMessageId === messageId || binding.logMessageId === messageId) {
      return binding;
    }
    return null;
  }
}

export const groupTaskStore = new GroupTaskStore();
