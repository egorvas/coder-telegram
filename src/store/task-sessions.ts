import { readFileSync, mkdirSync, writeFile } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';

interface TaskSession {
  chatId: number;
  lastKnownStatus?: string;
}

interface PendingAppend {
  taskId: string;
}

interface UserData {
  sessions: Record<string, TaskSession>;
}

interface PersistedData {
  users: Record<string, UserData>;
}

class TaskSessionStore {
  // userId → { sessions: taskId→session }
  private users = new Map<number, { sessions: Map<string, TaskSession> }>();
  private pendingAppends = new Map<number, PendingAppend>();

  constructor() {
    this.load();
  }

  private getUser(userId: number) {
    if (!this.users.has(userId)) {
      this.users.set(userId, { sessions: new Map() });
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
      }
      const total = [...this.users.values()].reduce((n, u) => n + u.sessions.size, 0);
      console.log(`Sessions loaded: ${total} tasks across ${this.users.size} users`);
    } catch {
      // File doesn't exist yet — start fresh
    }
  }

  private save(): void {
    const users: Record<string, UserData> = {};
    for (const [userId, { sessions }] of this.users) {
      users[String(userId)] = {
        sessions: Object.fromEntries(sessions),
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

  updateStatus(taskId: string, userId: number, status: string): void {
    const session = this.users.get(userId)?.sessions.get(taskId);
    if (session) {
      session.lastKnownStatus = status;
      this.save();
    }
  }

  getAllSessions(): Array<{ taskId: string; chatId: number; userId: number; lastKnownStatus?: string }> {
    const result: Array<{ taskId: string; chatId: number; userId: number; lastKnownStatus?: string }> = [];
    for (const [userId, { sessions }] of this.users) {
      for (const [taskId, session] of sessions) {
        result.push({ taskId, chatId: session.chatId, userId, lastKnownStatus: session.lastKnownStatus });
      }
    }
    return result;
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
