# Next.js Blog Reuse Audit

**Scope:** every file copied into this repo from the old Next.js project (`/actions`, `/api`, `/blog`, `/src/components/admin`, `/src/components/blog`, `/src/components/BlogCard.tsx`, `/src/components/BlogSection.tsx`).

**Target runtime (this project):** Vite + React 19 + `react-router-dom` v7, client-side only, static hosting on Hostinger. No Node server, no API routes, no filesystem access at runtime, no database. Confirmed via `package.json` (no `next`, no `@vercel/*`, no `@tiptap/*`, no `slugify`), and no `@` path alias exists anywhere in `vite.config.js` — every `@/...` import below is currently a hard build error, not a style nit.

**Baseline finding:** this project already ships a working, native blog stub at `src/pages/blog/BlogIndex.jsx` and `src/pages/blog/BlogPost.jsx`, wired into `src/app/router.jsx` under `/blog` and `/blog/:slug`. Every copied file is an unwired, non-compiling duplicate of functionality this project already owns the routing for.

No files were modified, deleted, or had packages installed as part of this audit.

---

## 1. Executive summary

| Category | Count | Files |
|---|---|---|
| Directly reusable | 0 | — |
| Reusable with small changes | 3 | `ShareButtons.tsx`, `TableOfContents.tsx`, `BlogCard.tsx` (partial) |
| Reusable after architectural refactoring | 6 | `blog/page.tsx`, `blog/[slug]/page.tsx`, `blog/[slug]/BlogPostClient.tsx`, `BlogSection.tsx`, `RichTextEditor.tsx` (content renderer only), `BlogSEO.tsx` (concept only) |
| Next.js-only and incompatible | 20 (all files, to varying degrees — see per-file `Runtime requirement`) | all 20 files import Next.js-only APIs at minimum |
| Unsafe for a frontend-only production deployment | 6 | `api/admin/login/route.ts`, `api/admin/logout/route.ts`, `api/admin/upload/route.ts`, `api/admin/migrate/route.ts`, `AdminLogin.tsx`, `AdminLayout.tsx`, `BlogEditor.tsx` (upload path) |
| Redundant with existing project code | 2 | `blog/page.tsx` vs `BlogIndex.jsx`, `blog/[slug]/page.tsx` vs `BlogPost.jsx` |
| Candidate for deletion | 6 | all 4 `api/admin/*/route.ts` files, `blog/layout.tsx`, `RichTextEditor.tsx` (as a live editor) |

Every single file references at least one Next.js-only API, so the categories above overlap — a file can be simultaneously "reusable after refactoring" (its JSX/markup) and "unsafe" (its data-fetching or auth logic). Per-file detail is in section 2.

---

## 2. Per-file audit

### `actions/blogActions.ts`

- **Original purpose:** Server Action wrapper exposing `fetchBlogsList()` and `removeBlogAction()` to client components, backed by a filesystem/DB blog service.
- **Runtime requirement:** Next.js Server Actions runtime (`"use server"`), which compiles this into an RPC endpoint. Requires `next/cache` for `revalidatePath`. Imports `@/data/blogService`, which **does not exist anywhere in this repo** — it was never copied.
- **Can it run in a React browser app:** No. `"use server"` functions cannot execute client-side at all; there is no server to host them.
- **Reuse recommendation:** Reusable after architectural refactoring — only the *shape* of the two functions (list blogs, delete blog) is worth keeping as an interface to reimplement against a build-time content service.
- **Required replacement:** A static content module (e.g. blog posts imported as JSON/MDX at build time) or, for delete/write operations, remove entirely — a static frontend has no authenticated write path.
- **Security risk:** None directly, but it's the seam that `removeBlogAction` uses to perform authenticated deletes — see `BlogManager.tsx`.
- **Final destination:** Delete. Replace with a plain `getBlogs()` reading from a static import, no delete capability in the browser.

### `actions/saveBlogAction.ts`

