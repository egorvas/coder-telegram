type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function currentLevel(): Level {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LEVELS) return env as Level;
  return 'info';
}

const isProd = process.env.NODE_ENV === 'production';

function serialize(extra: Record<string, unknown>): string {
  return Object.entries(extra)
    .map(([k, v]) => {
      if (v instanceof Error) return `${k}=${v.message}`;
      return `${k}=${JSON.stringify(v)}`;
    })
    .join(' ');
}

function serializeJson(extra: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(extra)) {
    if (v instanceof Error) {
      out[k] = { message: v.message, stack: v.stack };
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level: Level, msg: string, extra: Record<string, unknown> = {}): void {
  if (LEVELS[level] < LEVELS[currentLevel()]) return;

  if (isProd) {
    const line = JSON.stringify({
      level,
      ts: new Date().toISOString(),
      msg,
      ...serializeJson(extra),
    });
    process.stdout.write(line + '\n');
  } else {
    const label = level.toUpperCase().padEnd(5);
    const time = new Date().toTimeString().slice(0, 8);
    const extras = Object.keys(extra).length > 0 ? ' ' + serialize(extra) : '';
    process.stdout.write(`[${label}] ${time} ${msg}${extras}\n`);
  }
}

export const log = {
  debug: (msg: string, extra?: Record<string, unknown>) => emit('debug', msg, extra),
  info:  (msg: string, extra?: Record<string, unknown>) => emit('info',  msg, extra),
  warn:  (msg: string, extra?: Record<string, unknown>) => emit('warn',  msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => emit('error', msg, extra),
};
