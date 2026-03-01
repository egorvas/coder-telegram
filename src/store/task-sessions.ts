interface TaskSession {
  chatId: number;
}

interface PendingAppend {
  taskId: string;
}

class TaskSessionStore {
  private sessions = new Map<string, TaskSession>();       // taskId → session
  private nameToId = new Map<string, string>();            // taskName → taskId
  private pendingAppends = new Map<number, PendingAppend>();

  register(taskId: string, chatId: number): void {
    this.sessions.set(taskId, { chatId });
  }

  registerName(taskName: string, taskId: string): void {
    this.nameToId.set(taskName, taskId);
  }

  getIdByName(taskName: string): string | null {
    return this.nameToId.get(taskName) ?? null;
  }

  get(taskId: string): TaskSession | null {
    return this.sessions.get(taskId) ?? null;
  }

  remove(taskId: string): void {
    this.sessions.delete(taskId);
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
