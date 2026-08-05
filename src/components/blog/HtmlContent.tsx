import { sanitizeHtml } from '../../features/blog/htmlSanitizer';

/**
 * Renders a post's HTML body (as produced by the TipTap admin editor) via
 * `dangerouslySetInnerHTML`, wrapped in a `.prose`-classed container —
 * `TableOfContents` depends on that class being present on an ancestor to
 * find `h2`/`h3` targets.
 *
 * `sanitizeHtml` is defense-in-depth for trusted, admin-authored content
 * (see its docstring in `features/blog/htmlSanitizer.ts`), not a substitute
 * for the server remaining the authoritative boundary on what gets saved.
 */
export default function HtmlContent({ content, className }: { content: string; className?: string }) {
  const classes = ['prose', className].filter(Boolean).join(' ');

  return <div className={classes} dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />;
}
