# Next.js Blog Migration Inventory

Follow-up to [`docs/NEXTJS-BLOG-REUSE-AUDIT.md`](./NEXTJS-BLOG-REUSE-AUDIT.md), which contains the full per-file rationale. This document records the physical isolation step: where each copied file now lives, and what still needs to happen before any of it is reused.

**What changed:** every copied file that imports a Next.js-only API (`next/link`, `next/navigation`, `next/image`, `next/script`, `"use server"`, Route Handler conventions) or a module that doesn't exist in this repo (`@/data/blogService`, `@/data/authService`, `@/i18n/LanguageContext`, `@/app/actions/*`) was moved out of the active React source tree into `migration/nextjs-blog-reference/`, preserving its original relative path and full file contents. Nothing was deleted, edited, or rewritten. The two files with zero Next.js dependencies (`TableOfContents.tsx`, `ShareButtons.tsx`) were left in place in `src/components/blog/` since they were already valid, buildable React and are not a compilation risk.

`migration/` is excluded from ESLint (`eslint.config.js` → `globalIgnores(['dist', 'migration'])`). It was never reachable from the Vite build graph (nothing in `src/` imported these paths even before the move — confirmed by grep prior to moving), so no separate Vite/build config exclusion was required; the ESLint ignore is the only exclusion this project's tooling needed.

**Secrets check:** grepped every copied file for literal credentials, API keys, tokens, connection strings, and PEM blocks — none found. The login/upload/migrate routes read `process.env.ADMIN_EMAIL`, `process.env.ADMIN_PASSWORD`, `process.env.BLOB_READ_WRITE_TOKEN`, `process.env.KV_REST_API_URL`, and `process.env.NEXT_PUBLIC_SITE_URL` — all server-only environment variable *references*, not hardcoded values, and none of these files are in the build graph so nothing is bundled into frontend-accessible JS. No `.env`/`.env.local` files were copied alongside the code.

---

## Inventory

