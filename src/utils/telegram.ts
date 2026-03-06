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

/**
 * Split a long body into multiple Telegram messages, each within TG_LIMIT.
 * First chunk includes the header; subsequent chunks are code-block continuations.
 * Splits at line boundaries to avoid cutting words.
 */
export function splitForTelegram(header: string, body: string): string[] {
  const safeLimit = TG_LIMIT - 40; // safety margin

  // First message: header + beginning of body in code block
  const firstAvailable = safeLimit - header.length - 4 - CODE_BLOCK_OVERHEAD; // 4 = \n\n
  if (body.length <= firstAvailable) {
    return [`${header}\n\n\`\`\`\n${body}\n\`\`\``];
  }

  const messages: string[] = [];
  let remaining = body;

  // First chunk with header
  const firstChunk = cutAtLineBreak(remaining, firstAvailable);
  messages.push(`${header}\n\n\`\`\`\n${firstChunk}\n\`\`\``);
  remaining = remaining.slice(firstChunk.length).replace(/^\n/, '');

  // Subsequent chunks — code blocks only
  const chunkSize = safeLimit - CODE_BLOCK_OVERHEAD;
  while (remaining.length > 0) {
    const chunk = cutAtLineBreak(remaining, chunkSize);
    messages.push(`\`\`\`\n${chunk}\n\`\`\``);
    remaining = remaining.slice(chunk.length).replace(/^\n/, '');
  }

  return messages;
}

function cutAtLineBreak(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const lastNl = text.lastIndexOf('\n', maxLen);
  if (lastNl > 0) return text.slice(0, lastNl);
  return text.slice(0, maxLen);
}
