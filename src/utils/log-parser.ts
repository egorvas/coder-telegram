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
const SEPARATOR_RE = /^[─━]{3,}$|^[╌]{3,}$/; // ─── or ━━━ or ╌╌╌ = separators
const USER_PROMPT_RE = /^❯\s/;           // ❯ = user input
const SYSTEM_RE = /^✻\s/;               // ✻ = system event (compacted, crunched)
const PERMISSION_RE = /^⏵/;             // ⏵⏵ bypass permissions

// Threshold: if ● block is shorter than this, it's likely trivial (e.g. "Updated plan")
const TRIVIAL_THRESHOLD = 100;

/**
 * Returns true if the line is a hard UI boundary (user input, system event, permissions).
 */
function isHardBoundary(trimmed: string): boolean {
  if (USER_PROMPT_RE.test(trimmed)) return true;
  if (SYSTEM_RE.test(trimmed)) return true;
  if (PERMISSION_RE.test(trimmed)) return true;
  return false;
}

/**
 * Returns true if the line is a separator (───, ━━━, ╌╌╌).
 */
function isSeparator(trimmed: string): boolean {
  return SEPARATOR_RE.test(trimmed);
}

/**
 * Collect lines from startIdx forward, stopping at hard boundaries.
 * Separators are skipped (not included) but don't stop collection —
 * only hard boundaries (❯, ✻, ⏵⏵) stop it.
 */
function collectBlock(lines: string[], startIdx: number, stripMarker: boolean): string {
  const result: string[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Hard boundaries always stop collection
    if (i > startIdx && isHardBoundary(trimmed)) break;

    // Skip separators but keep going
    if (isSeparator(trimmed)) continue;

    // Strip ● marker from the first line if requested
    const output = (i === startIdx && stripMarker)
      ? trimmed.replace(ASSISTANT_MARKER, '').trim()
      : line;

    result.push(output);
  }

  return result.join('\n').trim();
}

/**
 * Extract the last assistant response from Claude Code logs.
 *
 * Strategy:
 * 1. Find the last ● marker, collect everything until ❯/✻/⏵⏵
 *    (separators like ─── and ╌╌╌ are skipped, not treated as stop points)
 * 2. If the ● block is trivially short (e.g. "Updated plan"),
 *    it means the real content follows after — like a plan view.
 *    In that case, collect the content that follows the ● block too.
 * 3. If still short, try the previous ● block.
 * 4. Fallback: last non-noise block.
 */
export function extractLastResponse(rawLogs: string): string {
  if (!rawLogs) return '';

  const clean = stripAnsi(rawLogs);
  const lines = clean.split('\n');

  // Find all ● marker positions
  const markers: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (ASSISTANT_MARKER.test(lines[i].trim())) {
      markers.push(i);
    }
  }

  if (markers.length === 0) {
    return extractFallback(lines);
  }

  // Try last ● block — collect everything until hard boundary,
  // skipping separators (so plan content after ─── is included)
  const lastIdx = markers[markers.length - 1];
  const block = collectBlock(lines, lastIdx, true);

  if (block.length >= TRIVIAL_THRESHOLD) {
    return block;
  }

  // Block was trivially short — try previous ● block
  if (markers.length > 1) {
    const prevIdx = markers[markers.length - 2];
    const prevBlock = collectBlock(lines, prevIdx, true);
    if (prevBlock.length > block.length) {
      return prevBlock;
    }
  }

  // Still short — fallback
  if (block.length > 0) return block;
  return extractFallback(lines);
}

/**
 * Fallback: extract last contiguous non-noise block (reverse scan).
 */
function extractFallback(lines: string[]): string {
  const result: string[] = [];
  let foundContent = false;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isHardBoundary(trimmed) || isSeparator(trimmed)) {
      if (foundContent) break;
      continue;
    }

    if (trimmed.length > 0) {
      foundContent = true;
      result.unshift(line);
    } else if (foundContent) {
      result.unshift('');
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
    const full = extractLastResponse(rawLogs);
    if (full.length > maxChars) {
      // Truncate from the top, keep the end
      const cut = full.slice(-maxChars);
      const nl = cut.indexOf('\n');
      return nl > 0 ? '…\n' + cut.slice(nl + 1) : cut;
    }
    return full;
  }

  return '';
}
