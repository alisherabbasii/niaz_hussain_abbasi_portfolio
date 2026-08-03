# 11A — Blog Implementation Audit

Audit-only. No code changed. Scope: the current PHP+MySQL blog CRUD stack
(`backend/api/blog/*`, `backend/helpers/Blog.php`, `backend/database/schema.sql`)
and its React consumer (`src/api/*Service.ts`, `src/pages/admin/posts/*`,
`src/pages/blog/*`, `src/features/blog/*`, `src/components/blog/*`).

Two older docs (`BLOG-PUBLISHING-WORKFLOW.md`, `NEXTJS-BLOG-REUSE-AUDIT.md`)
describe a **previous, frontend-only, Markdown-file architecture** (`npm run
blog:new`, `content/blog/*.md`). That architecture is gone — those npm
scripts no longer exist in `package.json`, and nothing in `src/` or
`backend/` reads `content/blog/*.md` anymore. Treat both docs as historical;
they do not describe the system audited here. The seven files under
`content/blog/*.md` are orphaned on disk (see Obsolete, below).

---

## 1. Feature-by-feature status

| Feature | Status | Notes |
|---|---|---|
| Create blog | **Missing** | `backend/api/blog/create.php` is fully implemented and correct. The only UI is `PostEditorPlaceholder.jsx` — no form exists. `/admin/blogs/new` renders "The content editor isn't built yet." |
| Edit blog | **Missing** | Same placeholder component handles `/admin/blogs/:id/edit`; it fetches and displays the target post's title only, no edit form, no save action. |
| Delete blog | **Working** | `PostList.jsx` → `deletePost()` → `DELETE /api/blog/delete.php`, with a confirm dialog. FK cascade removes `blog_post_tags` rows. |
| Save draft | **Working (backend only)** | `draft` boolean → `status` enum is correctly handled in `create.php`/`update.php`. No UI can reach it (no editor). |
| Publish | **Working (backend only)** | Same as above — `draft:false` sets `status='published'` and defaults `published_at` to now if unset. No UI. |
| Future publish date | **Working (backend only)** | `publish_date` accepts any `strtotime`-parseable string, stored verbatim in `published_at` — nothing clamps it to "not in the future" or auto-flips status when the date arrives (that would require a cron/cursor check that doesn't exist; status is a stored enum, not derived). No UI field exists to set it. |
| Featured status | **Partially working** | Backend + `blog_format_post` + admin list ("Featured" pill/filter) all work. No create/edit UI to set it on a new post (only via duplicate, which hardcodes `featured: false`). |
| Cover image | **Broken (end-to-end disconnected)** | `blog_posts.cover_image_path`/`cover_image_alt` exist in schema; `upload/cover.php` uploads and stores a row in `uploads`. But: `create.php`/`update.php` never read or write these two columns, `blog_format_post()` never selects them, `src/api/types.ts` `BlogPost`/`CreateBlogPostInput` have no cover-image fields, and `toDisplayPost()` hardcodes `coverImage: null` with an explaining comment. `BlogCard`, `FeaturedBlogCard`, `BlogPost.jsx` all have working `coverImage` render branches — they just never receive one. The upload endpoint itself works in isolation but has no caller wiring it to a post. |
| Editor images | **Missing** | `upload/editor.php` is fully implemented (validated, re-encoded, stored) but there is no rich-text/editor UI to call it from. Dead endpoint until an editor exists. |
| Categories | **Partially working** | Backend: fully working as a find-or-create side effect of blog create/update (`blog_resolve_category_id`). No standalone `backend/api/categories/*` exists. `src/api/categoryService.ts` calls `/categories/index.php`, `/categories/create.php`, etc. — **all 404, no matching backend files** (`backend/api/` has no `categories/` directory at all). Admin sidebar nav item "Categories" is explicitly disabled ("Soon"). |
| Tags | **Partially working** | Same shape as categories: `blog_sync_tags` works as a create/update side effect; `src/api/tagService.ts` calls `/tags/*.php` endpoints that don't exist on the backend. Sidebar nav "Tags" disabled. |
| Author | **Working** | `blog_resolve_author_id` accepts id/name/email or defaults to the caller; joined and returned as `author_name`/`author`. No UI to override it on create (no editor), but the API contract is solid. |
| Slug uniqueness | **Working** | Enforced at the app layer (`blog_slug_exists`) inside a transaction, and at the DB layer (`slug` is `UNIQUE`, with a `23000` catch mapped to a 409). Both create and update paths covered. |
| SEO title | **Working (backend only)** | Column, validation (200 char cap), and read/write all correct. No UI field. |
| SEO description | **Working (backend only)** | Same as above (400 char cap). No UI field. |
| created_at | **Working** | `DEFAULT CURRENT_TIMESTAMP`, returned unchanged in every response. |
| updated_at | **Working** | `ON UPDATE CURRENT_TIMESTAMP`, returned unchanged. `toDisplayPost()` treats `updated_at === created_at` as "never updated" (maps to `null`) — reasonable given there's no separate "edited" flag in the schema. |
| published_at | **Working** | Set once on first publish, left alone on redraft (update.php only overwrites it if `publish_date` key is explicitly present in the body, or draft flips to published with no date given). |
| admin blog listing | **Working** | `PostList.jsx` — search, status/featured filters, pagination, preview modal, duplicate, delete all call the real API, no mock state. |
| public blog listing | **Working** | `BlogIndex.jsx` — fetches published-only posts (anonymous callers never see drafts, enforced server-side in `index.php`), client-side category/tag/search filtering, empty states. Cover images will show as placeholders only (see Cover image above). |
| public blog details | **Working**, with the same cover-image caveat | `BlogPost.jsx` — `show.php` 404s a draft to anonymous users rather than leaking existence; related posts, prev/next, JSON-LD, TOC, share buttons all functional. |
| HTML sanitization | **N/A / no live risk today, but a latent trap** | There is no `dangerouslySetInnerHTML` anywhere in the render path. `content` is rendered through `parseMarkdownBlocks` (`features/blog/markdown.ts`), a hand-rolled block parser that treats everything that isn't `##`/`###`/`**bold**`/list syntax as plain text — React escapes it, so raw HTML in `content` today just prints as visible text, not markup. This means there is currently **no XSS vector**, because there's also no way to author rich HTML (no editor). `sanitizeHtml()` in the same file is fully implemented and tested but **unused/dead code** — it exists for "the alternate `dangerouslySetInnerHTML`-style pipeline," which was deliberately not adopted. **Risk to flag for 11B:** if a future rich-text editor is wired to store real HTML in `content`, and the renderer is switched to `dangerouslySetInnerHTML` to display it, `sanitizeHtml()`'s current deny-list (script/style/iframe/object/embed/link/meta/base/form + `on*` attrs + `javascript:`/`data:` URLs) is a reasonable baseline but explicitly documented as "not a substitute for a real allow-list sanitizer" — don't ship that pairing without upgrading to DOMPurify or equivalent, and don't assume today's safety carries forward automatically. |
| Markdown remnants | **Obsolete, not wired in** | `src/features/blog/schema.ts` (`normalizeBlogPost`/`normalizeBlogPosts`) and the `BlogPostFrontmatter` type in `types.ts` are the old static-content model's normalization layer. Nothing in the live app calls `normalizeBlogPost` — only its own test file does. `content/blog/*.md` (7 files) and `docs/BLOG-PUBLISHING-WORKFLOW.md`/`NEXTJS-BLOG-MIGRATION-INVENTORY.md`/`NEXTJS-BLOG-REUSE-AUDIT.md` are leftover from that model and no longer describe how the site works. |

---

## 2. API routes actually in use

Confirmed to exist and be wired end-to-end:

- `GET /api/blog/index.php` — list, paginated, filterable (search/category/tag/featured/draft)
- `GET /api/blog/show.php?id=` / `?slug=` — single post
- `POST /api/blog/create.php` — create (session + CSRF required)
- `PUT /api/blog/update.php?id=` — partial update (session + CSRF required)
- `DELETE /api/blog/delete.php?id=` — delete (session + CSRF required)
- `POST /api/upload/cover.php` — image upload, standalone, never linked to a post
- `POST /api/upload/editor.php` — image upload, standalone, no caller in the UI
- `DELETE /api/upload/delete.php?id=` — deletes an `uploads` row + file

Called by the frontend but **do not exist on the backend** (will 404):

- `GET/POST/PUT/DELETE /api/categories/*.php` (`src/api/categoryService.ts`)
- `GET/POST/PUT/DELETE /api/tags/*.php` (`src/api/tagService.ts`)

Both service files carry their own comment acknowledging this ("will 404 until that backend work lands"), so this is documented-known, not a silent trap.

---

## 3. Field-name / shape mismatches

- **Cover image** — `blog_posts.cover_image_path` / `cover_image_alt` exist in the DB but appear in **zero** application-layer contracts: not in `create.php`/`update.php`'s accepted body, not in `blog_format_post()`'s output, not in `src/api/types.ts`. This isn't a naming mismatch — it's a column the whole stack agrees to ignore.
- **`excerpt` vs `description`** — intentional, consistent rename: DB column `description` ↔ API field `excerpt` ↔ display field `description` (`BlogPost.description` in `features/blog/types.ts`). Mapped correctly in `blog_format_post()` and `toDisplayPost()`. Not a bug, just worth naming explicitly since three different names refer to the same value across the stack.
- **`draft` (bool) vs `status` (enum)** — DB stores `status: 'draft'|'published'`; API request/response bodies use `draft: boolean`. Consistently converted both directions in `create.php`/`update.php`/`blog_format_post()`. Not a bug.
- **`publish_date` vs `published_at`** — API field is `publish_date`; DB/response-internal is `published_at`. Consistently mapped. Not a bug.
- **`category`/`tags` as free text vs relational ids** — the API accepts/returns category and tags as plain strings (find-or-create), never exposing `category_id`/`tag_id` to the frontend at all. Consistent, but means the frontend has no way to rename or delete a category/tag without a name-based endpoint that doesn't exist yet (see categories/tags above).

No other response-shape or DB-column mismatches were found — `src/api/types.ts`'s `BlogPost`/`CreateBlogPostInput` line up field-for-field with `blog_format_post()`'s actual output for every field it does expose.

---

## 4. Other findings

- **Missing migrations:** none needed for what's documented — `schema.sql` already has `cover_image_path`/`cover_image_alt` columns; the gap is application code not reading/writing them, not a schema gap. No migration exists (or is needed) for a `categories`/`tags` standalone CRUD API — that's new endpoint work, not a schema change.
- **Unused components:** none found dead in the blog UI component set — every exported component in `src/components/blog/index.js` is referenced somewhere reachable (`BlogSection.jsx` is exported but not currently imported by any page — grep found no usage in `Home.jsx` or elsewhere; low-risk, likely intended for a future homepage teaser section, not urgent).
- **Duplicated services:** none — `src/api/*Service.ts` is a single, non-duplicated layer per resource.
- **Missing validation:**
  - No role-based restriction on blog create/update/delete: any authenticated admin (including `editor` role) can edit or delete *any* post, including ones authored by others. `backend/helpers/Permissions.php` only gates the user-management module (`super_admin`-only) by explicit design — worth a deliberate decision in 11B on whether editors should be scoped to their own posts.
  - No server-side check that a future `publish_date` can't be set alongside `draft:false` immediately publishing it (the "schedule for later, auto-flip to published" behavior implied by "Future publish date" doesn't exist — a future-dated, non-draft post is simply live immediately with a future `published_at` timestamp shown, not queued).
