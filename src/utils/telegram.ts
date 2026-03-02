const TG_LIMIT = 4096;

// Windows-1252 bytes 0x80–0x9F misinterpreted as Latin-1 appear as U+0080–U+009F
// in JavaScript strings. Replace common ones with readable ASCII, strip the rest.
const WIN1252_MAP: Record<string, string> = {
  '\u0091': "'", '\u0092': "'",
  '\u0093': '"', '\u0094': '"',
  '\u0096': '-', '\u0097': '-',
  '\u0085': '...',
};

export function sanitizeText(text: string): string {
  return text.replace(/[\u0080-\u009F]/g, (c) => WIN1252_MAP[c] ?? '');
}
const CODE_BLOCK_OVERHEAD = 8; // ```\n ... \n```

/**
 * Truncates log text so the full message stays within Telegram's 4096-char limit.
 * headerLen = length of everything outside the code block (header, footer, newlines).
 */
export function fitLogs(logs: string, headerLen: number): { text: string; wasTruncated: boolean } {
  const maxLogChars = TG_LIMIT - headerLen - CODE_BLOCK_OVERHEAD - 40; // 40 = safety margin
  if (logs.length <= maxLogChars) {
    return { text: logs, wasTruncated: false };
  }
  // Take the last maxLogChars characters, cutting at a newline boundary
  const cut = logs.slice(-maxLogChars);
  const newlineIdx = cut.indexOf('\n');
  const trimmed = newlineIdx > 0 ? cut.slice(newlineIdx + 1) : cut;
  return { text: trimmed, wasTruncated: true };
}

/**
 * Builds a log message that is guaranteed to fit within Telegram's limit.
 */
export function buildLogMessage(taskId: string, status: string, rawLogs: string): string {
  const header = `Task \`${taskId.slice(0, 8)}\` — *${status}*`;

  if (!rawLogs) {
    return `${header}\n\n_No logs yet._`;
  }

  const { text, wasTruncated } = fitLogs(rawLogs, header.length + 4); // +4 for \n\n
  const footer = wasTruncated ? '\n_(truncated — showing last portion)_' : '';
  return `${header}\n\n\`\`\`\n${text}\n\`\`\`${footer}`;
}
