# Blog system — end-to-end QA

Scope: full admin workflow, public-facing rendering, security boundaries, and
date/publishing rules for the blog CMS (`backend/api/blog/**`,
`backend/helpers/{Blog,Upload,HtmlSanitizer,Permissions}.php`,
`src/pages/admin/posts/**`, `src/pages/blog/**`). No new features were added;
this is a QA pass only. No application code was changed — every check below
either passed as-is or is called out explicitly as a finding.

Run against commit `a5adfed` on `main`, 2026-08-05, PHP 8.4.23 / MariaDB
11.8.6 / Node (Vite 8) locally. **Do not treat this as a production
verification** — see "Manual production checks" at the end for what this
environment could not exercise.

## Environment used

- Backend: `php -S 127.0.0.1:8000 -t backend`, pointed at a pre-existing
  local MariaDB database (`niazabbasi_cms`) that was already fully migrated
  (migrations 001–003 applied) and already held 1 real admin and 6 real blog
  posts. That pre-existing data was never modified — every check below
  operated through two dedicated, clearly-named QA accounts
  (`qa_super_admin@example.test`, `qa_editor@example.test`) and QA-prefixed
  posts, all removed at the end (see "Cleanup" below). Final state was
  verified to exactly match the starting state: 1 admin, 6 posts, 11 uploads,
  no leftover QA rows.
- Frontend: Vite dev server (`npm run dev`), proxying `/api` and `/uploads`
  to the PHP server per `vite.config.js`.
- Browser automation: the `claude-in-chrome` extension was **not connected**
  in this environment (no interactive Chrome session available). Real
  browser automation was still achieved via **Selenium + system Chromium +
  chromedriver** (all pre-installed) driving the actual React app — this is
  genuine point-and-click UI automation (typed into TipTap, real file
  uploads via input elements, real form submissions), not an API-only
  substitute. Screenshots were captured at every major step.

## Results at a glance

| Area | Status |
|---|---|
| Lint / typecheck / PHP syntax / unit tests / build | ✅ all pass |
| Backend integration suites (150 assertions) | ✅ all pass |
| Admin E2E workflow (browser-driven, 41 checks) | ✅ all pass |
| Public-facing checks (browser-driven, 19 checks) | ✅ all pass |
| Security checks (16 checks) | ✅ all pass (1 environment caveat, see Findings) |
| Date rules | ✅ all pass, 1 minor precision-loss finding (non-security) |

No application bugs were found. Two non-blocking observations are recorded
under Findings. No code was modified as part of this QA pass.

---

## 1. Static checks

Run from the repo root:

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ pass, 0 errors/warnings |
| Type check | `npm run typecheck` | ✅ pass, 0 errors |
| PHP syntax | `php -l` on all 50 files under `backend/` | ✅ all "No syntax errors detected" |
| Unit tests | `npm test` (vitest) | ✅ 44/44 passed, 3 test files |
| Production build | `npm run build` | ✅ succeeds; only a pre-existing chunk-size advisory (`Admin` bundle 553 KB), not an error |

## 2. Backend integration test suites

These are the repo's own PHP integration suites
(`backend/tests/*.php`), run against the live local server + database
(`BASE_URL=http://127.0.0.1:8000`). All pre-existing, not written for this
QA pass; run as-is to confirm they still hold on current `main`.

| Suite | Assertions | Result |
|---|---|---|
| `html_sanitizer_test.php` | 33 | ✅ 33/33 |
| `blog_crud_test.php` | 56 | ✅ 56/56 |
| `blog_publishing_state_test.php` | 35 | ✅ 35/35 |
| `blog_related_test.php` | 26 | ✅ 26/26 |
| **Total** | **150** | ✅ **150/150** |

These suites self-clean (documented in their own headers); confirmed no
leftover rows after running them beyond the pre-existing category/tag rows
they intentionally leave behind (documented as harmless, matching normal app
behavior — see Findings §F1 for one visible consequence of this).

## 3. Admin workflow (browser-driven)

All 17 requested steps were exercised through the real React admin UI via
Selenium, logged in as a real `super_admin` session (`qa_super_admin`).
41 assertions total, **41/41 passed**. Screenshots captured at each step.

