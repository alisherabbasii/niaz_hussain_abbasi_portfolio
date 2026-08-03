# Blog Publishing Workflow

**⚠️ This site is frontend-only. Read this before anything else.**

There is no backend, no database, and no CMS. Every post is a Markdown file
in `content/blog/`, compiled directly into the JS bundle at build time. A
new post — or a `draft: false` flip on an existing one — **does not go live
until you rebuild the site (`npm run build`) and re-upload `dist/` to
Hostinger.** Editing a file in this repo, or even pushing it to GitHub,
changes nothing on the live site by itself. If you skip the build-and-deploy
step, the post simply isn't there yet, no matter how long you wait.

---

## 1. Create a post

```bash
npm run blog:new
```

Run with no flags and it prompts you for everything (title, slug, category,
tags, description, whether to scaffold an image folder). Or pass flags to
skip prompts:

```bash
npm run blog:new -- --title="Reading the Ground Before You Trust It" \
  --category="Survey Engineering" --tags="GPS Surveying, Field Work" --assets
```

This creates `content/blog/<slug>.md` with frontmatter and a placeholder
body. It **never overwrites** an existing file — if the slug is taken,
the script stops and tells you so. The post is always created with
`draft: true`.

Prefer a browser to the terminal? `/admin` on the running site (see §9) has
an equivalent form that generates the same Markdown file for you to
download and save into `content/blog/`.

## 2. Add the cover image

Cover images live under `public/blog-images/`, not inside `content/blog/`.
If you passed `--assets` (or answered "yes" to that prompt), `blog:new`
already created `public/blog-images/<slug>/` for you. Drop an image file in
there, then set two frontmatter fields in `content/blog/<slug>.md`:

```yaml
coverImage: "/blog-images/<slug>/cover.jpg"
coverImageAlt: "A short description of the image for screen readers"
```

A cover image is optional, but if you set `coverImage` you **must** also set
`coverImageAlt` — `blog:validate` treats a missing alt text as an error, not
a warning.

## 3. Write Markdown

Edit the body of `content/blog/<slug>.md` below the closing `---`. The site
renders a small Markdown subset:

- `## Heading` and `### Subheading`
- `**bold**` and a line wrapped in `*asterisks*` for an emphasis paragraph
- `- item` / `1. item` lists
- Plain paragraphs

Link to another post on this site with a relative path — `[like this one](/blog/other-post-slug)`
— so `blog:validate` can check the link actually resolves to a real post.

## 4. Preview locally

```bash
npm run dev
```

Open `/blog/<slug>`. In dev mode this route renders **any** post, including
drafts (marked with a visible "Draft" badge) — this is how you check layout,
reading time, and rendering before it's ready for the world. `/blog` (the
index) and a production build never show drafts; this preview path only
exists while `npm run dev` is running.

## 5. Validate

```bash
npm run blog:validate
```

Checks every file in `content/blog/` and exits non-zero if anything is
broken. See §8 for exactly what it checks. Fix every `error:` line — a
`warning:` line is a suggestion (e.g. "no cover image set"), not a blocker.

List everything currently in `content/blog/` (useful for a sanity check
before a release) with:

```bash
npm run blog:list                  # every post, newest first
npm run blog:list -- --draft       # drafts only
npm run blog:list -- --published   # published only
npm run blog:list -- --category="Site Safety"
```

## 6. Change draft to false

Once you're happy with the post, open `content/blog/<slug>.md` and change:

```yaml
draft: true
```

to:

```yaml
draft: false
```

This is a manual, deliberate edit by design — nothing publishes itself
automatically.

## 7. Build

```bash
npm run build
```

Output goes to `dist/`. Run `npm run blog:validate` again first if you
changed anything since step 5 — `build` does not validate content for you.

## 8. Deploy to Hostinger

Full detail (and why the `.htaccess` rewrite rule matters) is in
[`docs/03-DEPLOYMENT.md`](./03-DEPLOYMENT.md). Short version:

1. `npm run build`
2. Upload the **contents** of `dist/` (not the `dist/` folder itself) to the
   Hostinger public root (`public_html/`), keeping `.htaccess` and
   `index.html` alongside `assets/`.

## 9. Verify the live URL

After every deploy, load the new post's real URL directly (typed in the
address bar or a hard refresh — not by clicking a link from an
already-loaded page):

- `https://<your-domain>/blog/<slug>` — the post itself
- `https://<your-domain>/blog` — confirm it appears in the index (if
  published) and that the description/cover image look right
- View source or devtools → confirm the page title, meta description, and
  Open Graph tags reflect the new post (`useSEO` sets these client-side)

## 10. Submit or inspect the URL in Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console)
   for the property.
2. Use the **URL Inspection** tool, paste in the live post URL
   (`https://<your-domain>/blog/<slug>`).
3. If it says "URL is not on Google," click **Request Indexing**.
4. This site is a client-rendered SPA with no server-side rendering — Google
   can index it because it executes JavaScript, but indexing can take
   noticeably longer than for a server-rendered page. Don't expect it to
   appear in search results immediately after requesting indexing.

---

## Reference

### The `/admin` tool

A production-included page at `/admin` provides a browser form for drafting
a post (same fields as `blog:new`), with a live preview and a Markdown
download — useful if you'd rather not use the terminal. It sits behind a
login screen with a **hardcoded username and password** baked into the
built JS (`src/features/admin/auth.ts`).

**This login is not real security.** There's no server to check credentials
against, so the values are readable by anyone who opens devtools or reads
the deployed bundle. It stops a casual visitor from wandering onto the page;
it does not protect anything from someone who actually looks. Treat it the
same way you'd treat an unlisted URL, not a login wall. The page is also
marked `noindex` so search engines won't list it.

Regardless of which tool you use to draft, **the only way a post actually
goes live is `content/blog/<slug>.md` existing in the repo, `draft: false`,
and a rebuild + redeploy** — `/admin` writes nothing to disk or to any
server by itself.

### What `blog:validate` checks

| Check | Severity |
|---|---|
| Required fields present (title, slug, date, content) | error |
| Slug matches its filename and is a valid `lowercase-with-hyphens` slug | error |
| Duplicate slugs across posts | error |
| Date is a real, valid `YYYY-MM-DD` calendar date | error |
| `coverImage` set without `coverImageAlt` | error |
| `tags` isn't an array of non-empty strings, or has a duplicate | error |
| Title over 100 characters / description over 300 characters | error |
| Future-dated post with `draft: false` | error |
| Local `/blog/<slug>` link that doesn't match any real post | error |
| Future-dated post that's still `draft: true` (fine if scheduled ahead) | warning |
| No cover image set | warning |
| Empty description (an excerpt is auto-generated from content, but a hand-written one is better for SEO) | warning |
| Category not in the known list (`src/features/blog/constants.ts`) | warning |

Run `npm run blog:validate -- --strict` to treat warnings as failures too
(useful in CI).

### File layout

```
content/blog/<slug>.md        — the post itself (frontmatter + Markdown body)
public/blog-images/<slug>/    — that post's images (optional)
```

`src/features/blog/content.ts` loads every `content/blog/*.md` file at
build/dev time and normalizes it (`src/features/blog/schema.ts`) into what
the site actually renders. There is nothing else in between — no database,
no API, no build-time CMS fetch.
