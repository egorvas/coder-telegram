import { readFileSync, mkdirSync, writeFile } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

interface UserRecord {
  coderApiKey?: string;
  allowed: boolean;
}

type Registry = Record<string, UserRecord>;

class UserStore {
  // userId → record
  private records = new Map<number, UserRecord>();

  constructor() {
    // Seed from env-configured allowed users (always authoritative)
    for (const uid of config.allowedUsers) {
      this.records.set(uid, { allowed: true });
    }
    this.load();
  }

  private load(): void {
    try {
      const raw = readFileSync(config.sessionFile, 'utf-8');
      const data = JSON.parse(raw) as { registry?: Registry };
      for (const [uid, record] of Object.entries(data.registry ?? {})) {
        const userId = parseInt(uid, 10);
        const seeded = this.records.get(userId);
        // Env-seeded users keep allowed=true; load stored key
        this.records.set(userId, {
          ...record,
          allowed: seeded?.allowed || record.allowed,
        });
      }
      log.info('user registry loaded', { users: this.records.size });
    } catch {
      // File doesn't exist yet — start fresh
    }
  }

  private save(): void {
    // Read existing file to preserve other sections (e.g. `users` from task-sessions)
    let existing: Record<string, unknown> = {};
    try {
      existing = JSON.parse(readFileSync(config.sessionFile, 'utf-8')) as Record<string, unknown>;
    } catch { /* ignore */ }

    const registry: Registry = {};
    for (const [userId, record] of this.records) {
      registry[String(userId)] = record;
    }
    mkdirSync(dirname(config.sessionFile), { recursive: true });
    writeFile(config.sessionFile, JSON.stringify({ ...existing, registry }, null, 2), (err) => {
      if (err) log.error('failed to save user registry', { err: String(err) });
    });
  }

  isAllowed(userId: number): boolean {
    return this.records.get(userId)?.allowed ?? false;
  }

  addUser(userId: number): void {
    const existing = this.records.get(userId);
    this.records.set(userId, { ...existing, allowed: true });
    this.save();
  }

  removeUser(userId: number): void {
    const record = this.records.get(userId);
    if (record) {
      record.allowed = false;
      this.save();
    }
  }

  setApiKey(userId: number, key: string): void {
    const existing = this.records.get(userId) ?? { allowed: true };
    this.records.set(userId, { ...existing, coderApiKey: key });
    this.save();
  }

  getApiKey(userId: number): string | null {
    return this.records.get(userId)?.coderApiKey ?? null;
  }

  clearApiKey(userId: number): void {
    const record = this.records.get(userId);
    if (record) {
      delete record.coderApiKey;
      this.save();
    }
  }

  listUsers(): Array<{ userId: number; hasKey: boolean }> {
    return [...this.records.entries()]
      .filter(([, r]) => r.allowed)
      .map(([userId, r]) => ({ userId, hasKey: !!r.coderApiKey }));
  }
}

export const userStore = new UserStore();
