// Regex covering CSI, OSC, and other ANSI escape sequences
const ANSI_RE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g;

/**
 * Strip ANSI escape sequences from terminal output.
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

// Claude Code UI markers
const ASSISTANT_MARKER = /^●\s*/;        // ● = start of assistant response
const SEPARATOR_RE = /^─{3,}$/;          // ─── = section separator
const USER_PROMPT_RE = /^❯\s/;           // ❯ = user input
const SYSTEM_RE = /^✻\s/;               // ✻ = system event (compacted, crunched)
const PERMISSION_RE = /^⏵/;             // ⏵⏵ bypass permissions
const TOOL_OUTPUT_RE = /^\s*⎿\s*/;       // ⎿ = tool output (indented)

/**
 * Returns true if the line is Claude Code UI chrome (not part of the AI response).
 */
function isUiNoise(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false; // blank lines may be part of response
  if (SEPARATOR_RE.test(trimmed)) return true;
  if (USER_PROMPT_RE.test(trimmed)) return true;
  if (SYSTEM_RE.test(trimmed)) return true;
  if (PERMISSION_RE.test(trimmed)) return true;
  return false;
}

/**
 * Extract the last assistant response (● block) from Claude Code logs.
 *
 * Looks for the last line starting with ● and collects everything
 * until the next separator (───, ❯, ✻, ⏵⏵) or end of input.
 * Tool output lines (⎿) within the response are included.
 */
export function extractLastResponse(rawLogs: string, maxChars = 3500): string {
  if (!rawLogs) return '';

  const clean = stripAnsi(rawLogs);
  const lines = clean.split('\n');

  // Find the last ● marker
  let startIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (ASSISTANT_MARKER.test(lines[i].trim())) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    // No ● found — fall back to last non-noise block
    return extractFallback(lines, maxChars);
  }

  // Collect from ● to the next UI separator/marker
  const result: string[] = [];
  let totalChars = 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Stop at UI noise boundaries (but not at the ● line itself)
    if (i > startIdx && isUiNoise(trimmed)) break;

    // Strip the ● marker from the first line
    const output = i === startIdx ? trimmed.replace(ASSISTANT_MARKER, '').trim() : line;

    const lineLen = output.length + 1;
    if (totalChars + lineLen > maxChars) break;

    result.push(output);
    totalChars += lineLen;
  }

  return result.join('\n').trim();
}

/**
 * Fallback: extract last contiguous non-noise block.
 */
function extractFallback(lines: string[], maxChars: number): string {
  const result: string[] = [];
  let totalChars = 0;
  let foundContent = false;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isUiNoise(trimmed)) {
      if (foundContent) break;
      continue;
    }

    if (trimmed.length > 0) {
      foundContent = true;
      const lineLen = line.length + 1;
      if (totalChars + lineLen > maxChars) break;
      result.unshift(line);
      totalChars += lineLen;
    } else if (foundContent) {
      // Include blank lines within the block
      result.unshift('');
      totalChars += 1;
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