- **Original purpose:** Server Action to create/update a blog post, with slug-uniqueness validation and cache revalidation.
- **Runtime requirement:** `"use server"`, `next/cache`, `@/data/blogService` (missing).
- **Can it run in a React browser app:** No.
- **Reuse recommendation:** Next.js-only and incompatible. There is no server-side content mutation possible in this architecture at all.
- **Required replacement:** Content authoring happens outside the deployed app — write Markdown/JSON files locally, commit, rebuild, redeploy. No in-browser save.
- **Security risk:** None directly, but this is the write-path the admin UI depends on; without a backend it cannot be reproduced safely (see `AdminLogin.tsx` / `BlogEditor.tsx` below).
- **Final destination:** Delete.

### `api/admin/upload/route.ts`

- **Original purpose:** Next.js Route Handler accepting `multipart/form-data`, uploading to Vercel Blob storage if configured, else writing to the server's local filesystem (`fs.writeFileSync` under `public/blog-images`).
- **Runtime requirement:** Node.js server runtime. Uses `fs`, `path`, `process.cwd()`, `process.env.BLOB_READ_WRITE_TOKEN`, and the `@vercel/blob` SDK (not installed here, and would be meaningless without a Vercel deployment).
- **Can it run in a React browser app:** No. Browsers cannot write to a server filesystem or hold server-side secrets, and there is no route-handler runtime for this URL to even exist in a static site.
- **Reuse recommendation:** Next.js-only and incompatible.
- **Required replacement:** "Filesystem save" → repository-managed local assets: images are added to `public/` (or `src/assets/`) by hand/CLI before build, and referenced by relative path in content. If dynamic upload is genuinely required, that means introducing an external backend (see closing note on constraints below) — out of scope for a frontend-only deployment.
- **Security risk:** **High if ever deployed as-is.** This route has no auth check on the handler itself (auth was assumed enforced elsewhere, e.g. middleware, which was not copied) and would let any caller who reaches the URL write arbitrary files to the server. Do not deploy any variant of this route without independent authentication *inside the handler* and strict file-type/size validation.
- **Final destination:** Delete.

### `api/admin/migrate/route.ts`

- **Original purpose:** One-off admin GET endpoint to migrate local JSON blog files into Vercel KV (Redis-compatible store).
- **Runtime requirement:** Node.js server runtime, `fs`, `@vercel/kv`, `@/data/authService` (not copied/does not exist), `process.env.KV_REST_API_URL`.
- **Can it run in a React browser app:** No.
- **Reuse recommendation:** Next.js-only and incompatible. Entirely inapplicable — there is no KV store, no filesystem, and no server in this project's target deployment.
- **Required replacement:** None needed; this was a one-time Vercel-specific ops script, not product functionality.
- **Security risk:** Depends on `verifySession()`, a function that does not exist in this codebase — if this route were ever wired up without that guard, it would be an **unauthenticated data-migration endpoint**.
- **Final destination:** Delete.

### `api/admin/logout/route.ts`

- **Original purpose:** Clears the server-side session cookie.
- **Runtime requirement:** Next.js Route Handler runtime, `@/data/authService.deleteSession()` (not copied/does not exist).
- **Can it run in a React browser app:** No — there is no server to hold or clear an httpOnly session cookie.
- **Reuse recommendation:** Next.js-only and incompatible.
- **Required replacement:** N/A unless an external backend is introduced (see closing constraints).
- **Security risk:** None on its own; risk lives in the session model it supports.
- **Final destination:** Delete.

### `api/admin/login/route.ts`

- **Original purpose:** Validates `email`/`password` against `process.env.ADMIN_EMAIL` / `process.env.ADMIN_PASSWORD` and creates a session cookie.
- **Runtime requirement:** Next.js server runtime with server-only environment variables and `@/data/authService.createSession()` (not copied/does not exist).
- **Can it run in a React browser app:** No, and it must never be made to. Any server env var referenced here, if ported into a Vite `import.meta.env.VITE_*` variable, would be **bundled into the public JS and readable by anyone** — that is the single most important thing to avoid in this migration.
- **Reuse recommendation:** Unsafe for a frontend-only production deployment.
- **Required replacement:** Cookie/credential authentication → remove entirely unless an external backend (e.g. a small serverless auth function, Hostinger-hosted API, or third-party auth provider) is introduced. A static site has nothing to authenticate *against*.
- **Security risk:** **Critical.** This is a plaintext credential comparison (`email === expectedEmail && password === expectedPassword`) with no hashing, no rate limiting, no lockout. It must never be reproduced client-side. If any `ADMIN_EMAIL`/`ADMIN_PASSWORD` values exist in old `.env` files that were copied alongside this code, treat them as compromised and rotate them — see section 5.
- **Final destination:** Delete.

