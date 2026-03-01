interface TaskSession {
  chatId: number;
}

interface PendingAppend {
  taskId: string;
}

class TaskSessionStore {
  private sessions = new Map<string, TaskSession>();
  private pendingAppends = new Map<number, PendingAppend>();

  register(taskId: string, chatId: number): void {
    this.sessions.set(taskId, { chatId });
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
