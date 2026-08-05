/**
 * Deny-list baseline sanitizer for the `dangerouslySetInnerHTML` blog
 * content pipeline (see `components/blog/HtmlContent.tsx`) — strips
 * script-bearing tags, inline event handlers, and javascript:/data:text/html
 * URLs. Defense-in-depth for admin-authored content saved through the
 * TipTap editor, not a substitute for a real allow-list sanitizer (e.g.
 * DOMPurify) if content provenance ever becomes untrusted.
 */

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
