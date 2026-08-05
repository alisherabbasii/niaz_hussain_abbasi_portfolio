# Blog Migration Inventory — Markdown workflow removal

Closing record for removing the leftover static-Markdown blog workflow now
that the database-backed CMS (`backend/api/blog/*.php` + `blog_posts` table,
consumed via `src/api/blogService.ts`) is live for both admin and public
pages. See `docs/11A-BLOG-IMPLEMENTATION-AUDIT.md` for the audit that first
flagged these remnants as dead, and `docs/01-CMS-ARCHITECTURE.md` for the
original migration plan.

## Confirmed working before removal

Verified end-to-end against the live PHP+MySQL backend (local dev, not
against the read-only checks alone):

- Admin create post — `POST /api/blog/create.php` via `PostForm.jsx`
- Admin edit post — `PUT /api/blog/update.php` via `PostForm.jsx`
- Admin publish post (draft → published) — same endpoint, `draft` flag
- Public listing loads API posts — `BlogIndex.jsx` → `listPosts()`
- Public article loads API post — `BlogPost.jsx` → `getPostBySlug()`
- No active route depends on Markdown — `src/app/router.jsx` has no
  Markdown-backed route; no file under `src/` or `backend/` reads
  `content/blog*/*.md`

## Code removed

| Item | Status | Notes |
|---|---|---|
| `src/features/blog/markdown.ts` — `parseMarkdownBlocks`, `parseInlineTokens`, `MarkdownBlock`, `InlineToken` | **Removed** | The hand-rolled Markdown-subset block parser/renderer for the old static-content pipeline. Nothing called it outside its own test. |
| `src/features/blog/schema.ts` — `normalizeBlogPost`, `normalizeBlogPosts` | **Removed** | Frontmatter validation/normalization layer for the old "author a `.md` file, validate it, commit it" workflow. Confirmed dead in the 11A audit and re-confirmed by grep before deletion — only its own test file called it. |
| `src/features/blog/types.ts` — `BlogPostFrontmatter`, `ValidationResult<T>`, `BlogDraftStatus` | **Removed** | Existed only to support `schema.ts`. `BlogPost` (the normalized, API-driven type) is retained — still used throughout `components/blog`, `pages/blog`, `pages/admin`. |
| `docs/BLOG-PUBLISHING-WORKFLOW.md` | **Removed** | Described the removed `npm run blog:new`/`blog:validate`/`blog:list` scripts (already gone from `package.json`), the "frontend-only, no backend, no database" framing, and the Markdown-file-download `/admin` tool — all factually wrong now. History preserved in `docs/11A-BLOG-IMPLEMENTATION-AUDIT.md` and `docs/01-CMS-ARCHITECTURE.md`. |

## Code retained (still load-bearing)

| Item | Status | Notes |
|---|---|---|
| `sanitizeHtml()` | **Retained**, moved to `src/features/blog/htmlSanitizer.ts` | Actively used by `src/components/blog/HtmlContent.tsx` to sanitize the TipTap-authored HTML `content` field before `dangerouslySetInnerHTML`. Not dead code — the 11A audit's "unused/dead code" note for this function predates the TipTap editor and `HtmlContent.tsx` being wired up. Renamed from `markdown.ts` since the file no longer contains any Markdown parsing. |
| `src/features/blog/__tests__/markdown.test.ts` | **Renamed**, → `htmlSanitizer.test.ts` | Kept only the `sanitizeHtml` test cases; dropped the `parseMarkdownBlocks`/`parseInlineTokens` cases along with the code they tested. |
| `BlogPost` type (`types.ts`) | **Retained** | Normalized display model, produced by `toDisplayPost()` in `utils.ts` from the API response shape. Still the type every blog display component is built against. |
| No admin route, hook, or service was found still generating a `.md` file for download, or presenting "no backend"/"this does not publish anything" copy — that flow (and `src/pages/dev/BlogAuthor.jsx`, the local-authoring route referenced in `docs/01-CMS-ARCHITECTURE.md`) was already gone before this pass; confirmed by grep, nothing left to remove. | — | — |

## Archived, not deleted

`content/blog/*.md` (7 files) contained real, previously-published article
bodies — deleting them outright would have silently lost that writing, since
none of the 7 slugs exist in the live `blog_posts` table (confirmed by
querying the database directly). Moved to `content/blog-archive/` instead
(see `content/blog-archive/README.md`):

| File | Title | Category | Was published (`draft: false`)? | In `blog_posts` table? |
|---|---|---|---|---|
| `civil-3d-and-autocad-tools-that-save-time.md` | Civil 3D and AutoCAD: Tools That Actually Save Time on Site | Survey Engineering | Yes | No |
| `coordinating-teams-across-remote-project-sites.md` | Coordinating Teams Across Remote Project Sites | Leadership | Yes | No |
| `from-civil-supervisor-to-survey-engineer.md` | From Civil Supervisor to Survey Engineer: A Career Reflection | Leadership | Yes | No |
| `mountain-blasting-zero-incident-safety-record.md` | Mountain Blasting: A Zero-Incident Safety Record, Explained | Site Safety | Yes | No |
| `notes-on-gps-base-station-calibration.md` | Notes on GPS Base Station Calibration | Survey Engineering | No (was still a draft) | No |
| `surveying-rocky-terrain-lessons.md` | Surveying Rocky Terrain: Lessons from Ten Years in the Field | Survey Engineering | Yes | No |
| `why-document-control-is-the-backbone.md` | Why Document Control Is the Backbone of Every Project | Document Control | Yes | No |

## Still required

- **Manual re-publishing decision**: the 6 previously-published articles
  above are not live anywhere right now (they weren't live under the old
  build either, since that architecture required a rebuild+redeploy that
  evidently never shipped these into the current `dist/`, and they were
  never migrated into the database). If they should go live, an admin needs
  to recreate each one through `/admin/blogs/new` — there is no automated
  Markdown→database importer, and building one wasn't in scope for this
  cleanup pass.
- No package removal was needed: `package.json` has no Markdown-parsing
  dependency (`marked`, `remark`, `gray-matter`, etc. were never installed)
  — confirmed by inspection.