### `blog/layout.tsx`

- **Original purpose:** Next.js App Router layout segment exporting `metadata` for `/blog/*`.
- **Runtime requirement:** Next.js App Router file convention (`layout.tsx` + `Metadata` type). Meaningless outside that router.
- **Can it run in a React browser app:** No — this isn't really a component, it's a routing/metadata convention file with no client-side behavior of its own (it just renders `children`).
- **Reuse recommendation:** Redundant with existing project code — this project's `SiteLayout.jsx` (`src/app/layouts/SiteLayout.jsx`) already plays this role for all routes, and per-page `<title>`/meta should be handled by `useDocumentTitle` (already present in `src/utils/useDocumentTitle.js`, already used by `BlogIndex.jsx`/`BlogPost.jsx`) or a `react-helmet`-style tag manager.
- **Required replacement:** Next dynamic route/layout convention → React Router nested route + `useDocumentTitle`.
- **Security risk:** None.
- **Final destination:** Delete.

### `blog/page.tsx`

- **Original purpose:** Blog index page — server-fetches all blogs, filters to `published`, renders a card grid.
- **Runtime requirement:** React Server Component (implicit `async function` default export), `next/link`, `next/image`, `@/data/blogService` (not copied/does not exist), Next.js `metadata` export.
- **Can it run in a React browser app:** No as written — RSCs don't exist outside Next.js, `next/image` requires the Next.js image-optimization server, `next/link` requires the Next.js router context.
- **Reuse recommendation:** Reusable after architectural refactoring. The JSX/Tailwind markup (card grid, empty state) is good and portable; the data-fetching and both `next/*` imports are not.
- **Required replacement:**
  - `async function BlogPage()` (RSC) → `useEffect`/`useState` fetch from a static content module, same pattern already used in this repo's own `BlogSection.tsx` component style.
  - `next/link` → `react-router-dom`'s `Link`.
  - `next/image` → a plain `<img>` (with explicit `width`/`height` or `aspect-ratio` CSS to avoid layout shift), since there's no build-time image optimizer in this stack.
  - `metadata` export → `useDocumentTitle` + a manual `<meta>` tag helper if SEO tags are needed.
- **Security risk:** None (read-only, public content).
- **Final destination:** **Redundant** — this project's `src/pages/blog/BlogIndex.jsx` already occupies the `/blog` route. If the copied design is preferred, replace `BlogIndex.jsx`'s content with a refactored version of this file's JSX; do not add a second competing route.

### `blog/[slug]/page.tsx`

- **Original purpose:** Blog post detail page — server-fetches a post by slug, 404s on missing/draft, renders content via `dangerouslySetInnerHTML`, computes related posts, generates per-post SEO metadata and static params.
- **Runtime requirement:** RSC, `next/navigation` (`notFound()`), `next/link`, `next/image`, `@/data/blogService` (not copied/does not exist), `generateStaticParams`/`generateMetadata` (Next.js SSG conventions).
- **Can it run in a React browser app:** No as written.
- **Reuse recommendation:** Reusable after architectural refactoring. Markup and related-posts logic are portable; everything else is Next.js-specific.
- **Required replacement:**
  - `generateStaticParams` → not needed; React Router's `:slug` param already handles this (`useParams()`), as `BlogPost.jsx` already demonstrates.
  - `generateMetadata` → `useDocumentTitle` + manual meta tags per mounted post.
  - `notFound()` → conditional render of a "not found" state (which `BlogPost.jsx` already implements) or `<Navigate to="/blog" />`.
  - `next/link`, `next/image` → same as above.
  - **`dangerouslySetInnerHTML={{ __html: blog.content }}` — flag this explicitly.** If blog content ever originates from anything other than a trusted, hand-authored source (e.g. a future CMS, user-submitted comments, or the admin rich-text editor below), this is a stored-XSS vector. In a fully static site where content is authored and reviewed before commit, the risk is low, but it should be sanitized (e.g. DOMPurify) if the content pipeline ever becomes less trusted.