| # | Step | Verified |
|---|---|---|
| 1 | Login | Real form submit, redirected off `/admin/login`, session cookie set |
| 2 | Open blog list | `/admin/blogs` renders existing posts, correct counts |
| 3 | Create draft | Title, slug auto-generation from title confirmed |
| 4 | Upload cover image | Real file upload (`qa-cover.jpg`) via the hidden file input the "Upload image" button drives; preview renders |
| 5 | Add TipTap content | Typed a paragraph, an H2 heading, bold text, and a bullet list through the actual toolbar buttons; verified resulting HTML (`<h2 style="text-align: left">`, `<strong>`, `<ul>`) |
| 6 | Upload editor image | Real file upload through the toolbar's "Insert image" control; confirmed an `<img>` node was inserted at `/uploads/blog/content/...` |
| 7 | Select category | Free-text category field (`QA Testing Category`) |
| 8 | Add tags | Two tags added via Enter-to-commit |
| 9 | Save draft | Submit → redirected to list, DB row confirmed `status='draft'`, `published_at IS NULL` |
| 10 | Reopen draft | Title, category, content (incl. the editor image), and tags all reloaded correctly |
| 11 | Edit every field | Title, slug, short description, content (appended paragraph), cover alt text, category, tags (removed both, added a new one), SEO title/description, featured checkbox — all changed in one save |
| 12 | Publish | Status switched to Published in the same save; DB confirms `status='published'`, `published_at` set |
| 13 | Verify updated date | `created_at` unchanged across both edits; `updated_at` changed on each real edit (confirmed via direct DB query, not just the UI) |
| 14 | Feature post | Star action in list → DB `featured=1`, "Featured" badge shown |
| 15 | Unfeature post | Star-off action → DB `featured=0`, badge removed |
| 16 | Schedule future post | New post, status Published, publish date/time set 2 days out (Asia/Karachi) via the real `datetime-local` field → `publish_at` stored as the future timestamp, `published_at` stayed `NULL` (not yet live) |
| 17 | Delete test post | Delete icon → confirm dialog → confirmed → gone from admin list, gone from DB, gone from the public API (404) |

One real bug was caught and fixed **in the QA script itself** along the way:
setting a native `<input>`'s `.value` via plain JS doesn't register with
React's controlled-input tracking, so the first attempt at step 16 silently
saved "now" instead of the chosen future date. Fixed by going through
`HTMLInputElement.prototype`'s native setter + dispatching real `input`/
`change` events before re-running — this was a test-harness issue, not an
application bug (confirmed by re-testing that the field's own `value`
correctly held the intended future date/time after the fix, and the DB row
matches it exactly).

## 4. Public-facing checks (browser-driven)

19 assertions, **19/19 passed**.

| # | Check | Result |
|---|---|---|
| 1 | Published post appears on `/blog` | ✅ title present in listing |
| 2 | Draft does not appear | ✅ two real pre-existing drafts (`New Blog Test (Copy)`, `Test TipTap`) both absent |
| 3 | Future post does not appear | ✅ the scheduled post from step 16 absent from `/blog` |
| 4 | Article opens by slug | ✅ `/blog/qa-e2e-test-post-edited` renders title, document `<title>` reflects it |
| 5 | Rich formatting renders | ✅ H2, bold, bullet list all present in the rendered DOM |
| 6 | Images render | ✅ cover (`/uploads/blog/covers/...`) and in-content (`/uploads/blog/content/...`) `<img>` tags present; confirmed at least one actually loaded (`naturalWidth > 0`), not just present in markup |
| 7 | Related posts work | ✅ verified two ways: the isolated QA post (unique category/tags) correctly shows **no** "Related Articles" section — matching the documented "graceful empty list, not unrelated filler" rule — and a real existing post sharing a category with others (`test-image-inside-editor`) correctly **does** show the section |
| 8 | Unknown slug shows not found | ✅ `/blog/this-slug-does-not-exist-qa` renders a not-found page |
| 9 | Direct route refresh works | ✅ hard `driver.refresh()` (not client-side nav) on `/blog/<slug>` still renders the article correctly, no server 404 — confirmed against the **Vite dev server's** SPA fallback only; see "Manual production checks" for the separate Apache path |
| 10 | Mobile layout works | ✅ 390×844 viewport (iPhone-class): no horizontal overflow on `/`, `/blog`, or the article page; hamburger nav, wrapped category pills, and stacked article content all render correctly (see screenshots) |

## 5. Security checks (curl, direct API)

16 checks, **16/16 passed**. Run with real cookie-jar sessions (login →
CSRF-token dance, matching what the SPA does) against the live PHP server,
independent of the browser automation above.

