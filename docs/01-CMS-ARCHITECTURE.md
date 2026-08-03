# CMS Architecture & Migration Plan

**Status:** Planning document. No code has been changed as part of producing this
file — it is a read-only analysis of the repository as it exists today
(`git log` head: `3273774 removal of unwanted files`), plus a proposed plan to
replace the current frontend-only Markdown blog with a real PHP + MySQL CMS.

**Scope of the ask:** turn `/admin` into a lightweight WordPress-style CMS —
multi-user login, full post CRUD with draft/publish, cover + inline image
upload, categories, tags, featured posts, per-post SEO fields, search,
pagination — running on PHP 8+ / MySQL / Apache (Hostinger shared hosting),
with **no Node backend and no Next.js**. The public site must show newly
published posts immediately, without a rebuild.

---

## 1. Current Architecture

### 1.1 Stack (as deployed today)

- **Frontend:** React 19 + React Router 7 + Tailwind CSS 4, built with Vite 8. Fully client-rendered SPA, no SSR/prerendering.
- **Backend:** **none.** There is no PHP, no database, no server-side code anywhere in this repository. `PHP 8+` / `MySQL` in the stated "current stack" describes what Hostinger's hosting *supports*, not something already built.
- **Hosting:** Hostinger shared Apache hosting. `npm run build` → `dist/` is uploaded verbatim to `public_html/`. `public/.htaccess` (copied into `dist/` by Vite) provides SPA-fallback rewriting so direct loads of `/blog/:slug` etc. don't 404 (`docs/03-DEPLOYMENT.md`).
- **Content storage:** Markdown files with YAML-ish frontmatter, committed to the repo at `content/blog/*.md` (7 posts today).

### 1.2 Blog content pipeline (build-time, static)

```
content/blog/*.md
   → src/features/blog/frontmatter.ts   (hand-rolled frontmatter/body split)
   → src/features/blog/schema.ts        (normalizeBlogPost: validation + defaults)
   → src/features/blog/content.ts       (import.meta.glob(..., { eager: true }) — inlines
                                          every .md file's raw text into the JS bundle
                                          at build/dev time)
   → src/pages/blog/BlogIndex.jsx / BlogPost.jsx (render from the in-memory array)
```

