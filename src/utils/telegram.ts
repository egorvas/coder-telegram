const TG_LIMIT = 4096;
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