| Original path | Temporary path | Reuse status | Intended React replacement | Dependency requirements |
|---|---|---|---|---|
| `actions/blogActions.ts` | `migration/nextjs-blog-reference/actions/blogActions.ts` | Delete after refactor — keep only the function *shape* | Build-time content service: `getBlogs()` reading a static JSON/Markdown import | None (drop `next/cache`, `"use server"`, `@/data/blogService`) |
| `actions/saveBlogAction.ts` | `migration/nextjs-blog-reference/actions/saveBlogAction.ts` | Delete | No in-browser save; content authored locally and committed | None — no client-side replacement exists for this in a static site |
| `api/admin/login/route.ts` | `migration/nextjs-blog-reference/api/admin/login/route.ts` | Delete — critical risk (plaintext credential compare, no hashing/rate-limit) | None unless an external backend is deliberately introduced later | N/A — must never be ported client-side |
| `api/admin/logout/route.ts` | `migration/nextjs-blog-reference/api/admin/logout/route.ts` | Delete | None — no server session to clear in this architecture | N/A |
| `api/admin/upload/route.ts` | `migration/nextjs-blog-reference/api/admin/upload/route.ts` | Delete — high risk (unauthenticated file write if ever exposed) | Repository-managed local assets: images placed in `public/` by hand, referenced by relative path | N/A — no `@vercel/blob`, no server filesystem here |
| `api/admin/migrate/route.ts` | `migration/nextjs-blog-reference/api/admin/migrate/route.ts` | Delete — one-off Vercel KV ops script, inapplicable | None needed | N/A — no KV store in this stack |
| `blog/layout.tsx` | `migration/nextjs-blog-reference/blog/layout.tsx` | Delete — redundant | `SiteLayout.jsx` (already exists) + `useDocumentTitle` (already exists) | None |
| `blog/page.tsx` | `migration/nextjs-blog-reference/blog/page.tsx` | Redundant with live route; extract JSX only | Merge refactored markup into existing `src/pages/blog/BlogIndex.jsx` | `react-router-dom` `Link` in place of `next/link`; plain `<img>` in place of `next/image`; static content import in place of RSC fetch |
| `blog/[slug]/page.tsx` | `migration/nextjs-blog-reference/blog/[slug]/page.tsx` | Redundant with live route; extract JSX + related-posts logic only | Merge refactored markup into existing `src/pages/blog/BlogPost.jsx` | Same as above, plus: sanitize (e.g. DOMPurify) before reusing the `dangerouslySetInnerHTML` pattern if content provenance ever becomes untrusted |
| `blog/[slug]/BlogPostClient.tsx` | `migration/nextjs-blog-reference/blog/[slug]/BlogPostClient.tsx` | Reusable with small changes — pick this Markdown-parser approach **or** `page.tsx`'s HTML-string approach, not both | Merge `renderContent()` parser into `src/pages/blog/BlogPost.jsx` if Markdown is the chosen content format | `react-router-dom` `Link` in place of `next/link`; `framer-motion` already installed |
| `src/components/admin/AdminLayout.tsx` | `migration/nextjs-blog-reference/src/components/admin/AdminLayout.tsx` | Delete — no backend to authorize against; would be fake client-side access control | None — do not build a decorative admin dashboard | N/A unless a real external backend is introduced |
| `src/components/admin/AdminLogin.tsx` | `migration/nextjs-blog-reference/src/components/admin/AdminLogin.tsx` | Delete — high risk by association with plaintext login route | None | N/A |
| `src/components/admin/BlogManager.tsx` | `migration/nextjs-blog-reference/src/components/admin/BlogManager.tsx` | Delete — depends on unauthenticated Server Action delete path | None (list-only, build-time content service if ever needed) | N/A |
| `src/components/admin/BlogEditor.tsx` | `migration/nextjs-blog-reference/src/components/admin/BlogEditor.tsx` | Delete — multiple hard server dependencies | None | `slugify` (not installed) would only matter for an offline authoring tool, not production |
| `src/components/admin/RichTextEditor.tsx` | `migration/nextjs-blog-reference/src/components/admin/RichTextEditor.tsx` | Candidate for deletion from production; optionally repurpose as an offline-only authoring tool kept outside `src/` | None in the deployed app | `@tiptap/react`, `@tiptap/starter-kit` (not installed) — only if kept as a separate local tool |
| `src/components/blog/BlogSEO.tsx` | `migration/nextjs-blog-reference/src/components/blog/BlogSEO.tsx` | Reusable after rewrite (concept only) | Plain `<script type="application/ld+json">` injected via `useEffect`, or a shared SEO hook | None — replace `next/script` and `process.env.NEXT_PUBLIC_*` with `import.meta.env.VITE_*` |
| `src/components/BlogCard.tsx` | `migration/nextjs-blog-reference/src/components/BlogCard.tsx` | Reusable with small changes | Update in place, wire into `BlogIndex.jsx`/`BlogSection.jsx` | `react-router-dom` `Link` in place of `next/link`; source `BlogPost` type/shape locally instead of `@/data/blogService`; `framer-motion` already installed |
| `src/components/BlogSection.tsx` | `migration/nextjs-blog-reference/src/components/BlogSection.tsx` | Reusable after refactor | Wire into `src/pages/Home.jsx` as a "Featured Writings" section, once content model exists | `react-router-dom` `Link`; drop `useLanguage()` (module doesn't exist in this repo, `t` is unused); build-time content service in place of `fetchBlogsList()` |
| `src/components/blog/TableOfContents.tsx` | *(unchanged)* `src/components/blog/TableOfContents.tsx` | **Directly reusable — left in place** | None required; only needs `"use client"` dropped when actually wired up | None |
| `src/components/blog/ShareButtons.tsx` | *(unchanged)* `src/components/blog/ShareButtons.tsx` | **Directly reusable — left in place** | None required; only needs `"use client"` dropped when actually wired up | None |

---

## Blocking dependencies for any future reuse

None of these are installed, and none should be added just to make the isolated files compile — only add them at the point a specific piece is actually being ported in:

- `next` and all `next/*` submodules — framework itself, not applicable to this Vite/React Router stack
- `@vercel/blob`, `@vercel/kv` — Vercel-specific, meaningless on static Hostinger hosting
- `@tiptap/react`, `@tiptap/starter-kit` — only relevant if `RichTextEditor.tsx` is deliberately kept as a dev-only offline tool
- `slugify` — only relevant to a local/offline content-authoring step, not runtime
- `@/data/blogService`, `@/data/authService` — never copied; this repo needs its own local content-service module and has no auth backend at all
- `@/i18n/LanguageContext` — referenced by `BlogSection.tsx` only; this repo has no i18n layer

## State after this pass

- `actions/`, `api/`, `blog/` no longer exist at the repo root — fully relocated under `migration/nextjs-blog-reference/`.
- `src/components/admin/` no longer exists — relocated.
- `src/components/BlogCard.tsx`, `src/components/BlogSection.tsx`, `src/components/blog/BlogSEO.tsx` relocated; `src/components/blog/` now contains only `TableOfContents.tsx` and `ShareButtons.tsx`.
- No active file under `src/` imports anything from `migration/`.
- `npm run lint` — passes (0 errors).
- TypeScript checking — not available; this project has no `typescript` package installed and no `tsconfig.json`, so no `tsc` step exists to run.
- `npm run build` — passes, output unchanged from before this pass (same chunk set: `BlogIndex`, `BlogPost`, `PrivacyPolicy`, `NotFound`, `ui`, `index`).
- No visual or routing changes were made. The blog is not implemented — `BlogIndex.jsx`/`BlogPost.jsx` remain the existing placeholders.
