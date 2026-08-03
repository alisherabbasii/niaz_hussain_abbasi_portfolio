# Next.js Blog Migration Inventory

Follow-up to [`docs/NEXTJS-BLOG-REUSE-AUDIT.md`](./NEXTJS-BLOG-REUSE-AUDIT.md), which contains the full per-file rationale. This document is the closing record of the migration: where every copied file ended up, and its final status now that the native React blog is live.

**History:** every file copied from the old Next.js project was first isolated (unedited, original relative paths preserved) under `migration/nextjs-blog-reference/`, excluded from ESLint and outside the Vite build graph, so nothing in it could compile into or affect the shipped site. `migration/` has since been deleted entirely — see "Final status" below. Nothing in it was ever reachable from `src/`; confirmed by grep both before the original move and again immediately before deletion.

**Secrets check (unchanged from the original audit, re-verified before deletion):** grepped every copied file for literal credentials, API keys, tokens, connection strings, and PEM blocks — none found, before or after. The login/upload/migrate routes read `process.env.ADMIN_EMAIL`, `process.env.ADMIN_PASSWORD`, `process.env.BLOB_READ_WRITE_TOKEN`, `process.env.KV_REST_API_URL`, and `process.env.NEXT_PUBLIC_SITE_URL` — server-only environment variable *references*, not hardcoded values. No `.env`/`.env.local` file was ever copied alongside the code, and none exists anywhere in this repo.

---

## Inventory — final status

| Original path | Status | Where the functionality lives now |
|---|---|---|
| `actions/blogActions.ts` | **Deleted** (commit `1ed6d40`, "admin blogs") | `src/features/blog/content.ts` — `getPublishedPosts()`/`getPostBySlug()` reading the static `BLOG_POSTS` module, no server, no delete-in-browser |
| `actions/saveBlogAction.ts` | **Deleted** (commit `1ed6d40`) | No in-browser save. Content is hand-authored Markdown/frontmatter committed to the repo; `src/pages/dev/BlogAuthor.jsx` (dev-only, stripped from production builds) assists drafting the frontmatter+body locally |
| `api/admin/login/route.ts` | **Deleted** (commit `1ed6d40`) | None — no backend exists to authenticate against; not reintroduced |
| `api/admin/logout/route.ts` | **Deleted** (commit `1ed6d40`) | None |
| `api/admin/upload/route.ts` | **Deleted** (commit `1ed6d40`) | Repository-managed local assets: images placed in `public/` by hand, referenced by relative path |
| `api/admin/migrate/route.ts` | **Deleted** (commit `1ed6d40`) | None needed — one-off Vercel KV ops script, inapplicable to this stack |
| `blog/layout.tsx` | **Deleted** (this pass) | `src/app/layouts/SiteLayout.jsx` + `src/utils/useSEO.js` |
| `blog/page.tsx` | **Deleted** (this pass) — markup superseded | `src/pages/blog/BlogIndex.jsx` (live, routed at `/blog`): search, category/tag filtering, featured post, card grid, empty states |
| `blog/[slug]/page.tsx` | **Deleted** (this pass) — markup + related-posts logic superseded | `src/pages/blog/BlogPost.jsx` (live, routed at `/blog/:slug`): related posts, prev/next nav, JSON-LD, breadcrumbs |
| `blog/[slug]/BlogPostClient.tsx` | **Deleted** (this pass) — Markdown-parser approach superseded | `src/components/blog/MarkdownContent.tsx` + `src/features/blog/markdown.ts` (the chosen content format: Markdown, not HTML strings — resolves the conflict this audit flagged between `page.tsx` and this file) |
| `src/components/admin/AdminLayout.tsx` | **Deleted** (commit `1ed6d40`) | None — no admin dashboard; would have been unauthorized client-side "access control" |
| `src/components/admin/AdminLogin.tsx` | **Deleted** (commit `1ed6d40`) | None |
| `src/components/admin/BlogManager.tsx` | **Deleted** (commit `1ed6d40`) | None |
| `src/components/admin/BlogEditor.tsx` | **Deleted** (commit `1ed6d40`) | `src/pages/dev/BlogAuthor.jsx` — dev-only, client-side-only, no auth, no server calls, generates a Markdown file for the developer to commit by hand |
| `src/components/admin/RichTextEditor.tsx` | **Deleted** (commit `1ed6d40`) | `src/pages/dev/BlogAuthor.jsx` uses a plain `<textarea>` against the same Markdown subset `features/blog/markdown.ts` renders, instead of carrying over the Tiptap dependency |
| `src/components/blog/BlogSEO.tsx` | **Deleted** (this pass) — concept superseded | `src/utils/useSEO.js` — a shared hook covering title, description, canonical URL, Open Graph, Twitter Card, and JSON-LD, used by both `BlogIndex.jsx` and `BlogPost.jsx` (strictly more complete than the copied file) |
| `src/components/BlogCard.tsx` | **Deleted** (this pass) — replaced in place | `src/components/blog/BlogCard.jsx` (live) |
| `src/components/BlogSection.tsx` | **Deleted** (this pass) — replaced in place | `src/components/blog/BlogSection.jsx` (live component; not yet wired into `src/pages/Home.jsx` — a content decision, not a migration gap) |
| `src/components/blog/TableOfContents.tsx` | **Migrated in place** (kept, `"use client"` was never present to strip) | `src/components/blog/TableOfContents.tsx` — used by `BlogPost.jsx` when `readingTimeMinutes` clears `TOC_MIN_READING_MINUTES` |
| `src/components/blog/ShareButtons.tsx` | **Migrated in place** (kept, `"use client"` was never present to strip) | `src/components/blog/ShareButtons.tsx` — used by `BlogPost.jsx` |

