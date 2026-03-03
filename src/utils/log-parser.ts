// Regex covering CSI, OSC, and other ANSI escape sequences
const ANSI_RE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g;

/**
 * Strip ANSI escape sequences from terminal output.
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

// Lines that are noise: blank, shell prompts, cursor junk, hrules
const NOISE_RE = /^(\s*$|\$\s*$|>\s*$|─+$|━+$|╭|╰|│|┃|^\s*\d+[│|])/;

/**
 * Extract the last meaningful text block from raw task logs.
 * Strips ANSI, skips noise lines, returns the last contiguous block of text.
 */
export function extractLastResponse(rawLogs: string, maxChars = 1500): string {
  if (!rawLogs) return '';

  const clean = stripAnsi(rawLogs);
  const lines = clean.split('\n');

  // Reverse-scan: collect the last contiguous block of substantive lines
  const result: string[] = [];
  let totalChars = 0;
  let foundContent = false;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const isNoise = NOISE_RE.test(line);

    if (!isNoise && line.trim().length > 0) {
      foundContent = true;
      const lineLen = line.length + 1; // +1 for newline
      if (totalChars + lineLen > maxChars) break;
      result.unshift(line);
      totalChars += lineLen;
    } else if (foundContent) {
      // Hit a noise/blank line after finding content — stop (end of block)
      break;
    }
  }

  return result.join('\n').trim();
}

/**
 * Build a short status snippet for the card.
 * Prefers current_state.message from the Coder API, falls back to log extraction.
 */
export function buildStatusSnippet(
  agentMessage: string | undefined,
  rawLogs: string | undefined,
  maxChars = 500
): string {
  if (agentMessage) {
    return agentMessage.length > maxChars
      ? agentMessage.slice(0, maxChars - 1) + '…'
      : agentMessage;
  }

  if (rawLogs) {
    return extractLastResponse(rawLogs, maxChars);
  }

  return '';
}
