# Deployment — Hostinger

**Scope:** how this site is built and deployed to Hostinger's shared Apache hosting, and why `public/.htaccess` exists. Written alongside the Phase 3 routing work described in `docs/01-WEBSITE-AUDIT-AND-ROADMAP.md` §12–13.

---

## 1. Build

```bash
npm install
npm run build
```

Output goes to `dist/`. Everything in `dist/` — not just `dist/index.html` — gets uploaded to the Hostinger public root (typically `public_html/`), preserving the folder structure (`dist/assets/*` → `public_html/assets/*`, etc.).

## 2. Why a rewrite rule is required

The site is a single-page app: one `index.html` boots the React app, and React Router (`src/app/router.jsx`) handles `/`, `/blog`, `/blog/:slug`, `/privacy-policy`, and everything else client-side. That works fine for **in-app** navigation (clicking a link), because the browser never leaves the already-loaded page.

It breaks for a **direct request** to a route — typing `niazabbasi.com/blog` in the address bar, refreshing `/blog/example-slug`, or opening a shared link — because Apache looks for a literal `blog/` directory or `blog.html` file on disk, finds nothing, and returns a real 404 before React Router ever gets a chance to run.

`public/.htaccess` fixes this with a rewrite rule. Vite copies everything in `public/` verbatim into `dist/`, so this file ships to the site root automatically on every build — nothing needs to be configured manually per deploy.

## 3. What the rule actually does

```apache
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

RewriteCond %{REQUEST_URI} !\.[a-zA-Z0-9]{1,8}$
RewriteRule ^ index.html [L]
```

1. **Real files and directories pass through untouched.** `/assets/index-abc123.js`, `/favicon.png`, `/icons.svg`, `/robots.txt`, `/sitemap.xml` — anything that actually exists in `dist/` — is served normally and never reaches the fallback rule.
2. **Only extension-less paths fall back to `index.html`.** `/blog`, `/blog/example-slug`, `/privacy-policy`, `/some-typo` all get rewritten to `index.html`, which boots React and lets the router decide what to render (including the 404 page for a genuinely unknown path).
3. **A missing asset still 404s.** A request like `/assets/typo.js` — a real asset path that doesn't exist, e.g. from a stale cached HTML referencing a renamed build hash — has a file extension, so rule 2's negative match excludes it. Apache returns a normal 404 instead of silently serving the SPA shell as if it were a valid script, which would otherwise fail obscurely in the browser console instead of failing loudly.

This is deliberately **not** `FallbackResource /index.html` (a common one-liner suggestion) — that directive falls back to `index.html` for *any* unresolved path regardless of whether it looks like an asset, which would mask a broken/missing JS or CSS reference as a silent 200 response.

## 4. Deploying

1. `npm run build`
2. Upload the **contents** of `dist/` (not the `dist/` folder itself) to the Hostinger public root, keeping `.htaccess` and `index.html` at the same level as `assets/`.
3. Confirm `mod_rewrite` is enabled (default on Hostinger shared hosting; if a route 404s in production but works in `npm run preview` locally, this is the first thing to check with support).

## 5. Post-deploy verification

See the route test checklist in the PR/change description for the full list — at minimum, after every deploy:

- Load `/` — homepage renders, no console errors.
- Load `/blog` **directly** (typed URL or hard refresh), not by clicking a link — this is the case `.htaccess` exists for.
- Load `/blog/example-slug` directly, same check.
- Load `/privacy-policy` directly.
- Load a nonsense path like `/does-not-exist` — should render the 404 page, not a raw Apache error or a blank screen.
- Load `/robots.txt` and `/sitemap.xml` directly (once they exist — see `docs/01-WEBSITE-AUDIT-AND-ROADMAP.md` §8) and confirm they return their real file content, not `index.html`.