| # | Check | Result |
|---|---|---|
| 1 | Unauthenticated create request fails | ✅ 401 |
| 2a | Editor updating another admin's post fails | ✅ 403 |
| 2b | Editor deleting another admin's post fails | ✅ 403 |
| 2c | Editor listing admin users fails | ✅ 403 (super_admin-only endpoint) |
| 3 | Duplicate slug fails | ✅ 409 |
| 4a | `<script>` stripped on live create | ✅ removed |
| 4b | `onerror` handler stripped | ✅ removed |
| 4c | Safe sibling content survives | ✅ `<p>safe</p>` preserved |
| 5 | Invalid image fails | ✅ 422, text file with `.jpg` extension rejected |
| 6a | Oversized image (9 MB) fails | ✅ blocked — see Findings §F2 for a caveat on the exact status code |
| 6b | Oversized-dimension image (4200×3000, over the 4000px cap) fails | ✅ 422 |
| 7a | PHP script disguised as `.jpg` fails | ✅ 422 |
| 7b | Raw `.php` upload fails | ✅ 422 |
| 7c | No `.php` files landed anywhere under `uploads/` | ✅ confirmed via filesystem scan after all attempts |
| extra | Authenticated POST missing CSRF header fails | ✅ 403 |

## 6. Date rules

Backed primarily by `blog_publishing_state_test.php` (35/35, see §2), which
is the authoritative, most thorough source for this — it exercises the full
state machine (draft → publish → edit → schedule → arrive → unpublish →
republish → feature) with direct timestamp assertions. This QA pass added
direct confirmation on top, using the posts created during the admin
workflow:

| Rule | Verified |
|---|---|
| `created_at` unchanged on edit | ✅ identical DB value across two separate edits of the same post |
| `updated_at` changes on a real edit | ✅ changed after each of two separate edits |
| `published_at` follows documented rules | ✅ `NULL` while draft; set once on first publish; retained (not replaced) across later edits |
| Scheduled visibility uses server time | ✅ a post with `publish_at` 2 days in the future: `published_at` stayed `NULL`, excluded from `/blog` and 404s on `show.php` by both `id` and `slug` for an anonymous caller |

See Findings §F3 for one minor, non-security precision-loss observation
found while verifying this.

---

## Findings

None of these are security issues or require a fix before this QA pass
concludes; recorded for awareness.

**F1 — Leftover `categories`/`tags` rows from repeated test-suite runs.**
`blog_crud_test.php` / `blog_related_test.php` intentionally leave behind
any category/tag rows they find-or-create (documented in their own
docstrings as "harmless, matches normal app behavior"). Running them
repeatedly over time visibly accumulates rows like `Automated Tests` and
several `Related Test Community <hex>` categories, seen in the admin
category-filter dropdown during this QA pass. Not a bug, but worth a
one-time manual cleanup of `categories`/`tags` in the real dev/staging
database if that clutter is undesirable.

**F2 — Oversized-upload rejection reaches the app's 413 only if `php.ini`
limits are raised to match.** The app's own cap (`upload_max_bytes()`,
default 8 MiB, overridable via `UPLOAD_MAX_BYTES`) is enforced in
`backend/helpers/Upload.php` **after** PHP has already accepted the upload.
In this local environment, PHP's own `upload_max_filesize=2M` /
`post_max_size=8M` (untouched defaults) are *below* the app's 8 MiB cap, so
a 9 MB upload never reaches the app's validation code at all — PHP empties
`$_FILES` first, and the endpoint returns a generic 400 "No file was
uploaded" instead of the intended, more helpful 413 "File exceeds the
maximum allowed size" message. The upload is still correctly blocked either
way (no security gap), but the error message an admin sees is misleading in
this configuration. This is a pre-existing, already-documented open item —
`docs/01-CMS-ARCHITECTURE.md` already flags "`php.ini` upload limits" as an
unverified hosting constraint to confirm before deploying. This QA pass
reproduces and confirms that gap concretely: **production's `php.ini` (or an
`.htaccess`/`.user.ini` override) needs `upload_max_filesize` and
`post_max_size` both set to at least `UPLOAD_MAX_BYTES` (8M by default, a
little higher to allow for multipart overhead, e.g. `9M`) for the app's own
size-limit message to actually be reachable.**