**Archived:** none. Every file was either already deleted in commit `1ed6d40` ("admin blogs") or deleted in this pass once its replacement was confirmed live and superior; no file needed to be kept around further for reference.

---

## Verification performed before deletion (this pass)

- `grep -rln "migration/nextjs-blog-reference"` across `src/`, `vite.config.js`, `tsconfig.json`, `eslint.config.js` — zero matches; nothing in the active tree ever imported the reference copy.
- `grep -rn "next/\|use server\|use client"` across `src/` — zero matches; no Next.js-specific API or directive survives anywhere in production code.
- Diffed the remaining reference files' functionality against their live replacements (`BlogIndex.jsx`, `BlogPost.jsx`, `BlogCard.jsx`, `BlogSection.jsx`, `useSEO.js`) — every capability (search/filter, featured post, related posts, prev/next nav, TOC, share buttons, JSON-LD structured data, Open Graph/Twitter tags) is present and live, several strictly more complete than the copied originals.
- Secrets re-scanned immediately before deletion (see above) — clean.
- `package.json` re-checked for `next`, `@vercel/*`, `@tiptap/*`, `slugify` — none were ever installed in this project; no dependency removal was needed.
- No `.env*` files or Next.js-style env var examples (`NEXT_PUBLIC_*`, `ADMIN_EMAIL`, etc.) exist anywhere in the repo to clean up.
- `eslint.config.js` — removed the now-unnecessary `'migration'` entry from `globalIgnores` (only `'dist'` remains).
- `migration/nextjs-blog-reference/` deleted via `git rm -r`, preserving full history/blame in prior commits (`git log -- migration/` still resolves).

## State after this pass

- `migration/` no longer exists in the working tree.
- `docs/NEXTJS-BLOG-REUSE-AUDIT.md` remains as the historical rationale document (per-file risk analysis); this inventory file is the closing status record.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` all pass — see the cleanup summary in the commit this file is part of.
- The React blog (`/blog`, `/blog/:slug`) is fully implemented and live, not a placeholder: search, category/tag filtering, featured post, related posts, table of contents, share buttons, JSON-LD, and Open Graph/Twitter metadata are all working.
