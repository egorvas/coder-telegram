/**
 * Converts standard Markdown (as produced by Claude) to Telegram-compatible HTML.
 *
 * Telegram HTML supports: <b>, <i>, <u>, <s>, <code>, <pre>, <a>, <blockquote>.
 * Unsupported constructs (images, tables, horizontal rules) are passed through as text.
 */

import { unwrapParagraphs } from './unwrap-paragraphs.js';

/** Escape characters that are special in HTML */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface CodeBlock {
  lang: string;
  content: string;
}

/**
 * First pass: extract fenced code blocks so inline rules don't touch them.
 * Replaces each block with a placeholder \0CBn\0 and returns the blocks separately.
 */
function extractCodeBlocks(md: string): { text: string; blocks: CodeBlock[] } {
  const blocks: CodeBlock[] = [];
  const text = md.replace(/^```(\w*)\n([\s\S]*?)^```$/gm, (_m, lang: string, content: string) => {
    const idx = blocks.length;
    blocks.push({ lang, content: content.replace(/\n$/, '') });
    return `\0CB${idx}\0`;
  });
  return { text, blocks };
}

/** Convert a single line of markdown (outside code blocks) to HTML */
function convertInline(line: string): string {
  let s = esc(line);

  // Bold + italic ***text*** or ___text___
  s = s.replace(/\*{3}(.+?)\*{3}/g, '<b><i>$1</i></b>');

  // Bold **text**
  s = s.replace(/\*{2}(.+?)\*{2}/g, '<b>$1</b>');

  // Italic *text* (but not inside words like file*name)
  s = s.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '<i>$1</i>');

  // Italic _text_ (not inside words like snake_case)
  s = s.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<i>$1</i>');

  // Strikethrough ~~text~~
  s = s.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Inline code `text`
  s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');

  // Links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return s;
}

/**
 * Convert full Markdown string to Telegram HTML.
 */
export function markdownToTelegramHtml(md: string): string {
  if (!md) return '';

  const { text, blocks } = extractCodeBlocks(unwrapParagraphs(md));
  const lines = text.split('\n');
  const result: string[] = [];

  let inBlockquote = false;
  let bqLines: string[] = [];

  const flushBlockquote = () => {
    if (inBlockquote && bqLines.length > 0) {
      result.push(`<blockquote>${bqLines.join('\n')}</blockquote>`);
      bqLines = [];
      inBlockquote = false;
    }
  };

  for (const line of lines) {
    // Code block placeholder
    const cbMatch = line.match(/^\0CB(\d+)\0$/);
    if (cbMatch) {
      flushBlockquote();
      const block = blocks[Number(cbMatch[1])];
      const escaped = esc(block.content);
      if (block.lang) {
        result.push(`<pre><code class="language-${block.lang}">${escaped}</code></pre>`);
      } else {
        result.push(`<pre>${escaped}</pre>`);
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      inBlockquote = true;
      bqLines.push(convertInline(line.slice(2)));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Headers → bold
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      result.push(`<b>${convertInline(headerMatch[2])}</b>`);
      continue;
    }

    // Horizontal rules → skip
    if (/^[-*_]{3,}\s*$/.test(line)) {
      result.push('');
      continue;
    }

    // Unordered list items: preserve bullet
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      const indent = ulMatch[1].length > 0 ? '  ' : '';
      result.push(`${indent}• ${convertInline(ulMatch[2])}`);
      continue;
    }

    // Ordered list items: preserve number
    const olMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      const indent = olMatch[1].length > 0 ? '  ' : '';
      result.push(`${indent}${olMatch[2]}. ${convertInline(olMatch[3])}`);
      continue;
    }

    // Regular line
    result.push(convertInline(line));
  }

  flushBlockquote();

  return result.join('\n');
}
