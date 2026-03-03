import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

interface TaskSession {
  chatId: number;
  cardMessageId?: number;
  logMessageId?: number;
  lastKnownStatus?: string;
  lastKnownAgentState?: string;
  lastPrompt?: string;
  workingStartedAt?: number;
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
      log.info('sessions loaded', { tasks: total, users: this.users.size });
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
    // Preserve other sections (e.g. registry from user-store)
    let existing: Record<string, unknown> = {};
    try {
      if (existsSync(config.sessionFile)) {
        existing = JSON.parse(readFileSync(config.sessionFile, 'utf-8')) as Record<string, unknown>;
      }
    } catch { /* ignore */ }
    mkdirSync(dirname(config.sessionFile), { recursive: true });
    try {
      writeFileSync(config.sessionFile, JSON.stringify({ ...existing, users }, null, 2));
    } catch (err) {
      log.error('failed to save sessions', { err: String(err) });
    }
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

  updateStatus(taskId: string, userId: number, status: string, agentState?: string): void {
    const session = this.users.get(userId)?.sessions.get(taskId);
    if (session) {
      // Track when agent starts working
      if (agentState === 'working' && session.lastKnownAgentState !== 'working') {
        session.workingStartedAt = Date.now();
      }
      session.lastKnownStatus = status;
      if (agentState !== undefined) session.lastKnownAgentState = agentState;
      this.save();
    }
  }

  getWorkingStartedAt(taskId: string, userId: number): number | undefined {
    return this.users.get(userId)?.sessions.get(taskId)?.workingStartedAt;
  }

  getAgentState(taskId: string, userId: number): string | undefined {
    return this.users.get(userId)?.sessions.get(taskId)?.lastKnownAgentState;
  }

  getAllSessions(): Array<{ taskId: string; chatId: number; userId: number; lastKnownStatus?: string; lastKnownAgentState?: string; cardMessageId?: number; logMessageId?: number; lastPrompt?: string }> {
    const result: Array<{ taskId: string; chatId: number; userId: number; lastKnownStatus?: string; lastKnownAgentState?: string; cardMessageId?: number; logMessageId?: number; lastPrompt?: string }> = [];
    for (const [userId, { sessions }] of this.users) {
      for (const [taskId, session] of sessions) {
        result.push({
          taskId,
          chatId: session.chatId,
          userId,
          lastKnownStatus: session.lastKnownStatus,
          lastKnownAgentState: session.lastKnownAgentState,
          cardMessageId: session.cardMessageId,
          logMessageId: session.logMessageId,
          lastPrompt: session.lastPrompt,
        });
      }
    }
    return result;
  }

  setCardMessageId(taskId: string, userId: number, messageId: number): void {
    const session = this.users.get(userId)?.sessions.get(taskId);
    if (session) {
      session.cardMessageId = messageId;
      this.save();
    }
  }

  getCardMessageId(taskId: string, userId: number): number | undefined {
    return this.users.get(userId)?.sessions.get(taskId)?.cardMessageId;
  }

  setLastPrompt(taskId: string, userId: number, prompt: string): void {
    const session = this.users.get(userId)?.sessions.get(taskId);
    if (session) {
      session.lastPrompt = prompt;
      this.save();
    }
  }

  setLogMessageId(taskId: string, userId: number, messageId: number): void {
    const session = this.users.get(userId)?.sessions.get(taskId);
    if (session) {
      session.logMessageId = messageId;
      this.save();
    }
  }

  findByReplyMessageId(chatId: number, userId: number, messageId: number): { taskId: string } | null {
    const user = this.users.get(userId);
    if (!user) return null;
    for (const [taskId, session] of user.sessions) {
      if (session.chatId === chatId && (session.cardMessageId === messageId || session.logMessageId === messageId)) {
        return { taskId };
      }
    }
    return null;
  }
}

export const taskSessions = new TaskSessionStore();
