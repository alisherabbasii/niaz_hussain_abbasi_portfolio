/**
 * Shared styling for rendered post bodies (`HtmlContent`) — used by both the
 * live post page and the admin preview modal so they stay visually
 * identical. Direct-child/descendant Tailwind selectors rather than the
 * `.prose` typography plugin, which isn't installed in this project.
 */
export const ARTICLE_PROSE_CLASSES =
  'max-w-none text-slate-600 ' +
  '[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-primary [&>h2]:mt-10 [&>h2]:mb-4 ' +
  '[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-primary [&>h3]:mt-8 [&>h3]:mb-3 ' +
  '[&>h4]:text-lg [&>h4]:font-bold [&>h4]:text-primary [&>h4]:mt-6 [&>h4]:mb-2 ' +
  '[&>p]:leading-relaxed [&>p]:mb-5 ' +
  '[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul]:space-y-1.5 ' +
  '[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol]:space-y-1.5 ' +
  '[&>blockquote]:border-l-4 [&>blockquote]:border-accent-strong/30 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-500 [&>blockquote]:my-5 ' +
  '[&>hr]:my-8 [&>hr]:border-slate-200 ' +
  '[&_a]:text-accent-strong [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-accent-strong/30 [&_a:hover]:text-accent-strong-dark ' +
  '[&_strong]:text-primary [&_strong]:font-bold ' +
  '[&>p.italic]:text-slate-500 ' +
  '[&>table]:block [&>table]:overflow-x-auto [&>table]:max-w-full [&>table]:my-6 [&>table]:border-collapse ' +
  '[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-primary ' +
  '[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2';