Key facts:
- `import.meta.glob('/content/blog/*.md', { eager: true })` means **every post's full text ships inside the JS bundle**, loaded once at build time. There is no runtime fetch, no API, no database.
- `getPublishedPosts()` / `getPostBySlug()` filter `draft: false` posts client-side, from that same in-memory array — never a network call.
- Rendering uses a small hand-rolled Markdown-subset parser (`src/features/blog/markdown.ts`): `##`/`###` headings, `**bold**`, `*emphasis paragraph*`, `-`/`1.` lists, plain paragraphs. Not a full Markdown implementation (no tables, code blocks, nested lists, links-as-syntax beyond what's hand-parsed).
- `scripts/blog/*.mjs` (`blog:new`, `blog:validate`, `blog:list`) are Node CLI tools that operate on the same `content/blog/*.md` files on disk, duplicating `frontmatter.ts`'s parsing logic in plain JS (`scripts/blog/lib/frontmatter.mjs`) so they can run without a TS loader.
- **Publishing a post requires: edit/create the `.md` file → flip `draft: false` → `npm run build` → re-upload `dist/` to Hostinger.** This is the single biggest gap against the new requirement ("public website should automatically show newly published blogs without rebuilding").

### 1.3 Current admin implementation

`/admin` (`src/pages/admin/Admin.jsx` → `AdminLogin.jsx` / `AdminDashboard.jsx`) is **not a CMS** — it's a Markdown-file *generator*:

- `src/features/admin/auth.ts` gates it with a **hardcoded username/password compared client-side**, unlocked state stored in `localStorage`. The credentials ship in the public JS bundle, readable by anyone via devtools or by viewing the deployed bundle source. The code's own comments and `docs/BLOG-PUBLISHING-WORKFLOW.md` are explicit that this is *"not real security... a casual-visitor deterrent, nothing more."*
- `AdminDashboard.jsx` is a form that builds frontmatter + body into a `.md` string in memory, previews it using the same renderer the public site uses, and lets the user **copy or download** the file. It performs **no filesystem write, no network call, no persistence of any kind.** The human must manually save the download into `content/blog/`, run `npm run blog:validate`, commit, `npm run build`, and re-upload.
- There is no edit-existing-post flow (the form only creates new drafts from scratch), no delete, no multi-user concept, no real image upload (`coverImage` is a manually-typed relative path to a file the author places under `public/blog-images/` by hand), and no search/pagination in the admin.
- This is the direct, deliberate replacement for an earlier, much more dangerous version of this idea: `docs/NEXTJS-BLOG-REUSE-AUDIT.md` documents that this project once had files copied from an old Next.js project (`api/admin/login/route.ts`, `AdminLogin.tsx`, `BlogEditor.tsx`, etc.) implementing exactly the kind of real backend this task now asks to build — those files were audited, found critically unsafe as copied (plaintext credential comparison, unauthenticated upload/delete routes), and **fully deleted** (commit `1ed6d40`) rather than wired up. That audit and inventory are the closest thing this repo has to prior art for this migration and are worth reading in full before building the new backend (`docs/NEXTJS-BLOG-REUSE-AUDIT.md`, `docs/NEXTJS-BLOG-MIGRATION-INVENTORY.md`).

### 1.4 Blog routes

Defined in `src/app/router.jsx`, nested under `<SiteLayout />`:

| Path | Component | Notes |
|---|---|---|
| `/blog` | `BlogIndex.jsx` (lazy) | search (`?q=`), category/tag filter (`?category=`, `?tag=`), featured post, card grid — all client-side over the full in-memory `publishedPosts` array. No pagination; every published post is always in the DOM/bundle. |
| `/blog/:slug` | `BlogPost.jsx` (lazy) | Renders one post; in `import.meta.env.DEV` only, draft posts are also viewable at their real URL (`getAnyPostBySlug`) for local preview — production builds only ever resolve published posts. |
| `/admin` | `Admin.jsx` (lazy) | Ships in production, marked `noindex, nofollow` via an injected `<meta>` tag, not linked from nav, not in any sitemap/robots file (neither exists yet). |

No `/blog/page/:n`-style route exists; pagination is not implemented anywhere, admin or public.

### 1.5 Authentication implementation

There is exactly one "auth" mechanism in the whole codebase: `src/features/admin/auth.ts`, described in §1.3. There is no session, no cookie, no token, no server round-trip, no password hashing, no rate limiting, no user table — because there is no backend at all. It cannot be partially reused; it needs to be replaced wholesale.

### 1.6 SEO implementation

`src/utils/useSEO.js` is a single shared hook, used by `BlogIndex.jsx`, `BlogPost.jsx`, and presumably other pages: on mount it creates `<title>`, `<meta name="description">`, canonical `<link>`, Open Graph (`og:*`), Twitter Card (`twitter:*`), and optional JSON-LD `<script type="application/ld+json">` tags, then removes them on unmount.

- `BlogPost.jsx` builds two JSON-LD blocks per post: `BlogPosting` (headline, description, image, datePublished, dateModified, author, keywords) and `BreadcrumbList`.
- **This is entirely client-side, post-hydration.** Since this is a pure SPA with no SSR/prerendering, any crawler that doesn't execute JavaScript (most social-media link-preview bots, some minimal crawlers) sees a generic `index.html` with none of these tags. Google's crawler does execute JS so it eventually sees the right tags, but indexing is slower than a server-rendered equivalent. This limitation is called out explicitly in the hook's own comments and is **unchanged by the currently-completed migration work** — it will still apply after the CMS backend exists, unless addressed (see §9).
- No `robots.txt` or `sitemap.xml` exists anywhere in `public/` or `dist/` today — both are referenced as "not yet built" in `docs/01-WEBSITE-AUDIT-AND-ROADMAP.md` and `docs/03-DEPLOYMENT.md`.
- Per-post SEO title/description today are simply the post's `title`/`description` frontmatter fields — there's no *separate* SEO-specific title/description field distinct from the display title, which the new requirements explicitly ask for.

### 1.7 Everything else relevant

- **Data model source of truth today:** `src/features/blog/types.ts` (`BlogPostFrontmatter` raw/legacy shape, `BlogPost` normalized shape) and `src/features/blog/schema.ts` (`normalizeBlogPost` — required-field + slug + date validation, defaulting). These are good references for the new DB schema's field list even though the storage mechanism changes completely.
- **Rendering:** `src/components/blog/MarkdownContent.tsx` renders the custom block AST from `markdown.ts`. `src/features/blog/markdown.ts` also exports `sanitizeHtml()`, a deny-list HTML sanitizer explicitly built as "defense-in-depth for trusted, hand-authored content, not a substitute for a real allow-list sanitizer... if content provenance ever becomes untrusted" — which is exactly what happens once a rich-text editor and a real admin write path exist. This is a load-bearing warning for §6.
- **Presentational components** (`BlogCard`, `BlogGrid`, `BlogMeta`, `CategoryBadge`, `TagList`, `FeaturedBlogCard`, `TableOfContents`, `ShareButtons`, `BlogEmptyState`, `BlogSection`) are all content-source-agnostic — they take normalized post objects as props and don't care whether those came from a static import or an API call.
- **`tsconfig.json`** currently only type-checks `src/features/blog/**/*.ts`, `src/features/admin/**/*.ts`, `src/components/blog/**/*.tsx` — the rest of the app is plain JS/JSX.
- **No `@` path alias, no `next/*` imports, no server-only env vars anywhere** — confirmed clean by the prior audit and still true.

---

## 2. Problems

Ordered roughly by severity for the stated goal:

1. **No backend exists.** `PHP 8+` / `MySQL` in the brief describes hosting capability, not implemented functionality — this is a from-scratch backend build, not a refactor.
2. **Publishing requires a full rebuild + redeploy.** Directly contradicts the new hard requirement ("public website should automatically show newly published blogs without rebuilding React"). The entire content pipeline (`import.meta.glob(..., { eager: true })`) is architected around content being known at build time.
3. **The admin login is not authentication.** Hardcoded credentials shipped in the public JS bundle, comparable in the browser, no server to validate against. Must be deleted, not extended.
4. **No real write path.** `AdminDashboard.jsx` cannot create, edit, or delete a post — it generates a file for a human to save and commit by hand. No multi-user support is possible without a backend.
5. **No image upload.** Cover images are manually placed files referenced by hand-typed relative path; there is no upload endpoint, and TipTap-in-editor image upload doesn't exist at all (no rich-text editor exists yet either — the "editor" is a plain `<textarea>`).
6. **Content is Markdown-subset text, not HTML — a rich-text editor changes the storage format.** Introducing TipTap means the natural output is HTML (or TipTap's JSON doc format), not this project's hand-rolled Markdown subset. This is a storage-format decision the migration must make explicitly (§4, §9) — silently keeping `markdown.ts` around while also adding TipTap would create two competing, half-supported content formats, repeating a documented mistake from the old Next.js code (`docs/NEXTJS-BLOG-REUSE-AUDIT.md` §2, `blog/[slug]/page.tsx` vs `BlogPostClient.tsx`).
7. **No categories/tags data model — they're just free-text strings on each post,** deduplicated client-side at render time (`BlogIndex.jsx`: `[...new Set(publishedPosts.map(p => p.category))]`). "Manage categories/tags" as first-class admin-manageable entities needs real tables.
8. **No pagination anywhere.** Every published post is always fully loaded (today: in the JS bundle; after the migration, this needs to become a real paginated API, or the "no rebuild" requirement just relocates the scaling problem from build time to page-load time).
9. **No search backend.** Today's search is an in-memory `.includes()` filter over already-loaded posts. Fine at 7 posts; becomes a real "search blogs" requirement (server-side, presumably `LIKE`/`FULLTEXT`) once posts live in a database and aren't all loaded client-side.
10. **`sanitizeHtml()` is explicitly not safe for untrusted content**, and once a rich-text editor writes HTML that a database stores and the public site renders, content provenance changes from "hand-authored, code-reviewed via PR" to "typed into a browser form by whichever admin is logged in." This needs a real allow-list sanitizer, applied server-side (§6, §7).
11. **SEO is 100% client-side with no SSR**, a pre-existing limitation, not introduced by this migration — but worth deciding whether to improve it now that a PHP layer exists to help (§9), since the brief adds distinct SEO Title/Description fields that imply this now matters more.
12. **No `robots.txt`/`sitemap.xml`.** Not blocking for this task, but a sitemap that reflects live DB content (rather than being hand-maintained) becomes easy to add once there's a backend that knows the true list of published posts — worth scoping in or explicitly deferring.

---

## 3. Migration Plan

Phased so the site is never broken mid-migration and the old static path keeps working until the new one is verified end-to-end (see §8 Rollback Plan for how these phases interact with go-live).

### Phase 0 — Preparation
- Confirm Hostinger plan details: PHP version (must be ≥ 8.1 for modern `password_hash`/enum ergonomics), PDO MySQL extension availability, `mod_rewrite`, file upload limits in `php.ini` (`upload_max_filesize`, `post_max_size`), whether shell/Composer access exists or dependencies must be vendored manually.
- Create the MySQL database + a dedicated least-privilege DB user (not the cPanel/root account) via Hostinger's control panel.
- Tag the current commit (e.g. `pre-cms-migration`) so there's an instant, unambiguous revert point.

### Phase 1 — Database + backend skeleton
- Create schema (§4) via versioned SQL migration files.
- Stand up the PHP backend (§5, §6 folder layout) as a REST API, deployed alongside (not replacing) the existing static `dist/` output, at a path like `public_html/api/`.
- No frontend changes yet. Verify the API in isolation (curl/Postman) against the new DB.

### Phase 2 — Authentication
- Implement real session-based login/logout (§7), a seeded first admin user, password hashing.
- Build the new `AdminLogin` UI against the real `/api/auth/login` endpoint. Old `src/features/admin/auth.ts` gate stays in place and functional until this is fully verified — don't delete it yet.

### Phase 3 — Admin CMS UI
- Replace `AdminDashboard.jsx`'s "generate a file to download" flow with real CRUD screens: post list (search + pagination + status filter), post editor (TipTap), categories manager, tags manager, user manager.
- Wire cover-image and in-editor image upload to the new upload endpoints (§9).
- At this point the admin can fully manage posts in the database, but the **public site still reads from the old static `content/blog/*.md` pipeline** — the two are deliberately decoupled so admin work can be tested without touching what's live.

### Phase 4 — Public site cutover
- Replace `src/features/blog/content.ts`'s `import.meta.glob` static loader with an API client (`fetch('/api/posts?...')`), and rework `BlogIndex.jsx`/`BlogPost.jsx` to fetch at runtime (loading/error states, pagination) instead of reading a build-time array.
- This is the change that actually satisfies "public website should automatically show newly published blogs without rebuilding React" — everything before this phase is invisible to end users.
- Deploy behind a feature check (e.g. a query-param or staging subdomain) if possible, so it can be verified against production data before it's the only path.

### Phase 5 — Content migration
- One-time script (reusing `scripts/blog/lib/frontmatter.mjs` + `posts.mjs`'s parsing logic, or a PHP equivalent) reads all 7 files in `content/blog/*.md`, converts each Markdown body to HTML (needed because the new storage format is TipTap-compatible HTML — see §9 for the conversion approach), and inserts them into `blog_posts` with their existing slugs, dates, categories, tags, and `featured`/`draft` flags preserved exactly.
- Script must be **idempotent and non-destructive**: safe to re-run, never deletes `content/blog/*.md` itself (see §8).
- Manually spot-check every migrated post's rendered output against its current live page before considering this phase done.

### Phase 6 — Verification & go-live
- Full smoke test against production data: login, create/edit/publish/unpublish/delete a real test post, upload a cover image and an in-editor image, confirm the public `/blog` and `/blog/:slug` pages reflect changes with **no rebuild** (just refresh), confirm search/pagination/category/tag filtering all work against the API.
- Confirm old `/blog` and `/blog/:slug` behavior (SEO tags, JSON-LD, related posts, prev/next nav, share buttons, table of contents) is unchanged from a visitor's perspective — this migration should be invisible to the public except that publishing no longer needs a deploy.

### Phase 7 — Cleanup
- Only after Phase 6 is confirmed stable in production for an agreed soak period: remove the files listed in §10 ("Files to remove"), update `docs/BLOG-PUBLISHING-WORKFLOW.md` (or replace it with a new CMS usage doc), remove the now-dead `blog:new`/`blog:validate`/`blog:list` npm scripts (or repurpose `blog:validate` as a one-off migration-verification tool, since its checks are still a useful reference for server-side validation rules).

---

## 4. Database Design

MySQL (MyISAM not needed; InnoDB throughout for FK support + row locking). All tables `utf8mb4`.

```sql
-- Admins (multi-user, as required)
CREATE TABLE admin_users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120)        NOT NULL,
  email           VARCHAR(190)        NOT NULL UNIQUE,
  password_hash   VARCHAR(255)        NOT NULL,   -- password_hash(), Argon2id or bcrypt
  role            ENUM('owner','admin') NOT NULL DEFAULT 'admin',
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  last_login_at   DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Categories (first-class, replacing free-text strings)
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tags (first-class, many-to-many with posts)
CREATE TABLE tags (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL UNIQUE,
  slug        VARCHAR(80)  NOT NULL UNIQUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Posts
CREATE TABLE blog_posts (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200)    NOT NULL,
  slug              VARCHAR(220)    NOT NULL UNIQUE,
  description       VARCHAR(400)    NOT NULL DEFAULT '',   -- public excerpt / listing summary
  content           LONGTEXT        NOT NULL,               -- sanitized HTML from TipTap
  cover_image_path  VARCHAR(500)    NULL,
  cover_image_alt   VARCHAR(300)    NULL,
  category_id       INT UNSIGNED    NULL,
  author_id         INT UNSIGNED    NOT NULL,
  status            ENUM('draft','published') NOT NULL DEFAULT 'draft',
  featured          TINYINT(1)      NOT NULL DEFAULT 0,
  seo_title         VARCHAR(200)    NULL,                   -- falls back to `title` if null
  seo_description   VARCHAR(400)    NULL,                   -- falls back to `description` if null
  published_at      DATETIME        NULL,                   -- set on first publish; drives public sort order
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_posts_author   FOREIGN KEY (author_id)   REFERENCES admin_users(id) ON DELETE RESTRICT,

  INDEX idx_posts_status_published (status, published_at),
  INDEX idx_posts_featured (featured, status, published_at),
  INDEX idx_posts_category (category_id),
  FULLTEXT INDEX ft_posts_search (title, description, content)
) ENGINE=InnoDB;

-- Post <-> Tag (many-to-many)
CREATE TABLE post_tags (
  post_id  INT UNSIGNED NOT NULL,
  tag_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_pt_post FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)       ON DELETE CASCADE
) ENGINE=InnoDB;

-- Uploaded media (cover images + in-editor TipTap images)
CREATE TABLE media (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  disk_path     VARCHAR(500)  NOT NULL,     -- server-relative storage path
  public_url    VARCHAR(500)  NOT NULL,     -- what gets embedded in content/cover fields
  original_name VARCHAR(255)  NOT NULL,
  mime_type     VARCHAR(100)  NOT NULL,
  size_bytes    INT UNSIGNED  NOT NULL,
  width         INT UNSIGNED  NULL,
  height        INT UNSIGNED  NULL,
  uploaded_by   INT UNSIGNED  NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_uploader FOREIGN KEY (uploaded_by) REFERENCES admin_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Login rate-limiting / lockout
CREATE TABLE login_attempts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(190) NOT NULL,
  ip_address   VARCHAR(45)  NOT NULL,       -- IPv4/IPv6
  success      TINYINT(1)   NOT NULL,
  attempted_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts_lookup (email, attempted_at),
  INDEX idx_login_attempts_ip (ip_address, attempted_at)
) ENGINE=InnoDB;

-- Optional but recommended: admin action audit trail
CREATE TABLE audit_log (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT UNSIGNED NULL,
  action      VARCHAR(60)  NOT NULL,   -- e.g. 'post.publish', 'post.delete', 'user.create'
  entity_type VARCHAR(40)  NOT NULL,
  entity_id   INT UNSIGNED NULL,
  meta_json   JSON NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
```

Notes:
- PHP native sessions are file-based by default and don't need a DB table; only add a `sessions` table if session storage is later moved into MySQL (e.g. for load-balanced hosting — not a concern on a single Hostinger shared account).
- `published_at` is deliberately separate from `created_at`/`updated_at` so "Publish Date" (set once, on first publish) and "Updated Date" (bumped on every save) map directly to the two explicitly required fields, and so an unpublish-then-republish doesn't lose the original publish date unless that's an intentional editorial action.
- `FULLTEXT` on `(title, description, content)` gives "Search blogs" a real server-side implementation via `MATCH ... AGAINST` instead of a `LIKE '%term%'` full-table scan.

---

## 5. API Design

**Base path recommendation:** same-origin, e.g. `https://niazabbasi.com/api/...` (a subdirectory the existing `.htaccess` can special-case), **not** a separate subdomain. Same-origin avoids CORS configuration and lets the session cookie be issued without cross-site cookie complications (`SameSite=Lax` works fine same-origin; a separate subdomain would force `SameSite=None; Secure` and a CORS allow-list for no real benefit here).

All responses JSON. All admin (state-changing or draft-visible) endpoints require an authenticated session; all public endpoints only ever return `status = 'published'` rows.

### Public (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/posts` | Paginated published posts. Query params: `page`, `pageSize`, `q` (search), `category`, `tag`. |
| GET | `/api/posts/{slug}` | Single published post by slug (404 if draft/missing). |
| GET | `/api/posts/featured` | Featured published posts (small, fixed limit). |
| GET | `/api/categories` | All categories with published-post counts. |
| GET | `/api/tags` | All tags with published-post counts. |

### Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` → sets session cookie. Rate-limited (§7). |
| POST | `/api/auth/logout` | Destroys session. |
| GET | `/api/auth/me` | Current session's admin user, or 401. |

### Admin — posts (auth required)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/posts` | All posts (any status), paginated, filterable by status/category/tag/search. |
| GET | `/api/admin/posts/{id}` | One post, full fields, for the editor. |
| POST | `/api/admin/posts` | Create (defaults to `status: draft`). |
| PUT | `/api/admin/posts/{id}` | Update fields. |
| DELETE | `/api/admin/posts/{id}` | Delete. |
| POST | `/api/admin/posts/{id}/publish` | Sets `status = published`, sets `published_at` if it was null. |
| POST | `/api/admin/posts/{id}/unpublish` | Sets `status = draft`, leaves `published_at` untouched (so republishing doesn't imply "new"). |

### Admin — taxonomy & media

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/admin/categories` | List / create. |
| PUT/DELETE | `/api/admin/categories/{id}` | Rename / delete (delete blocked or reassigns posts to null — decide per editorial preference). |
| GET/POST | `/api/admin/tags` | List / create. |
| DELETE | `/api/admin/tags/{id}` | Delete (cascades via `post_tags`). |
| POST | `/api/admin/uploads/cover` | Multipart upload → `{ url, mediaId }`, used for a post's cover image. |
| POST | `/api/admin/uploads/image` | Multipart upload → `{ url }`, TipTap's image-upload callback target. |

### Admin — users

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/users` | List admins. |
| POST | `/api/admin/users` | Create new admin (owner-role only, or all admins — decide per how "manage multiple admin users" should be scoped). |
| PUT | `/api/admin/users/{id}` | Update name/email/role/active. |
| PUT | `/api/admin/users/{id}/password` | Change password (self, or owner resetting another admin's). |
| DELETE | `/api/admin/users/{id}` | Deactivate/delete (block deleting the last remaining active admin). |

Every admin mutation should be wrapped in the `audit_log` insert described in §4.

---

## 6. Folder Structure

Proposed layout — a new `backend/` source tree (PHP), deployed alongside the existing Vite frontend build. Nothing in `src/` moves; the split is additive.

```
backend/
  public/                     # actual PHP webroot uploaded to public_html/api/
    index.php                 # front controller — all requests routed through here
    .htaccess                 # rewrite everything to index.php; deny direct .php access elsewhere
  src/
    Config/
      Database.php            # PDO connection factory, reads env vars
      Env.php                 # .env loader
    Router.php                # minimal method+path router, no framework dependency
    Middleware/
      AuthMiddleware.php      # session check, attaches current admin to request
      CsrfMiddleware.php
      RateLimitMiddleware.php # backs the login_attempts table
    Controllers/
      AuthController.php
      PostController.php
      CategoryController.php
      TagController.php
      UserController.php
      UploadController.php
    Models/
      Post.php
      Category.php
      Tag.php
      AdminUser.php
      Media.php
    Services/
      SlugService.php         # mirrors src/features/blog/utils.ts's generateSlug() rules
      HtmlSanitizerService.php# allow-list sanitizer for TipTap HTML (see §9)
      ImageUploadService.php  # validation, re-encoding, storage
      AuditLogger.php
  migrations/
    001_create_admin_users.sql
    002_create_categories.sql
    003_create_tags.sql
    004_create_blog_posts.sql
    005_create_post_tags.sql
    006_create_media.sql
    007_create_login_attempts.sql
    008_create_audit_log.sql
  .env.example
  composer.json                # only if Composer is available on the host; otherwise vendor manually

uploads/                       # actual file storage, gitignored; served as /uploads/* by Apache,
                                # with PHP execution explicitly disabled inside via .htaccess

content/blog/*.md               # KEPT after migration as the historical/rollback source (see §8),
                                 # no longer read by the running app once Phase 4/5 land

src/
  features/
    blog/
      api.ts                   # NEW — fetch client replacing content.ts's static loader
      constants.ts              # kept
      utils.ts                  # kept (client-side helpers: formatDate, slug generation, etc.)
      schema.ts                 # kept, repurposed as client-side form validation in the editor
      types.ts                  # kept, extended with API response shapes (id, status, seoTitle, ...)
      content.ts                 # REMOVED — see §10
      frontmatter.ts              # REMOVED from the app; logic reused one-off in the migration script
      markdown.ts                 # REMOVED — content is HTML from TipTap, not this Markdown subset
    admin/
      api.ts                    # NEW — authenticated fetch client (credentials: 'include', CSRF header)
      AuthContext.jsx            # NEW — session state (current user, login/logout), replaces auth.ts
      auth.ts                     # REMOVED — see §10
  components/
    blog/                       # unchanged: TableOfContents, ShareButtons, TagList, CategoryBadge, etc.
    admin/                      # NEW
      PostEditor/
        TiptapEditor.jsx         # NEW — the rich-text editor + image-upload wiring
        SeoFieldsPanel.jsx
        TaxonomyPicker.jsx
      PostTable.jsx              # NEW — admin post list with search/pagination/status filter
      AdminLayout.jsx            # NEW — sidebar shell for logged-in admin screens
  pages/
    admin/
      Admin.jsx                  # kept, rewritten: session check via /api/auth/me instead of localStorage
      AdminLogin.jsx              # kept, rewritten: posts to /api/auth/login
      AdminDashboard.jsx          # REMOVED — split into the pages below
      posts/
        AdminPostList.jsx         # NEW
        AdminPostEditor.jsx       # NEW (create + edit, same component, id param optional)
      users/
        AdminUserList.jsx         # NEW
      taxonomy/
        AdminCategories.jsx       # NEW
        AdminTags.jsx              # NEW
    blog/
      BlogIndex.jsx                # kept, rewritten to fetch from the API + paginate
      BlogPost.jsx                  # kept, rewritten to fetch by slug from the API
```

---

## 7. Security Strategy

1. **Password storage:** `password_hash()` (Argon2id if the host's PHP build supports it, else bcrypt), never anything reversible. Verify with `password_verify()`, never a manual comparison.
2. **SQL:** exclusively PDO prepared statements with bound parameters everywhere, no string-concatenated queries — this is non-negotiable given the prior audit's explicit warning about the old code's *"plaintext credential comparison... no hashing, no rate limiting, no lockout."* We are not repeating that.
3. **Sessions:** PHP native sessions, cookie flags `HttpOnly`, `Secure` (HTTPS-only), `SameSite=Lax`. Regenerate the session ID on login (`session_regenerate_id(true)`) to prevent fixation. Reasonable idle timeout (e.g. 2 hours), sliding on activity.
4. **CSRF:** synchronizer token (or double-submit cookie) required on every state-changing admin request, since session cookies are used. `GET` requests stay side-effect-free.
5. **Rate limiting / lockout:** `login_attempts` table backs a per-email and per-IP limit (e.g. lock after 5 failures in 15 minutes) on `/api/auth/login`. Return a generic "invalid credentials" message either way — never reveal whether the email exists.
6. **Rich-text content is untrusted input the moment it leaves the browser.** TipTap's HTML output must be run through a real server-side allow-list sanitizer (e.g. HTML Purifier for PHP) on every save — allow a specific tag/attribute set (`p, h2-h4, strong, em, ul/ol/li, a[href], img[src,alt], blockquote, code, pre`), strip everything else, strip `on*` handlers and `javascript:`/`data:text/html` URLs. This directly replaces `sanitizeHtml()` in `markdown.ts`, which its own comment already flags as insufficient for untrusted content — that's exactly the situation a multi-admin CMS creates.
7. **File uploads:** validate the real MIME type server-side via `finfo`, not the client-supplied `Content-Type`; allow-list extensions (`jpg`, `jpeg`, `png`, `webp`, `gif`); enforce a max size; re-encode raster images through GD/Imagick (strips embedded scripts/EXIF payloads and normalizes format); generate randomized filenames (never trust the original filename); store under `uploads/`, served as static files with **PHP execution explicitly disabled** in that directory via `.htaccess` (`php_flag engine off` / `RemoveHandler .php`), so an uploaded file can never be executed as a script even if a validation gap is ever found.
8. **Output encoding:** React escapes text content by default; the only place raw HTML is rendered is the sanitized post `content` field — confine `dangerouslySetInnerHTML` to exactly that one component, fed only by server-sanitized data, never by anything else.
9. **Secrets:** DB credentials, session secret, etc. live in a `.env` file **outside** `public_html/` if the hosting layout allows it, or protected by an `.htaccess deny from all` rule if it must live inside the webroot. Never committed — add `.env` to `.gitignore` immediately when it's introduced, and keep `.env.example` (no real values) as the template.
10. **Least privilege:** the MySQL user the app connects as gets only `SELECT, INSERT, UPDATE, DELETE` on the app's own database — no `DROP`/`ALTER`/`GRANT`, no access to other databases on the shared account.
11. **Error handling:** production responses never leak stack traces or raw DB error text; log details server-side (a file outside the webroot), return generic error JSON to the client.
12. **Security headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (or `DENY`), `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` scoped to this site's own origin plus whatever is actually needed (no third-party script origins should be needed for this app).
13. **HTTPS enforced** end to end — redirect HTTP → HTTPS at the `.htaccess` level, consider HSTS once confirmed stable.
14. **Audit trail:** every create/update/delete/publish/unpublish and every user-management action writes an `audit_log` row (admin id, action, entity, timestamp) — cheap insurance for "who did this and when" once more than one admin exists.

---

## 8. Upload Strategy

Two upload surfaces, same underlying service (`ImageUploadService.php`):

- **Cover image** — one per post, uploaded via the post editor, stored and referenced by `blog_posts.cover_image_path` / `media.id`.
- **In-editor (TipTap) images** — uploaded inline while writing the body; TipTap's image extension calls an upload callback that hits `POST /api/admin/uploads/image` and inserts the returned URL into the document as an `<img>` node.

Both routes:
1. Require an authenticated admin session (same auth middleware as every other admin route — the old Next.js reference code's upload route was flagged as critical-risk specifically because it had **no auth check of its own**; this must not be repeated).
2. Validate real MIME type + extension + size server-side.
3. Re-encode through GD/Imagick to a known-safe output (strips any embedded payload, normalizes to JPEG/PNG/WebP), optionally capping max dimensions (e.g. don't accept a 6000px-wide upload verbatim — resize down).
4. Store under `uploads/blog/{yyyy}/{mm}/{random-filename}.{ext}`, insert a `media` row, return its public URL.
5. Never allow the client to specify the storage path or filename.

Storage location stays local disk on Hostinger (no S3/Vercel Blob — matches the "no external Node/serverless dependency" constraint); this is a straightforward fit for shared hosting and keeps the whole stack to PHP + MySQL + local filesystem as required.

---

## 9. Authentication Strategy

Session-cookie based (not JWT-in-localStorage), because:
- Same-origin deployment (§5) means CSRF is the only real cookie-auth risk, and that's directly mitigated (§7.4).
- JWTs stored in `localStorage` are readable by any XSS on the page — a strictly worse position for a CMS that now renders admin-authored rich text, however well-sanitized. httpOnly cookies aren't readable by JS at all.
- PHP's native session handling is simple, well-understood, and needs no extra dependency on shared hosting.

Flow:
1. `POST /api/auth/login { email, password }` → look up `admin_users` by email, `password_verify()`, check `is_active`, check rate limit (§7.5). On success: `session_regenerate_id(true)`, store admin id in `$_SESSION`, update `last_login_at`, insert `login_attempts` row (`success = 1`).
2. Every subsequent admin request carries the session cookie automatically (`fetch(..., { credentials: 'include' })` on the frontend); `AuthMiddleware` loads the admin from `$_SESSION` or returns 401.
3. `POST /api/auth/logout` → `session_destroy()`, clear the cookie.
4. `GET /api/auth/me` → the frontend's `AuthContext` calls this on app load to determine whether to render `AdminLogin` or the CMS shell (replacing today's `isUnlocked()` `localStorage` check).
5. Multi-user: any `admin_users` row can log in; `role` distinguishes `owner` (can manage other admins) from `admin` (can manage content only) — adjust the exact permission split to taste, but keep at least one role boundary around user-management endpints so a compromised `admin` account can't create new admins.

Out of scope for the initial build (call out explicitly so it's a deliberate deferral, not an oversight): password-reset-via-email (needs outbound mail configured on Hostinger), 2FA. Both are reasonable follow-ups once the core CRUD/auth is stable.

---

## 10. Rollback Plan

The current static site has one major advantage worth preserving through the migration: it cannot go down from a backend failure, because it has no backend. The plan below is designed to keep that property until the new system has *earned* trust.

1. **Tag before starting** (`pre-cms-migration`), so `git checkout` to that point plus a `dist/` rebuild is always an available, fast, total revert.
2. **Additive phases (§3 Phase 1–3)** stand up the backend and admin CMS without touching what the public site reads from. If anything goes wrong here, the live site is simply unaffected — there's nothing to roll back.
3. **Phase 4 (public cutover) is the only genuinely risky step.** Deploy it in a way that's reversible in minutes: keep the previous `dist/` build artifact archived before uploading the new one, so restoring the old static-Markdown site is "re-upload the old `dist/`," not "revert code and rebuild under pressure."
4. **`content/blog/*.md` is never deleted as part of this migration** — it stays in the repo as the authoritative historical export even after the DB becomes the live source of truth. If the database is ever lost or corrupted, these files plus the migration script (§3 Phase 5) are how content gets rebuilt.
5. **Database backups**: establish a `mysqldump` backup (Hostinger cron job or manual pre-deploy habit) before Phase 5's data migration runs, and on a recurring schedule afterward. Test the restore path at least once before go-live — a backup that's never been restored isn't a verified backup.
6. **Soak period**: don't delete any of the §10-below "files to remove" until Phase 6 has been stable in production through real usage (at minimum: one full publish cycle done by the actual site owner, not just an automated smoke test).
7. **Feature-level fallback within Phase 4**, if feasible: gate the new fetch-based `BlogIndex`/`BlogPost` behind an easy-to-flip switch (env var read at build time is fine here — it doesn't reintroduce the "needs rebuild to publish a post" problem, it's just a temporary migration toggle) so a bad backend deploy can fall back to static rendering without a code revert.

---

## Definition of Done

- [ ] Admin can log in and out against a real backend session (no client-side hardcoded credentials anywhere in the repo or bundle).
- [ ] Multiple admin users can be created, edited, deactivated; passwords are hashed, never logged or returned by any API response.
- [ ] Full post CRUD: create, edit, delete, save as draft, publish, unpublish — all persisted in MySQL, all requiring authentication.
- [ ] Cover image upload and in-editor (TipTap) image upload both work, are validated and re-encoded server-side, and require auth.
- [ ] Categories and tags are manageable as first-class entities (not free text) and assignable per post.
- [ ] Featured-post flag works and drives the homepage/blog-index featured section.
- [ ] Per-post SEO Title and SEO Description fields exist, are editable, and are used by `useSEO`/JSON-LD in place of falling back to the display title/description when set.
- [ ] Publish Date and Updated Date are both tracked and displayed, with the semantics in §4 (publish date fixed on first publish, update date bumping on every save).
- [ ] Public `/blog` search and pagination are implemented against the API (not an in-memory `.filter()` over a fully-loaded array).
- [ ] Publishing (or unpublishing, editing, deleting) a post is visible on the public site on next page load — **no `npm run build` / redeploy required.**
- [ ] All admin endpoints reject unauthenticated requests; all public endpoints only ever return `published` posts.
- [ ] SQL exclusively via prepared statements; no string-concatenated queries anywhere.
- [ ] Rich-text HTML is sanitized server-side with an allow-list sanitizer before storage.
- [ ] File uploads are type/size-validated, re-encoded, randomly named, and served from a directory with PHP execution disabled.
- [ ] CSRF protection is in place on all state-changing admin requests; session cookies are `HttpOnly`/`Secure`/`SameSite`.
- [ ] Login is rate-limited/lockout-protected.
- [ ] All 7 existing posts are migrated with matching slugs, dates, categories, tags, and content, verified by manual comparison against their current live rendering.
- [ ] `docs/BLOG-PUBLISHING-WORKFLOW.md` is replaced or rewritten to describe the new CMS workflow; the old "download a Markdown file and commit it" instructions are removed.
- [ ] The files listed below under "Files to remove" are deleted, and the repository has no remaining references to the old `localStorage`-gated admin or the build-time Markdown pipeline.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all pass on the final state.
- [ ] Rollback plan (§8) has been dry-run at least once (restore a DB backup; confirm the archived pre-cutover `dist/` build still serves correctly).

---

## Files to remove

*(only after Phase 6 verification per the Rollback Plan — not immediately)*

- `src/features/admin/auth.ts` — hardcoded client-side "auth," replaced by real sessions.
- `src/pages/admin/AdminDashboard.jsx` — Markdown-file generator, replaced by the real CRUD post editor.
- `src/features/blog/content.ts` — build-time static Markdown loader, replaced by the API client.
- `src/features/blog/frontmatter.ts` — no longer needed by the running app once content lives in the DB (its logic is reused once, standalone, by the Phase 5 migration script).
- `src/features/blog/markdown.ts` — the custom Markdown-subset parser/renderer and its `sanitizeHtml()`; superseded by TipTap-authored, server-sanitized HTML and a real allow-list sanitizer.
- `scripts/blog/*.mjs` and `scripts/blog/lib/*.mjs` (`blog:new`, `blog:validate`, `blog:list`) — CLI tools built around the file-based workflow; `blog:validate`'s *rules* are a good reference for server-side validation but the scripts themselves stop being relevant once posts aren't files.
- `docs/BLOG-PUBLISHING-WORKFLOW.md` — describes the exact workflow being replaced; rewrite as a new CMS usage doc rather than leaving it as stale/misleading documentation.

**Not removed:** `content/blog/*.md` stays permanently as a historical/rollback export (§8) — do not delete these files even after cleanup.

## Files to refactor

- `src/pages/blog/BlogIndex.jsx` — swap the static `getPublishedPosts()` import for a paginated API fetch; add loading/error states.
- `src/pages/blog/BlogPost.jsx` — swap `getPostBySlug`/`getAnyPostBySlug` for a fetch-by-slug call; add loading/error states.
- `src/app/router.jsx` — add nested admin routes (post list, post editor, users, categories, tags) under `/admin`.
- `src/pages/admin/Admin.jsx` — session-check gate via `/api/auth/me` instead of the `localStorage` flag.
- `src/pages/admin/AdminLogin.jsx` — post credentials to `/api/auth/login` instead of comparing client-side constants.
- `src/utils/useSEO.js` — no structural change needed, but callers now pass DB-sourced `seoTitle`/`seoDescription` with fallback to `title`/`description`.
- `src/components/blog/MarkdownContent.tsx` — repurpose (or replace) as a sanitized-HTML renderer for TipTap-authored content instead of the custom block AST.
- `tsconfig.json` — extend `include` to cover the new admin/CMS TypeScript surface (`api.ts` clients, etc.) as those land.
- `package.json` — add TipTap dependencies (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, plus any others the editor needs); remove or repurpose the `blog:new`/`blog:validate`/`blog:list` scripts.
- `docs/03-DEPLOYMENT.md` — extend with backend deployment steps (uploading `backend/`, running migrations, setting `.env`) alongside the existing frontend deploy instructions.

## Files to reuse

- `src/components/blog/*` (`TableOfContents.tsx`, `ShareButtons.tsx`, `TagList.jsx`, `CategoryBadge.jsx`, `BlogCard.jsx`, `BlogGrid.jsx`, `BlogMeta.jsx`, `FeaturedBlogCard.jsx`, `BlogSection.jsx`, `BlogEmptyState.jsx`) — presentational, already content-source-agnostic.
- `src/features/blog/constants.ts` — reusable as-is (categories list becomes a DB-driven suggestion rather than the sole source, reading time / excerpt / related-post scoring constants stay relevant).
- `src/features/blog/utils.ts` — `formatDate`, `generateSlug`, `calculateReadingTimeMinutes`, `generateExcerpt`, `getRelatedPosts`, etc. all stay useful client-side (note: `generateSlug`'s rules should be mirrored server-side in `SlugService.php` so client preview and server-assigned slugs never disagree).
- `src/features/blog/schema.ts` / `types.ts` — good reference for the new DB field list; `normalizeBlogPost`'s validation logic is a solid starting point for both the editor's client-side form validation and the backend's server-side validation (the latter is authoritative; the former is just UX).
- `src/components/ui/*` — all generic UI atoms (`Button`, `Input`, `Textarea`, `Badge`, `Card`, etc.) apply unchanged to the new admin screens.
- `public/.htaccess` — SPA-fallback rewrite rule stays; extend it with the API path exception and the uploads-directory PHP-execution-disable rule (§7.7).
- `docs/03-DEPLOYMENT.md` — mostly reusable, extended rather than replaced.
- `scripts/blog/lib/frontmatter.mjs` / `posts.mjs` — reused one-off inside the Phase 5 migration script to parse the existing 7 Markdown files.

## New folders to create

- `backend/` — PHP source (`public/`, `src/Config`, `src/Router.php`, `src/Middleware`, `src/Controllers`, `src/Models`, `src/Services`).
- `backend/migrations/` — versioned SQL schema migrations.
- `uploads/` — actual uploaded file storage (gitignored), served statically with PHP execution disabled.
- `src/features/admin/` gains `api.ts` (authenticated fetch client) and `AuthContext.jsx`, replacing the single `auth.ts` file.
- `src/components/admin/` — new admin-only components (`PostEditor/TiptapEditor.jsx`, `PostEditor/SeoFieldsPanel.jsx`, `PostEditor/TaxonomyPicker.jsx`, `PostTable.jsx`, `AdminLayout.jsx`).
- `src/pages/admin/posts/`, `src/pages/admin/users/`, `src/pages/admin/taxonomy/` — the expanded CMS page set replacing the single `AdminDashboard.jsx`.

## Risks

- **Hosting constraints unverified.** Actual Hostinger plan PHP version, PDO availability, Composer/shell access, and `php.ini` upload limits need confirming before Phase 1 — if any are more restrictive than assumed, parts of §6/§8 may need adjusting (e.g. vendoring dependencies manually if Composer isn't available).
- **Stored-XSS surface is new.** Moving from hand-authored, PR-reviewed Markdown to a browser-based rich-text editor with a real save path means the sanitizer (§7.6) is now a genuine security control, not defense-in-depth for trusted input — it must be correct, allow-list-based, and applied server-side on every save, not just client-side.
- **Increased attack surface generally.** The current site is immune to backend compromise because it has none. Adding a real login, database, and upload endpoints means this system now needs ongoing security maintenance (patching PHP, monitoring failed logins, rotating credentials) that didn't previously exist — an accepted, necessary tradeoff for the requested functionality, but worth stating plainly.
- **Content-format conversion risk.** Converting the 7 existing posts' custom Markdown-subset bodies into TipTap-compatible HTML (Phase 5) needs careful, per-post verification — an automated conversion could subtly mis-render a list, bold span, or emphasis paragraph that today's hand-rolled parser handles via its own specific rules.
- **SEO/SSR limitation carries forward unchanged.** This migration does not by itself improve non-JS-crawler visibility (§1.6/§2.11) — if that's now a priority given the new explicit SEO-field requirements, it's worth a deliberate follow-up decision (e.g. a thin PHP-rendered meta-tag shell for `/blog/:slug` requests from crawlers) rather than assuming the CMS work alone fixes it.
- **Session/cookie setup is same-origin-dependent.** The security model in §5/§9 assumes the API is served from the same origin as the frontend (`niazabbasi.com/api/...`). If it ends up on a separate subdomain instead, CORS and `SameSite=None` cookie handling become necessary and meaningfully increase complexity/risk — strongly prefer same-origin.
- **Migration script correctness.** The one-time Markdown→DB import (Phase 5) is a single point where a bug could silently drop or corrupt content; mitigated by keeping `content/blog/*.md` permanently as source-of-truth backup (§8) and requiring manual spot-checks before Phase 6 sign-off.
- **Backup/restore process on Hostinger shared MySQL is unproven** until explicitly tested (§8.5) — don't treat "we can `mysqldump`" as equivalent to "we've verified a restore works."
- **Cutover timing risk.** Phase 4 (public site switching from static to fetched content) is the one step that can visibly break the live site if the API is slow, down, or returns malformed data; mitigated by the archived-`dist/` fallback and staged verification described in §8, but it's real risk that should be scheduled for a low-traffic window with the site owner available to confirm.
