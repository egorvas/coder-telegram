/**
 * Joins hard-wrapped lines within paragraphs back into single lines.
 *
 * Claude Code formats terminal output at ~70-80 char width, inserting hard
 * newlines. In code blocks this is fine, but in rich-text (HTML/MarkdownV2)
 * it produces ugly ragged text. This function undoes that wrapping while
 * preserving intentional structure:
 *
 * - Empty lines (paragraph breaks) are kept
 * - Lines starting with markdown block syntax (headers, lists, blockquotes,
 *   code fences, hr) start a new paragraph
 * - Code block content is never touched
 *
 * Used by both HTML and MarkdownV2 converters.
 */

/** Returns true if the line is a "block-level" start that should NOT be joined */
function isBlockStart(line: string): boolean {
  const trimmed = line.trimStart();
  if (trimmed === '') return true;                         // empty line
  if (/^#{1,6}\s/.test(trimmed)) return true;              // header
  if (/^[-*+]\s/.test(trimmed)) return true;               // unordered list
  if (/^\d+[.)]\s/.test(trimmed)) return true;             // ordered list
  if (trimmed.startsWith('> ')) return true;                // blockquote
  if (/^[-*_]{3,}\s*$/.test(trimmed)) return true;         // horizontal rule
  if (/^```/.test(trimmed)) return true;                   // code fence
  if (/^\0CB\d+\0$/.test(trimmed)) return true;            // code block placeholder
  return false;
}

export function unwrapParagraphs(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track fenced code blocks — never unwrap inside them
    if (/^```/.test(line.trimStart())) {
      inCodeFence = !inCodeFence;
      result.push(line);
      continue;
    }
    if (inCodeFence) {
      result.push(line);
      continue;
    }

    // Code block placeholder — pass through
    if (/^\0CB\d+\0$/.test(line.trim())) {
      result.push(line);
      continue;
    }

    // If this line is a block start, always push as new line
    if (isBlockStart(line)) {
      result.push(line);
      continue;
    }

    // Regular continuation line — join to previous if prev was also regular text
    const prev = result.length > 0 ? result[result.length - 1] : '';
    if (
      result.length > 0 &&
      prev.length > 0 &&
      !isBlockStart(prev) &&
      !/^```/.test(prev.trimStart()) &&
      !/^\0CB\d+\0$/.test(prev.trim())
    ) {
      result[result.length - 1] = prev.trimEnd() + ' ' + line.trimStart();
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}