- **Broken routing:** none found — `router.jsx` and `Admin.jsx`'s nested routes all resolve to real components; `/admin/blogs/new` and `/admin/blogs/:id/edit` both resolve, just to the same placeholder.

---

## 5. Report

### 1. Critical blockers
1. **No blog editor exists.** Create and Edit are both `PostEditorPlaceholder.jsx` — this is the single largest gap; almost every other "Missing"/"Partially working" row cascades from it (featured, SEO fields, cover image, publish date all have no input surface even though the backend accepts them).
2. **Cover image is fully disconnected end-to-end** despite every individual piece (schema columns, upload endpoint, frontend render branches) existing in isolation. Needs `create.php`/`update.php` to accept and persist `cover_image_path`/`cover_image_alt`, `blog_format_post()` to return them, and `src/api/types.ts` to expose them.
3. **Categories/Tags standalone API doesn't exist** — `categoryService.ts`/`tagService.ts` call endpoints that 404. Any admin UI for managing categories/tags independently of a post (rename, delete, list-all-for-a-picker) needs `backend/api/categories/*.php` and `backend/api/tags/*.php` built.

### 2. Files that must be fixed first
- `backend/api/blog/create.php`, `backend/api/blog/update.php`, `backend/helpers/Blog.php` (`blog_format_post`) — wire up `cover_image_path`/`cover_image_alt`.
- `src/api/types.ts` — add cover image fields to `BlogPost`/`CreateBlogPostInput`/`UpdateBlogPostInput`.
- `src/features/blog/utils.ts` (`toDisplayPost`) — stop hardcoding `coverImage: null` once the above lands.
- `src/pages/admin/posts/PostEditorPlaceholder.jsx` — replace with a real editor (new file(s), not a patch to this one).
- New: `backend/api/categories/{index,create,update,delete}.php`, `backend/api/tags/{index,create,update,delete}.php` if standalone category/tag management is in scope for 11B.

