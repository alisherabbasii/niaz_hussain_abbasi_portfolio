/**
 * Framework-neutral Markdown block parsing and HTML sanitization.
 *
 * `parseMarkdownBlocks` recognizes the same small token set the previous
 * Next.js `BlogPostClient` renderer supported (h2/h3 headings, bold/italic,
 * ordered/unordered lists, paragraphs) but returns a plain data structure
 * instead of JSX, so any UI layer (React, or none at all) can render it.
 *
 * `sanitizeHtml` is a deny-list baseline for the alternate
 * `dangerouslySetInnerHTML`-style content pipeline flagged in the migration
 * audit — it strips script-bearing tags, inline event handlers, and
 * javascript:/data:text/html URLs. It is defense-in-depth for trusted,
 * hand-authored content, not a substitute for a real allow-list sanitizer
 * (e.g. DOMPurify) if content provenance ever becomes untrusted.
 */

export type InlineToken = { type: 'text'; value: string } | { type: 'bold'; value: string };

export type MarkdownBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; inline: InlineToken[] }
  | { type: 'emphasisParagraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] };

/** Splits a line of text into plain-text and `**bold**` tokens. */
export function parseInlineTokens(text: string): InlineToken[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { type: 'bold', value: part.slice(2, -2) }
        : { type: 'text', value: part }
    );
}

/** Parses a Markdown-like string into an ordered list of structured blocks. */
export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let listBuffer: string[] = [];
  let listOrdered = false;
  let inList = false;

  const flushList = () => {
    if (inList && listBuffer.length > 0) {
      blocks.push({ type: 'list', ordered: listOrdered, items: listBuffer });
    }
    listBuffer = [];
    inList = false;
  };

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (orderedMatch) {
      if (inList && !listOrdered) flushList();
      inList = true;
      listOrdered = true;
      listBuffer.push(orderedMatch[1] ?? '');
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inList && listOrdered) flushList();
      inList = true;
      listOrdered = false;
      listBuffer.push(trimmed.slice(2));
      continue;
    }

    flushList();

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: trimmed.slice(4) });
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: trimmed.slice(3) });
      continue;
    }

    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      blocks.push({ type: 'emphasisParagraph', text: trimmed.slice(1, -1) });
      continue;
    }

    blocks.push({ type: 'paragraph', inline: parseInlineTokens(trimmed) });
  }

  flushList();
  return blocks;
}

/** Tags removed wholesale (opening tag, contents, and closing tag). */
export const SANITIZE_DENYLIST_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form'];

const DANGEROUS_ATTRIBUTE_PATTERN = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URL_PATTERN = /(href|src)(\s*=\s*)(["'])\s*(javascript:|data:text\/html)[^"']*\3/gi;

/**
 * Strips the highest-risk XSS vectors from an HTML string: script/style/
 * iframe/object/embed/link/meta/base/form elements, inline `on*` event
 * handler attributes, and `javascript:`/`data:text/html` URLs in `href`/`src`.
 * Safe to run on trusted content as a baseline; not a full allow-list sanitizer.
 */
export function sanitizeHtml(html: string): string {
  let out = html;

  for (const tag of SANITIZE_DENYLIST_TAGS) {
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
    out = out.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }

  out = out.replace(DANGEROUS_ATTRIBUTE_PATTERN, '');
  out = out.replace(DANGEROUS_URL_PATTERN, (_match, attr, eq, quote) => `${attr}${eq}${quote}#${quote}`);

  return out;
}
