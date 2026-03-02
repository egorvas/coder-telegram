import { readFileSync, mkdirSync, writeFile } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';

interface TaskSession {
  chatId: number;
}

interface PendingAppend {
  taskId: string;
}

interface UserData {
  sessions: Record<string, TaskSession>;
  nameToId: Record<string, string>;
}

interface PersistedData {
  users: Record<string, UserData>;
}

class TaskSessionStore {
  // userId → { sessions: taskId→session, nameToId: taskName→taskId }
  private users = new Map<number, { sessions: Map<string, TaskSession>; nameToId: Map<string, string> }>();
  private pendingAppends = new Map<number, PendingAppend>();

  constructor() {
    this.load();
  }

  private getUser(userId: number) {
    if (!this.users.has(userId)) {
      this.users.set(userId, { sessions: new Map(), nameToId: new Map() });
    }
    return this.users.get(userId)!;
  }

  private load(): void {
    try {
      const raw = readFileSync(config.sessionFile, 'utf-8');
      const data = JSON.parse(raw) as PersistedData;
      for (const [uid, userData] of Object.entries(data.users ?? {})) {
        const userId = parseInt(uid, 10);
        const user = this.getUser(userId);
        for (const [id, session] of Object.entries(userData.sessions ?? {})) {
          user.sessions.set(id, session);
        }
        for (const [name, id] of Object.entries(userData.nameToId ?? {})) {
          user.nameToId.set(name, id);
        }
      }
      const total = [...this.users.values()].reduce((n, u) => n + u.sessions.size, 0);
      console.log(`Sessions loaded: ${total} tasks across ${this.users.size} users`);
    } catch {
      // File doesn't exist yet — start fresh
    }
  }

  private save(): void {
    const users: Record<string, UserData> = {};
    for (const [userId, { sessions, nameToId }] of this.users) {
      users[String(userId)] = {
        sessions: Object.fromEntries(sessions),
        nameToId: Object.fromEntries(nameToId),
      };
    }
    const data: PersistedData = { users };
    mkdirSync(dirname(config.sessionFile), { recursive: true });
    writeFile(config.sessionFile, JSON.stringify(data, null, 2), (err) => {
      if (err) console.error('Failed to save sessions:', err);
    });
  }

  register(taskId: string, chatId: number, userId: number): void {
    this.getUser(userId).sessions.set(taskId, { chatId });
    this.save();
  }

  registerName(taskName: string, taskId: string, userId: number): void {
    this.getUser(userId).nameToId.set(taskName, taskId);
    this.save();
  }

  /** Cross-user lookup for webhook routing — returns { taskId, chatId } or null */
  getIdByName(taskName: string): { taskId: string; chatId: number } | null {
    for (const { nameToId, sessions } of this.users.values()) {
      const taskId = nameToId.get(taskName);
      if (taskId) {
        const session = sessions.get(taskId);
        if (session) return { taskId, chatId: session.chatId };
      }
    }
    return null;
  }

  get(taskId: string, userId: number): TaskSession | null {
    return this.users.get(userId)?.sessions.get(taskId) ?? null;
  }

  remove(taskId: string, userId: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.sessions.delete(taskId);
      this.save();
    }
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
