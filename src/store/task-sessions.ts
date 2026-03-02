import { readFileSync, mkdirSync, writeFile } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';

interface TaskSession {
  chatId: number;
}

interface PendingAppend {
  taskId: string;
}

interface PersistedData {
  sessions: Record<string, TaskSession>;
  nameToId: Record<string, string>;
}

class TaskSessionStore {
  private sessions = new Map<string, TaskSession>();       // taskId → session
  private nameToId = new Map<string, string>();            // taskName → taskId
  private pendingAppends = new Map<number, PendingAppend>();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = readFileSync(config.sessionFile, 'utf-8');
      const data = JSON.parse(raw) as PersistedData;
      for (const [id, session] of Object.entries(data.sessions ?? {})) {
        this.sessions.set(id, session);
      }
      for (const [name, id] of Object.entries(data.nameToId ?? {})) {
        this.nameToId.set(name, id);
      }
      console.log(`Sessions loaded: ${this.sessions.size} tasks`);
    } catch {
      // File doesn't exist yet — start fresh
    }
  }

  private save(): void {
    const data: PersistedData = {
      sessions: Object.fromEntries(this.sessions),
      nameToId: Object.fromEntries(this.nameToId),
    };
    mkdirSync(dirname(config.sessionFile), { recursive: true });
    writeFile(config.sessionFile, JSON.stringify(data, null, 2), (err) => {
      if (err) console.error('Failed to save sessions:', err);
    });
  }

  register(taskId: string, chatId: number): void {
    this.sessions.set(taskId, { chatId });
    this.save();
  }

  registerName(taskName: string, taskId: string): void {
    this.nameToId.set(taskName, taskId);
    this.save();
  }

  getIdByName(taskName: string): string | null {
    return this.nameToId.get(taskName) ?? null;
  }

  get(taskId: string): TaskSession | null {
    return this.sessions.get(taskId) ?? null;
  }

  remove(taskId: string): void {
    this.sessions.delete(taskId);
    this.save();
  }

  setPendingAppend(chatId: number, taskId: string): void {
    this.pendingAppends.set(chatId, { taskId });
  }

  getPendingAppend(chatId: number): PendingAppend | null {
    return this.pendingAppends.get(chatId) ?? null;
  }

  clearPendingAppend(chatId: number): void {
    this.pendingAppends.delete(chatId);
  }
}

export const taskSessions = new TaskSessionStore();