### 3. Recommended order for Sessions 11B onward
1. Build the real blog editor (create + edit in one form/component), covering every field the backend already supports: title, slug (with regenerate-from-title), excerpt, content, category, tags, featured, draft/publish toggle, publish date, SEO title/description.
2. Wire cover image upload into that editor and close the backend gap (`cover_image_path`/`cover_image_alt` end-to-end).
3. Wire editor-image upload (`upload/editor.php`) into whatever content input the editor uses (plain textarea, or a real rich-text/WYSIWYG component — decide this before writing sanitization code, since the choice determines whether `sanitizeHtml()` needs to become load-bearing).
4. Build standalone categories/tags CRUD endpoints + admin screens (sidebar already has the nav slots, currently disabled).
5. Decide and implement the future-publish-date semantics (either a scheduled-publish cron/cursor, or explicitly document that "future date" is cosmetic-only today).
6. Revisit role scoping for blog CRUD (should `editor` be restricted to their own posts?) as a deliberate decision, not a default.

### 4. Existing code that should be reused
- All of `backend/api/blog/*.php` + `backend/helpers/Blog.php` — correct, secure (parameterized queries, transactions, proper 409/422 handling), and should be extended in place (add cover-image fields), not rewritten.
- `backend/helpers/Upload.php` + both `upload/*.php` endpoints — solid validation/re-encoding pipeline (real MIME sniffing, GD re-encode strips embedded payloads, random filenames, path-traversal guard). Reuse as-is; just add the caller that links a returned URL back onto a post.
- `src/pages/admin/posts/PostList.jsx`, `ConfirmDialog.jsx`, `PostPreviewModal.jsx` — fully working, no changes needed.
- `src/api/blogService.ts`, `client.ts`, `uploadService.ts` — correct CSRF/session handling, reuse as-is.
- `src/components/blog/*` (`BlogCard`, `FeaturedBlogCard`, `BlogGrid`, `BlogMeta`, `CategoryBadge`, `TagList`, `TableOfContents`, `ShareButtons`, `MarkdownContent`) — all functional, all should stay; `MarkdownContent`'s block parser is fine to keep **as long as** the editor decision in step 3 above doesn't introduce raw HTML content without revisiting this component.

### 5. Existing code that should eventually be removed
- `content/blog/*.md` (7 files) — orphaned, nothing reads them anymore.
- `docs/BLOG-PUBLISHING-WORKFLOW.md`, `docs/NEXTJS-BLOG-MIGRATION-INVENTORY.md`, `docs/NEXTJS-BLOG-REUSE-AUDIT.md` — describe a superseded architecture; keep only as historical record if wanted, otherwise delete to stop misleading future readers.
- `src/features/blog/schema.ts`, `src/features/blog/__tests__/schema.test.ts`, the `BlogPostFrontmatter` type in `src/features/blog/types.ts` — dead normalization layer for the old Markdown-frontmatter model, unused outside its own test.
- `src/features/blog/markdown.ts`'s `sanitizeHtml()` (+ its test) — dead code today; either delete until it's actually needed, or keep deliberately with a comment tying it to the specific future decision it's waiting on (do not let it sit as "looks load-bearing but isn't").
- `dist/assets/BlogIndex-*.js`, `dist/assets/BlogPost-*.js`, `dist/assets/blogService-*.js` — stale build output from a previous build; not source, will be regenerated, just noting they don't reflect current source until the next `npm run build`.
