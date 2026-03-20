/**
 * Converts standard Markdown (as produced by Claude) to Telegram MarkdownV2.
 *
 * MarkdownV2 requires escaping these characters outside formatting:
 *   _ * [ ] ( ) ~ ` > # + - = | { } . !
 *
 * Strategy: process block-level constructs first, then inline formatting,
 * escaping everything else.
 */

import { unwrapParagraphs } from './unwrap-paragraphs.js';

const SPECIAL = /[_*[\]()~`>#+\-=|{}.!\\]/g;

/** Escape all MarkdownV2 special characters in plain text */
function esc(text: string): string {
  return text.replace(SPECIAL, '\\$&');
}

interface CodeBlock {
  lang: string;
  content: string;
}

/**
 * Extract fenced code blocks, replacing them with placeholders.
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

/** Convert inline markdown within a line to MarkdownV2 */
function convertInline(line: string): string {
  // Split by inline code first to avoid escaping inside code spans
  const parts = line.split(/(`[^`]+`)/);
  const result: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('`') && part.endsWith('`')) {
      // Inline code — keep backticks, escape inside for mdv2
      const inner = part.slice(1, -1);
      result.push('`' + inner.replace(/[\\`]/g, '\\$&') + '`');
      continue;
    }

    let s = part;

    // Extract links before escaping
    const links: string[] = [];
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, url: string) => {
      const idx = links.length;
      links.push(`[${esc(text)}](${url.replace(/[)\\]/g, '\\$&')})`);
      return `\0LN${idx}\0`;
    });

    // Bold + italic ***text***
    const boldItalics: string[] = [];
    s = s.replace(/\*{3}(.+?)\*{3}/g, (_m, inner: string) => {
      const idx = boldItalics.length;
      boldItalics.push(`*_${esc(inner)}_*`);
      return `\0BI${idx}\0`;
    });

    // Bold **text**
    const bolds: string[] = [];
    s = s.replace(/\*{2}(.+?)\*{2}/g, (_m, inner: string) => {
      const idx = bolds.length;
      bolds.push(`*${esc(inner)}*`);
      return `\0BD${idx}\0`;
    });

    // Italic *text*
    const italicsStar: string[] = [];
    s = s.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, (_m, inner: string) => {
      const idx = italicsStar.length;
      italicsStar.push(`_${esc(inner)}_`);
      return `\0IS${idx}\0`;
    });

    // Italic _text_
    const italicsUs: string[] = [];
    s = s.replace(/(?<!\w)_(.+?)_(?!\w)/g, (_m, inner: string) => {
      const idx = italicsUs.length;
      italicsUs.push(`_${esc(inner)}_`);
      return `\0IU${idx}\0`;
    });

    // Strikethrough ~~text~~
    const strikes: string[] = [];
    s = s.replace(/~~(.+?)~~/g, (_m, inner: string) => {
      const idx = strikes.length;
      strikes.push(`~${esc(inner)}~`);
      return `\0ST${idx}\0`;
    });

    // Escape the rest
    s = esc(s);

    // Restore placeholders
    s = s.replace(/\0ST(\d+)\0/g, (_m, idx) => strikes[Number(idx)]);
    s = s.replace(/\0IU(\d+)\0/g, (_m, idx) => italicsUs[Number(idx)]);
    s = s.replace(/\0IS(\d+)\0/g, (_m, idx) => italicsStar[Number(idx)]);
    s = s.replace(/\0BD(\d+)\0/g, (_m, idx) => bolds[Number(idx)]);
    s = s.replace(/\0BI(\d+)\0/g, (_m, idx) => boldItalics[Number(idx)]);
    s = s.replace(/\0LN(\d+)\0/g, (_m, idx) => links[Number(idx)]);

    result.push(s);
  }

  return result.join('');
}

/**
 * Convert full Markdown string to Telegram MarkdownV2.
 */
export function markdownToTelegramMdV2(md: string): string {
  if (!md) return '';

  const { text, blocks } = extractCodeBlocks(unwrapParagraphs(md));
  const lines = text.split('\n');
  const result: string[] = [];

  let inBlockquote = false;
  let bqLines: string[] = [];

  const flushBlockquote = () => {
    if (inBlockquote && bqLines.length > 0) {
      // Each line in blockquote must start with >
      result.push(bqLines.map((l) => `>${l}`).join('\n'));
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
      if (block.lang) {
        result.push('```' + block.lang + '\n' + block.content + '\n```');
      } else {
        result.push('```\n' + block.content + '\n```');
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
      result.push(`*${esc(headerMatch[2])}*`);
      continue;
    }

    // Horizontal rules
    if (/^[-*_]{3,}\s*$/.test(line)) {
      result.push('');
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      const indent = ulMatch[1].length > 0 ? '  ' : '';
      result.push(`${indent}• ${convertInline(ulMatch[2])}`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      const indent = olMatch[1].length > 0 ? '  ' : '';
      result.push(`${indent}${olMatch[2]}\\. ${convertInline(olMatch[3])}`);
      continue;
    }

    // Regular line
    result.push(convertInline(line));
  }

  flushBlockquote();
  return result.join('\n');
}