- **Security risk:** Medium (XSS via `dangerouslySetInnerHTML`, contingent on content provenance — see above).
- **Final destination:** **Redundant** — this project's `src/pages/blog/BlogPost.jsx` already occupies `/blog/:slug`. Same guidance as `blog/page.tsx`: merge the refactored JSX into the existing file rather than keeping both.

### `blog/[slug]/BlogPostClient.tsx`

- **Original purpose:** Client-side companion to `blog/[slug]/page.tsx` — renders a hand-rolled Markdown-to-JSX parser (headings, bold, italic, lists) plus related-posts grid. Appears to be an alternate/earlier renderer to the `dangerouslySetInnerHTML` approach used in `page.tsx` (the two are inconsistent with each other — one expects Markdown-like plain text in `post.content`, the other expects pre-rendered HTML).
- **Runtime requirement:** `"use client"`, `next/link`, `@/data/blogService` (type-only import, not copied/does not exist). `framer-motion` **is** already a dependency here, so that part is portable as-is.
- **Can it run in a React browser app:** Mostly yes, after replacing `next/link`. The `renderContent()` Markdown parser is plain TypeScript/React with no Next.js dependency and is directly portable logic.
- **Reuse recommendation:** Reusable with small changes (the `renderContent` parser + JSX) once `next/link` → `react-router-dom` `Link` and the `BlogPost` type is sourced locally instead of `@/data/blogService`.
- **Required replacement:** `next/link` → React Router `Link`. Decide on **one** content format (Markdown text parsed client-side via this file's approach, *or* pre-rendered HTML via `dangerouslySetInnerHTML` as in `page.tsx` — not both, they currently conflict).
- **Security risk:** Low — this parser only handles a small, fixed set of Markdown tokens and does not interpret raw HTML, so it doesn't have the same XSS surface as `dangerouslySetInnerHTML`. Prefer this approach for a trust-any-Markdown-file pipeline.
- **Final destination:** Merge into `src/pages/blog/BlogPost.jsx` if the Markdown-parsing approach is chosen over the HTML-string approach; otherwise delete as a duplicate renderer.

### `src/components/admin/AdminLayout.tsx`

- **Original purpose:** Sidebar shell for `/admin/*` routes with nav links and a logout button.
- **Runtime requirement:** `"use client"`, `next/link`, `next/navigation` (`usePathname`, `useRouter`). Calls `fetch('/api/admin/logout')`, which requires the (excluded) server routes above.
- **Can it run in a React browser app:** No as written; the routing hooks and logout fetch target Next.js-only APIs/routes.
- **Reuse recommendation:** Unsafe for a frontend-only production deployment — this is the shell for an admin dashboard with no backend to authenticate or authorize against. Building this UI without a real backend would produce **client-side-only "access control"** that anyone can bypass by navigating directly to the route or editing local state — i.e. a fake admin dashboard.
- **Required replacement:** Do not port unless/until a real external backend exists. If ported later: `next/link` → React Router `Link`, `usePathname`/`useRouter` → `useLocation`/`useNavigate`.
- **Security risk:** High by implication — it exists to gate a delete/write workflow that has no server to enforce authorization in this architecture.
- **Final destination:** Delete (do not build a decorative admin dashboard per the task constraints).

### `src/components/admin/AdminLogin.tsx`

- **Original purpose:** Login form posting credentials to `/api/admin/login`.
- **Runtime requirement:** `"use client"`, `next/navigation` (`useRouter`), `next/link`, and the (excluded) login route.
- **Can it run in a React browser app:** No functional backend to call. The form itself is trivial to port, but doing so with nothing safe to POST to is pointless and misleading.
- **Reuse recommendation:** Unsafe for a frontend-only production deployment.
- **Required replacement:** Cookie/credential authentication → remove unless an external backend is introduced.
- **Security risk:** High by association — this is the UI half of the plaintext-credential-comparison flow flagged in `api/admin/login/route.ts`. Never wire a form like this to compare against a `VITE_`-exposed env var; that would ship the "password" in the public JS bundle.
- **Final destination:** Delete.

### `src/components/admin/RichTextEditor.tsx`

- **Original purpose:** Tiptap-based WYSIWYG editor for blog content.
- **Runtime requirement:** `"use client"`, `@tiptap/react` + `@tiptap/starter-kit` — **not installed in this project** (confirmed absent from `package.json`/`node_modules`). No Next.js-specific APIs otherwise; this is the most portable file of the admin set architecturally.
- **Can it run in a React browser app:** Yes, technically, once the two Tiptap packages are added — but that authoring workflow only makes sense paired with a save path (`saveBlogAction`), which doesn't exist here.
- **Reuse recommendation:** Reusable after architectural refactoring, but only if a content-authoring tool is genuinely wanted as a *local, dev-only* tool (e.g. a script run only by the site owner before committing content, never shipped to production/the public bundle).
- **Required replacement:** N/A for production. If kept as a dev tool, it should live outside the deployed app (e.g. a separate local-only Vite app or a CLI), not in `src/` of the production site.
- **Security risk:** Low in isolation (no secrets, no network calls of its own), but its natural pairing (`handleImageUpload` → `/api/admin/upload`) is the same unsafe upload path flagged above — don't wire the two together in the deployed app.
- **Final destination:** Candidate for deletion from the production app; optionally repurpose as a standalone offline authoring tool, kept out of `src/`.

### `src/components/admin/BlogManager.tsx`

- **Original purpose:** Admin dashboard table listing/searching/deleting blogs.
- **Runtime requirement:** `"use client"`, `next/link`, `@/app/actions/blogActions` (Server Actions, excluded/nonexistent path even relative to the copied `actions/` dir — note the import path itself, `@/app/actions/...`, doesn't match where the file actually was copied to, `actions/blogActions.ts`, which is a sign the original Next.js `app/` directory structure wasn't fully preserved).
- **Can it run in a React browser app:** No — depends entirely on Server Actions and a live delete capability with no server to authorize it.
- **Reuse recommendation:** Unsafe for a frontend-only production deployment.
- **Required replacement:** Server action → build-time content service (list-only, no delete-in-browser).
- **Security risk:** High by implication (unauthenticated delete capability if ever wired to a real backend without server-side auth).
- **Final destination:** Delete.

### `src/components/admin/BlogEditor.tsx`

- **Original purpose:** Full blog create/edit form — title, slug (auto-generated via `slugify`), category, tags, excerpt, Tiptap content, image upload, draft/publish.
- **Runtime requirement:** `"use client"`, `next/navigation` (`useRouter`, `useSearchParams`), `next/link`, `slugify` (**not installed**), `@/app/actions/saveBlogAction` (Server Action, excluded), and a `fetch('/api/admin/upload', ...)` call to the unsafe upload route.
- **Can it run in a React browser app:** No — multiple hard dependencies on server-only pieces.
- **Reuse recommendation:** Unsafe for a frontend-only production deployment.
- **Required replacement:** Server action → build-time content service; multipart upload handling → repository-managed local assets (drop an image into `public/`, reference its path by hand); routing hooks → React Router equivalents.
- **Security risk:** High by association with the login/upload flow it depends on.
- **Final destination:** Delete.

### `src/components/blog/TableOfContents.tsx`

- **Original purpose:** Auto-generates a scroll-spy table of contents from `.prose h2`/`h3` elements in the rendered article, using `IntersectionObserver`.
- **Runtime requirement:** `"use client"`. No Next.js-specific imports at all — pure DOM APIs (`document.querySelectorAll`, `IntersectionObserver`).
- **Can it run in a React browser app:** Yes, as-is (after stripping the inert `"use client"` directive, which is a no-op/harmless in Vite but should be removed for clarity).
- **Reuse recommendation:** **Directly reusable** (this is the strongest file in the whole set).
- **Required replacement:** None functionally required. Cosmetic: drop `"use client"`.
- **Security risk:** None.
- **Final destination:** `src/components/blog/TableOfContents.tsx` (keep in place, minus the directive).

### `src/components/blog/ShareButtons.tsx`

- **Original purpose:** Social share buttons (Facebook/Twitter/LinkedIn/WhatsApp) + copy-link button.
- **Runtime requirement:** `"use client"`. No Next.js-specific imports — plain `window.location.href` and `navigator.clipboard`.
- **Can it run in a React browser app:** Yes, as-is.
- **Reuse recommendation:** **Directly reusable** (aside from stripping the directive).
- **Required replacement:** None functionally required. Cosmetic: drop `"use client"`.
- **Security risk:** None — all share URLs use `encodeURIComponent` correctly.
- **Final destination:** `src/components/blog/ShareButtons.tsx` (keep, minus the directive).

### `src/components/blog/BlogSEO.tsx`

- **Original purpose:** Injects a JSON-LD `<script>` tag for BlogPosting structured data using Next.js's `next/script` component, reading `process.env.NEXT_PUBLIC_SITE_URL`.
- **Runtime requirement:** `next/script` (Next.js-specific script-loading component with strategy/priority hints — no equivalent needed in a plain SPA), `process.env.NEXT_PUBLIC_SITE_URL` (Next.js env convention; Vite's equivalent is `import.meta.env.VITE_SITE_URL`), `@/data/blogService` (type-only, not copied/does not exist).
- **Can it run in a React browser app:** No as written (`next/script` doesn't exist here), but the underlying idea (inject a `<script type="application/ld+json">` with `dangerouslySetInnerHTML`) is a five-line vanilla-React pattern.
- **Reuse recommendation:** Reusable after architectural refactoring (concept only — rewrite as a plain component, or better, as a small hook that appends/removes a `<script>` tag in `useEffect`).
- **Required replacement:** `next/script` → plain `<script dangerouslySetInnerHTML>` inside a `useEffect`-managed injection, or omit entirely if SEO/structured-data isn't a current priority. `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`.
- **Security risk:** Low — the injected JSON is built from trusted, locally-authored blog fields, but `articleBody` strips HTML tags with a regex rather than a real sanitizer; fine for JSON-LD's plain-text context, not something to reuse for rendering.
- **Final destination:** Rewrite as `src/components/blog/BlogSEO.tsx` (or fold into a shared `useDocumentTitle`-style hook) once a decision is made about environment variable and content sourcing.

### `src/components/BlogCard.tsx`

- **Original purpose:** Blog post preview card (image-less variant) with framer-motion entrance animation, used in listing/section contexts.
- **Runtime requirement:** `'use client'`, `next/link`, `@/data/blogService` (type-only import, not copied/does not exist). `framer-motion` is already installed here.
- **Can it run in a React browser app:** Mostly yes — only `next/link` and the type import block it.
- **Reuse recommendation:** Reusable with small changes.
- **Required replacement:** `next/link` → React Router `Link`; source the `BlogPost` type/shape from a local module instead of `@/data/blogService`.
- **Security risk:** None.
- **Final destination:** `src/components/BlogCard.tsx` (keep, after the two substitutions above). Note this duplicates/overlaps with the card markup embedded directly in `blog/page.tsx` — pick one card implementation, don't keep both.

### `src/components/BlogSection.tsx`

- **Original purpose:** Homepage "Featured Writings" section pulling up to 3 featured+published posts.
- **Runtime requirement:** `'use client'`, `next/link`, `@/app/actions/blogActions` (Server Action, excluded), `@/i18n/LanguageContext` (**does not exist anywhere in this repo** — this project has no i18n layer at all; grepped and confirmed absent).
- **Can it run in a React browser app:** No as written — both the data-fetch and the `useLanguage()` hook are hard failures (`useLanguage` isn't just "different," it's calling a module that was never brought over from wherever it lived in the original project).
- **Reuse recommendation:** Reusable after architectural refactoring.
- **Required replacement:** Server action → build-time content service (static import + `.filter()`, no `fetch`/`useEffect` round-trip needed at all in a fully static build); `next/link` → React Router `Link`; `useLanguage()` → either remove the translation call (`t` is imported but never actually used in the JSX shown, so it may be safe to drop entirely) or wire to whatever i18n solution, if any, this project adopts later.
- **Security risk:** None.
- **Final destination:** `src/components/BlogSection.tsx`, once the three substitutions above are made, wired into `src/pages/Home.jsx` where a "Featured Writings" section would belong. Confirm first whether `Home.jsx` already has a placeholder for this — not checked as part of this read-only audit's declared scope, worth a quick look before implementation.

---

## 3. Proposed migration map

| Next.js concept | This project's replacement |
|---|---|
| `next/link` `<Link>` | `react-router-dom` `<Link>` |
| `next/image` `<Image>` | plain `<img>` with explicit dimensions / CSS `aspect-ratio` (no build-time optimizer in this stack) |
| `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`) | `react-router-dom` (`useNavigate`, `useLocation`, `useParams`/`useSearchParams` from `react-router-dom`) |
| `next/headers` / `cookies()` | N/A — remove. No server exists to set/read httpOnly cookies. |
| `next/script` | plain `<script>` injected via `useEffect`, or omit |
| Server Action (`"use server"`) | build-time content service (static import of JSON/Markdown, computed at build time, no runtime RPC) |
| API Route Handler (`api/**/route.ts`) | none — no server exists. If a specific capability truly requires a backend (auth, uploads), that is a separate infrastructure decision, out of scope here (see closing note). |
| Filesystem save (`fs.writeFileSync`) | Markdown/JSON files created locally by the author and committed to the repo before `vite build` |
| Multipart image upload route | repository-managed local assets (drop the file in `public/`, reference the relative path) |
| Cookie-based session auth | removed entirely, unless/until an external backend is deliberately introduced |
| `revalidatePath` / ISR cache invalidation | rebuild and redeploy (fully static output has no runtime cache to invalidate) |
| Dynamic route (`app/blog/[slug]/page.tsx`) | React Router slug route (`<Route path="blog/:slug">`, already present as `BlogPost.jsx`) |
| `generateStaticParams` / SSG | not needed — client-side routing resolves `:slug` at request time from the static content bundle |
| `generateMetadata` | `useDocumentTitle` (already exists in this repo) + optional manual `<meta>` tag management |
| `process.env.NEXT_PUBLIC_*` | `import.meta.env.VITE_*` (Vite's public env convention — still bundled into client JS, so still not for secrets) |
| Absolute `@/...` aliases | either configure a matching alias in `vite.config.js` (`resolve.alias`) **for non-secret, non-server code only**, or switch to relative imports to match this project's current convention (no alias exists today) |

---

## 4. Redundancy note

Two routes are duplicated wholesale:

- `blog/page.tsx` (copied) vs. `src/pages/blog/BlogIndex.jsx` (existing, live, routed)
- `blog/[slug]/page.tsx` + `blog/[slug]/BlogPostClient.tsx` (copied) vs. `src/pages/blog/BlogPost.jsx` (existing, live, routed)

The existing files are currently simple "coming soon" placeholders; the copied files have the fuller design. The likely intent is to **replace the placeholder content inside the existing files** with a refactored version of the copied JSX — not to add a second, competing set of routes. Router wiring (`src/app/router.jsx`) already points at the existing file locations.

---

## 5. Report

**Files safe to reuse (as-is or near-as-is):**
- `src/components/blog/TableOfContents.tsx` — directly reusable
- `src/components/blog/ShareButtons.tsx` — directly reusable

**Files requiring refactoring (portable logic, Next.js plumbing to swap):**
- `src/components/BlogCard.tsx` — swap `next/link`, resolve `BlogPost` type source
- `src/components/BlogSection.tsx` — swap `next/link`, remove/replace `@/i18n/LanguageContext` (module doesn't exist), replace server action with static import
- `src/components/blog/BlogSEO.tsx` — replace `next/script`, replace `NEXT_PUBLIC_*` env convention
- `blog/[slug]/BlogPostClient.tsx` — swap `next/link`; decide Markdown-vs-HTML content strategy (conflicts with `blog/[slug]/page.tsx`'s approach)
- `blog/page.tsx`, `blog/[slug]/page.tsx` — extract JSX only; rebuild data-fetching, routing hooks, and image handling from scratch; **merge into the existing `BlogIndex.jsx`/`BlogPost.jsx` rather than adding parallel routes**

**Files that must be removed (no viable path in a frontend-only deployment):**
- `api/admin/login/route.ts`
- `api/admin/logout/route.ts`
- `api/admin/upload/route.ts`
- `api/admin/migrate/route.ts`
- `actions/blogActions.ts`
- `actions/saveBlogAction.ts`
- `blog/layout.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/AdminLogin.tsx`
- `src/components/admin/BlogManager.tsx`
- `src/components/admin/BlogEditor.tsx`
- `src/components/admin/RichTextEditor.tsx` (in production `src/`; may be salvaged as an offline-only authoring tool kept outside the deployed app)

**Dependencies from the old Next.js app that don't exist here (and shouldn't be installed just to make these files compile):**
- `next` (the framework itself)
- `@vercel/blob`, `@vercel/kv` (Vercel-specific storage clients, meaningless on Hostinger static hosting)
- `@tiptap/react`, `@tiptap/starter-kit` (only relevant if a dev-only offline editor is deliberately kept)
- `slugify` (small, low-risk if a build-time slug-generation script is wanted — but not needed at runtime in the browser)
- `@/data/blogService`, `@/data/authService` — never copied, and were the actual data/auth layer everything else called into. Their absence is why nothing here currently compiles, independent of the Next.js-API issues.
- `@/i18n/LanguageContext` — referenced only by `BlogSection.tsx`, doesn't exist anywhere in either the copied set or this project.

**Recommended migration sequence:**
1. Decide the content model first: static JSON/Markdown files checked into the repo, built at `vite build` time. This unblocks everything else (`getBlogs`/`getBlogBySlug` become simple local imports/filters, no server needed).
2. Port `TableOfContents.tsx` and `ShareButtons.tsx` as-is (trivial, zero risk).
3. Refactor `BlogCard.tsx` and merge its markup with (or replace) the inline card JSX in `blog/page.tsx`; wire the result into `src/pages/blog/BlogIndex.jsx`, replacing the current placeholder.
4. Refactor `blog/[slug]/page.tsx` (or `BlogPostClient.tsx`, pick one content-rendering strategy) and merge into `src/pages/blog/BlogPost.jsx`, replacing its placeholder.
5. Refactor `BlogSection.tsx` (drop the missing i18n hook) and add it to `src/pages/Home.jsx` if a homepage teaser section is wanted.
6. Decide separately, deliberately, and out of this migration's scope whether any authoring/admin workflow is needed at all. If yes, that requires a real backend decision (external host, serverless function, third-party CMS) — it is not something to fake client-side. If no, delete the entire `admin/` set and the four `api/admin/*` route files outright.
7. Add `docs/NEXTJS-BLOG-REUSE-AUDIT.md` (this file) as the reference point before any of the above lands, so reviewers can see why each file was kept, rewritten, or dropped.

**Copied credentials or security-sensitive code to act on immediately:**
- No literal secrets (API keys, passwords, tokens) were found in any copied file — `api/admin/login/route.ts` reads credentials from `process.env.ADMIN_EMAIL` / `process.env.ADMIN_PASSWORD` rather than hardcoding them, and no `.env`/`.env.local` file was copied alongside the code (confirmed: no `.env*` files exist anywhere in this repo).
- **However**, if the original Next.js project's `.env`/`.env.local` (containing `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, `KV_REST_API_URL`/token, or session-signing secrets) exists anywhere else on this machine or in the source the files were copied from, **do not copy it into this repo**, and rotate those credentials if that project is still live — plaintext-compared admin passwords and blob/KV tokens are exactly the kind of secret that leaks the instant someone accidentally commits an env file.
- Treat the entire `admin/` login flow as compromised-by-design for this architecture: a plaintext email/password check with no hashing, no rate-limiting, no lockout was never safe even in the original Next.js server context, and must not be reintroduced in any client-reachable form here.