**F3 — `publish_at` silently loses sub-minute precision on a resave that
doesn't touch the publish date field.** Reproduced directly: a post first
published with no explicit publish date got `publish_at = published_at =
2026-08-05 17:47:56` (both set to the same "now"). Reopening that post to
edit an unrelated field (just the title) and saving again, **without
touching "Publish date & time"**, changed `publish_at` to
`2026-08-05 17:47:00` — seconds silently zeroed — while `published_at`
correctly stayed untouched at `:56` (the write-once rule held correctly).
Root cause: the edit form loads the existing `publish_at` into an
`<input type="datetime-local">`, which only carries minute precision;
`toDatetimeLocalValue()` (`src/pages/admin/posts/PostForm.jsx`) truncates
via `.slice(0, 16)`, and on save that truncated value is resubmitted as a
real (not blank) `publish_date`, overwriting the stored `publish_at` with a
second-truncated copy of itself. This has **no visible behavior effect**
today — a `publish_at` that's already in the past stays in the past either
way, so public visibility is unaffected, and `published_at` (the field the
docs call out as the historically-meaningful one) is correctly never
touched by this. It would only matter if something ever needed
`publish_at`'s original seconds precision. Not fixed as part of this QA
pass (no application code was changed), flagged for awareness.

## Fixes made

None. This was a QA-only pass — no application code was modified. The only
fixes made were within the throwaway QA test scripts themselves (documented
inline in §3 and §5 above where relevant), which do not touch the repo.

## Remaining blockers

None identified that block this QA pass. F2 and F3 above are open items for
awareness, not blockers.

## Manual production checks

These could not be exercised in this local environment and should be
confirmed against the real Hostinger deployment before or shortly after
shipping:

1. **`php.ini` upload limits** (`upload_max_filesize`, `post_max_size`) —
   confirm both are ≥ `UPLOAD_MAX_BYTES` on the real host; see Findings §F2.
   `docs/01-CMS-ARCHITECTURE.md` already tracks this as unverified.
2. **Apache `.htaccess` SPA fallback** (`public/.htaccess`) — this QA pass
   confirmed direct-route-refresh works under the **Vite dev server's** own
   fallback; the actual `mod_rewrite` rule that production depends on
   (`public/.htaccess`) was read and looks correct, but was never exercised
   against a real Apache instance (none available in this environment).
   Confirm `mod_rewrite` is enabled on the Hostinger plan and that a hard
   refresh on `/blog/<slug>` and other nested routes works post-deploy.
3. **Server timezone agreement in production.** `docs/BLOG-DATE-AND-PUBLISHING-RULES.md`
   documents that PHP and MySQL must agree on `Asia/Karachi`; the local
   environment used here had this already correctly configured (confirmed
   passing via `blog_publishing_state_test.php`'s own timezone-sanity
   assertions), but production's actual host clock/DB timezone should be
   spot-checked once, per that doc's own verification section.
4. **GD extension availability.** This local PHP CLI build had **no `gd`
   extension**, so every image upload in this QA pass stored the original
   validated bytes as-is rather than being re-decoded/re-encoded (the
   re-encode step is best-effort and skipped when `gd` is unavailable, per
   `backend/helpers/Upload.php`'s own docstring). All other validation
   layers (size, dimensions, MIME sniffing, extension match) were still
   fully exercised and passed. If production has `gd` available, the
   re-encode/downscale/EXIF-stripping path is additional hardening this QA
   pass did not get to exercise — worth a one-off manual upload check in
   production to confirm re-encoding actually engages there.
5. **Real cross-browser/interactive check.** All browser automation here
   ran headless Chromium via Selenium (the `claude-in-chrome` extension
   wasn't available in this environment). A quick manual pass in an actual
   Chrome/Safari/Firefox session — especially the TipTap editor's paste/drag
   -drop image handling and the mobile mobile Safari viewport — is worth
   doing once before/after shipping, since headless automation can't fully
   stand in for real device/browser quirks.

## Cleanup

All QA-created state was removed at the end of this pass; final DB counts
verified identical to the pre-QA baseline:

- 2 QA admin accounts deleted (`qa_super_admin`, `qa_editor`)
- 4 QA blog posts deleted (draft/edit/publish post, security-target post,
  XSS-test post, scheduled-future post — the 17-step admin workflow's own
  delete step accounted for one of these via the UI itself)
- 4 uploaded QA image files deleted from disk (`uploads/blog/covers/`,
  `uploads/blog/content/`) and their `uploads` table rows removed
- 2 QA categories and 3 QA tags deleted
- Final state: **1 admin, 6 blog posts, 11 uploads** — exactly matching what
  existed before this QA pass began
- Local `php -S` and `vite` dev server processes started for this QA pass
  were stopped
