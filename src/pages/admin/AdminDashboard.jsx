import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Download, LogOut, RotateCcw } from 'lucide-react';
import { Container, PageSection, Badge, Input, Textarea, Button } from '../../components/ui';
import { CategoryBadge, BlogMeta, TagList, MarkdownContent } from '../../components/blog';
import { normalizeBlogPost } from '../../features/blog/schema';
import { generateSlug } from '../../features/blog/utils';
import { KNOWN_BLOG_CATEGORIES } from '../../features/blog/constants';
import { useDocumentTitle } from '../../utils/useDocumentTitle';

/** Same rendering classes `BlogPost.jsx` applies to `MarkdownContent`, duplicated here
 * so the preview matches the live article pixel-for-pixel without importing a page file. */
const ARTICLE_CLASSES =
  'max-w-none text-slate-600 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-primary [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-primary [&>h3]:mt-8 [&>h3]:mb-3 [&>p]:leading-relaxed [&>p]:mb-5 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol]:space-y-1.5 [&_strong]:text-primary [&_strong]:font-bold [&>p.italic]:text-slate-500';

const TODAY = new Date().toISOString().slice(0, 10);

const INITIAL_FIELDS = {
  title: '',
  slug: '',
  description: '',
  category: '',
  tags: '',
  date: TODAY,
  author: 'Niaz Hussain Abbasi',
  coverImage: '',
  coverImageAlt: '',
  featured: false,
  draft: true,
  content: '',
};

/** JSON string-literal escaping doubles as valid frontmatter flow-scalar quoting
 * (the same convention `scripts/blog/lib/frontmatter.mjs` parses on the other end). */
function yamlString(value) {
  return JSON.stringify(value ?? '');
}

/** Builds a standalone `.md` file: frontmatter matching `content/blog/*.md`'s
 * convention, then the body. */
function buildMarkdownFile(fields, tags) {
  const lines = ['---'];
  lines.push(`title: ${yamlString(fields.title)}`);
  lines.push(`slug: ${yamlString(fields.slug)}`);
  lines.push(`description: ${yamlString(fields.description)}`);
  lines.push(`date: ${yamlString(fields.date)}`);
  lines.push(`author: ${yamlString(fields.author)}`);
  lines.push(`category: ${yamlString(fields.category)}`);
  lines.push(`tags: ${JSON.stringify(tags)}`);
  lines.push(`featured: ${Boolean(fields.featured)}`);
  lines.push(`draft: ${Boolean(fields.draft)}`);
  if (fields.coverImage) lines.push(`coverImage: ${yamlString(fields.coverImage)}`);
  if (fields.coverImageAlt) lines.push(`coverImageAlt: ${yamlString(fields.coverImageAlt)}`);
  lines.push('---', '', fields.content ?? '');
  return lines.join('\n');
}

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mt-1 h-4 w-4 rounded border-slate-300 text-accent-strong focus:ring-2 focus:ring-accent/40"
    />
    <span>
      <span className="block text-sm font-bold text-primary">{label}</span>
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </span>
  </label>
);

/**
 * Production-included content-drafting tool, gated behind the login screen in
 * `Admin.jsx`. It still doesn't publish anything by itself: generate the
 * Markdown file here, download it, commit it into `content/blog/`, then
 * follow the rest of docs/BLOG-PUBLISHING-WORKFLOW.md (validate, flip draft
 * to false, build, deploy). There is no filesystem write and no network call
 * from this page — the download is the only output.
 */
export default function AdminDashboard({ onLock }) {
  useDocumentTitle('Admin — Blog');

  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [slugTouched, setSlugTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (patch) => setFields((current) => ({ ...current, ...patch }));

  const handleTitleChange = (e) => {
    const title = e.target.value;
    update({ title, ...(!slugTouched && { slug: generateSlug(title) }) });
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    update({ slug: e.target.value });
  };

  const handleReset = () => {
    setFields(INITIAL_FIELDS);
    setSlugTouched(false);
  };

  const tags = useMemo(
    () => fields.tags.split(',').map((t) => t.trim()).filter(Boolean),
    [fields.tags]
  );

  const validation = useMemo(
    () =>
      normalizeBlogPost({
        title: fields.title,
        slug: fields.slug,
        description: fields.description,
        content: fields.content,
        date: fields.date,
        author: fields.author,
        category: fields.category,
        tags,
        coverImage: fields.coverImage || undefined,
        coverImageAlt: fields.coverImageAlt || undefined,
        featured: fields.featured,
        draft: fields.draft,
      }),
    [fields, tags]
  );

  const markdownFile = useMemo(() => buildMarkdownFile(fields, tags), [fields, tags]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownFile);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context); download still works.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownFile], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fields.slug || 'untitled-post'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageSection>
      <Container className="max-w-6xl">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">Blog Admin</h1>
            <Badge variant="warning" size="sm">No backend</Badge>
          </div>
          <Button variant="outline" size="sm" icon={LogOut} onClick={onLock}>
            Log out
          </Button>
        </div>
        <p className="text-slate-500 font-light mb-6 max-w-2xl">
          Draft a post and generate its Markdown file. Nothing on this page saves anything on its
          own — copy or download the output, then follow the steps below.
        </p>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3 mb-10">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">This does not publish anything.</p>
            <p className="mt-1 text-amber-800">
              This site has no backend, database, or real login — posts are Markdown files in{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded">content/blog/</code>. Download the file below,
              save it as <code className="bg-amber-100 px-1 py-0.5 rounded">content/blog/&#123;slug&#125;.md</code>,
              then run <code className="bg-amber-100 px-1 py-0.5 rounded">npm run blog:validate</code>, commit, and
              rebuild + redeploy. See{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded">docs/BLOG-PUBLISHING-WORKFLOW.md</code> for the full
              sequence. A cover image path must point at a file placed under{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded">public/blog-images/</code> — this tool never
              uploads or writes files anywhere.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-primary">Details</h2>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>

              <Input label="Title" value={fields.title} onChange={handleTitleChange} placeholder="E.g. Reading the Ground Before You Trust It" />
              <Input
                label="URL Slug"
                value={fields.slug}
                onChange={handleSlugChange}
                hint="Auto-generated from the title until you edit it directly."
              />
              <Textarea
                label="Description / Excerpt"
                value={fields.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={3}
                placeholder="A one or two sentence summary for the blog index and SEO metadata."
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Category"
                  list="admin-category-suggestions"
                  value={fields.category}
                  onChange={(e) => update({ category: e.target.value })}
                  placeholder="E.g. Survey Engineering"
                />
                <datalist id="admin-category-suggestions">
                  {KNOWN_BLOG_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <Input
                  label="Publish Date"
                  type="date"
                  value={fields.date}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </div>

              <Input
                label="Tags"
                value={fields.tags}
                onChange={(e) => update({ tags: e.target.value })}
                placeholder="Comma separated, e.g. GPS Surveying, Field Work"
              />

              <Input label="Author" value={fields.author} onChange={(e) => update({ author: e.target.value })} />

              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Cover Image Path"
                  value={fields.coverImage}
                  onChange={(e) => update({ coverImage: e.target.value })}
                  placeholder="/blog-images/example-slug/cover.jpg"
                  hint="A relative path to a file you place under public/blog-images/ — not an upload."
                />
                {fields.coverImage && (
                  <Input
                    label="Cover Image Alt Text"
                    value={fields.coverImageAlt}
                    onChange={(e) => update({ coverImageAlt: e.target.value })}
                    placeholder="Describe the image for screen readers"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-100">
                <Toggle
                  label="Featured"
                  hint="Shows in the homepage highlights"
                  checked={fields.featured}
                  onChange={(e) => update({ featured: e.target.checked })}
                />
                <Toggle
                  label="Draft"
                  hint="Excluded from /blog until turned off"
                  checked={fields.draft}
                  onChange={(e) => update({ draft: e.target.checked })}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <h2 className="font-bold text-primary mb-4">Content (Markdown)</h2>
              <textarea
                value={fields.content}
                onChange={(e) => update({ content: e.target.value })}
                rows={16}
                placeholder={'## A heading\n\nA paragraph with **bold** text.\n\n- A bullet point\n- Another one'}
                className="w-full font-mono text-sm leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4 resize-y text-slate-700 focus:ring-2 focus:ring-accent/30 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-2">
                Supports the same small Markdown subset the live site renders: ## / ### headings, **bold**,
                - / 1. lists, and *emphasis* paragraphs.
              </p>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-6">
            {!validation.valid && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-bold text-rose-700 mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} /> Not ready yet
                </p>
                <ul className="text-sm text-rose-700 list-disc pl-5 space-y-1">
                  {validation.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-primary text-sm">content/blog/{fields.slug || '{slug}'}.md</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Frontmatter + body — save this into content/blog/.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent/10 text-accent-strong hover:bg-accent/20 transition-colors"
                  >
                    <Download size={13} />
                    Download
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={markdownFile}
                rows={12}
                className="w-full font-mono text-xs leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3 resize-y text-slate-700"
              />
            </div>

            {validation.valid && validation.data && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-4">Preview</p>
                <CategoryBadge category={validation.data.category} />
                <h2 className="text-2xl font-extrabold text-primary mt-4 mb-3 leading-snug">
                  {validation.data.title}
                </h2>
                <p className="text-slate-500 font-light leading-relaxed mb-5">{validation.data.description}</p>
                <BlogMeta post={validation.data} className="mb-6" />

                {validation.data.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 mb-8">
                    <img
                      src={validation.data.coverImage}
                      alt={validation.data.coverImageAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <MarkdownContent content={validation.data.content} className={ARTICLE_CLASSES} />

                {validation.data.tags.length > 0 && <TagList tags={validation.data.tags} className="mt-6" />}

                {validation.data.draft && (
                  <div className="mt-8">
                    <Badge variant="warning" size="sm">Draft — hidden from /blog</Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </PageSection>
  );
}
