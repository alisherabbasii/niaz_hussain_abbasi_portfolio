# Blog date & publishing-state rules

Scope: `backend/api/blog/*.php`, `backend/helpers/Blog.php`, `blog_posts`
schema. This is the current, live PHP+MySQL CMS backend — not the older
Markdown/static-site architecture (removed; see
`docs/BLOG-MIGRATION-INVENTORY.md` and `docs/11A-BLOG-IMPLEMENTATION-AUDIT.md`
§0 for that history). Nothing here requires a rebuild or redeploy to take
effect — every request re-evaluates publishing state against the current
server time.

## Server timezone

The backend runs on **`Asia/Karachi`** (Pakistan Standard Time, fixed
`UTC+5`, no DST) — this site's production timezone, matching its audience
and the admin's own wall clock. Override it via `APP_TIMEZONE` in `.env` if
that ever changes; if unset, `Asia/Karachi` is the default (see
`backend/config/env.php::app_timezone()`).

This is applied in two places so every date computation in the system
agrees, instead of silently drifting apart:

- **PHP**: `date_default_timezone_set()` runs the moment
  `backend/config/env.php` is included — which happens, directly or
  transitively, at the top of every API endpoint. Every `date()`,
  `strtotime()`, and comparison against a stored `publish_at`/`published_at`
  value uses this timezone.
- **MySQL**: `backend/config/database.php::db_connect()` sets the session's
  `time_zone` to the same offset (computed fresh per connection via
  `DateTime`, so it stays correct even if `APP_TIMEZONE` is ever changed to
  a zone that observes DST). This keeps `created_at`/`updated_at`
  (`DEFAULT CURRENT_TIMESTAMP` / `ON UPDATE CURRENT_TIMESTAMP`, computed by
  MySQL itself) on the same wall clock as `publish_at`/`published_at`
  (computed by PHP).

Before this, PHP had no explicit `date.timezone` set at all — it silently
fell back to whatever the host's `php.ini` default was (commonly `UTC` on
shared hosting), which could disagree with both the admin's own clock and
MySQL's server-default timezone. `backend/tests/blog_publishing_state_test.php`
asserts explicitly that PHP has a non-default timezone configured and that
PHP/MySQL agree on the current time within a couple of seconds.

## The four date columns

| Column | Set by | Rule |
|---|---|---|
| `created_at` | MySQL, `DEFAULT CURRENT_TIMESTAMP` | Set once, at row insert. **Never changes again**, including on every subsequent edit. |
| `updated_at` | MySQL, `ON UPDATE CURRENT_TIMESTAMP` | Bumped by MySQL automatically whenever any column in the row changes via an admin-initiated `create`/`update` call. **Not** bumped by the system's own `published_at` backfill (see below) — that's a catch-up, not an edit. |
| `publish_at` | Admin, via the `publish_at`/`publish_date` request field | The **scheduling target**: the wall-clock moment a published post should start being publicly visible. Nullable — `NULL` means "no schedule, visible as soon as `status = 'published'`." |
| `published_at` | Computed server-side (`blog_compute_publish_state()` in `backend/helpers/Blog.php`) | The **historical record** of when a post first actually went live. Set exactly once; never overwritten after that, even by later edits, unpublishing, or rescheduling. |

`publish_at` and `published_at` answer two different questions:
`publish_at` is "when should/did this go live" (an instruction, settable by
an admin at any time, including into the future); `published_at` is "when
did this first actually happen" (a fact, write-once). The API exposes
`published_at` under the field name `publish_date` in JSON responses —
`blog_format_post()` in `backend/helpers/Blog.php` is the single mapping
point for that rename.

## State model

There is no `scheduled` value in the `status` enum (`draft` / `published`
only — see `backend/database/migrations/003_blog_publish_at.php` for why a
third enum value wasn't introduced). "Scheduled" is fully representable as
`status = 'published'` with a future `publish_at`:

| Admin state | `status` | `publish_at` | Publicly visible? |
|---|---|---|---|
| Draft | `draft` | any (irrelevant while draft) | No |
| Published, immediate | `published` | `NULL` or `<= now` | Yes |
| Published, scheduled (future) | `published` | `> now` | No — until `publish_at` passes |
| Unpublished (was live, taken down) | `draft` | unchanged, retained | No |

Visibility for an anonymous/public caller is a pure function of the current
row plus the current time — `blog_is_visible_to_public()`:

```php
$row['status'] === 'published'
    && ($row['publish_at'] === null || $row['publish_at'] <= date('Y-m-d H:i:s'))
```

`published_at` is **not** part of this check. A post can be `published`
with a stale-looking `published_at` from a previous live period while
currently hidden (e.g. rescheduled into the future after being
unpublished) — see "Republishing" below.

Both `backend/api/blog/show.php` (single post) and
`backend/api/blog/index.php` (listing) apply this filter for anonymous
callers; an authenticated admin session sees every status (`show.php`
unconditionally; `index.php` via its `draft` query param). A draft
requested by slug or id from the public API **404s** — it does not
distinguish "doesn't exist" from "exists but isn't public," so existence
of an unpublished post is never leaked.

## Draft

- Visible in admin: `GET /api/blog/show.php` and `index.php` return it
  unconditionally for an authenticated caller.
- Not visible publicly: excluded from `index.php`'s public listing;
  `show.php` 404s for both `?id=` and `?slug=` lookups by an anonymous
  caller.

## Publish (immediate)

Setting `status: 'published'` (or `draft: false`) with no `publish_at`
given defaults the scheduling target to "now" — `blog_compute_publish_state()`
falls back to `date('Y-m-d H:i:s')` when neither the request nor the
existing row has a `publish_at`. Since the target is `<= now`,
`published_at` is set in the same write. The post is publicly visible
immediately.

## Scheduled (future publication)

Setting `status: 'published'` with a future `publish_at`:

- Saves successfully (any `strtotime()`-parseable date/time string is
  accepted; validated in `blog_parse_datetime()`).
- Is visible in admin (full row returned to any authenticated caller).
- Is hidden from public reads until `publish_at` arrives (`show.php` 404s
  it, `index.php` excludes it).
- `published_at` stays `NULL` while still in the future.
- **Becomes public automatically** the moment `publish_at <= now`, on the
  very next request — no cron, no rebuild, no redeploy, no further admin
  action required. This falls directly out of `blog_is_visible_to_public()`
  re-evaluating the stored `publish_at` against the current request's
  timestamp every time.

### `published_at` backfill for untouched scheduled posts

`blog_compute_publish_state()` only runs during a `create`/`update` call —
so if a scheduled post's `publish_at` passes and nobody edits it again,
nothing would ever set `published_at`, leaving it `NULL` indefinitely even
though the post is now genuinely live. Beyond being factually wrong
("published_at is set when first published" wouldn't hold), a stuck `NULL`
also corrupts list ordering: `index.php` sorts
`ORDER BY published_at DESC, created_at DESC`, and MySQL sorts `NULL`
last in a `DESC` ordering — so an actually-live post would silently sink to
the bottom of every listing.

`blog_backfill_published_at()` (`backend/helpers/Blog.php`) closes this
gap: every read through `show.php` or `index.php` opportunistically checks
whether a `published` row's `publish_at` has passed with `published_at`
still `NULL`, and if so, sets `published_at = publish_at` right then, in
that request. This is a lazy catch-up, not an edit — the `UPDATE` statement
explicitly self-assigns `updated_at = updated_at` to suppress MySQL's
`ON UPDATE CURRENT_TIMESTAMP`, so `updated_at` does not change as a side
effect of a system read.

## Editing a published post

`created_at` never changes. `updated_at` changes automatically (MySQL's
`ON UPDATE CURRENT_TIMESTAMP`) whenever any field actually changes value.
`published_at` is **retained** — `blog_compute_publish_state()` only ever
writes to it when it is currently `NULL`; an edit that doesn't touch
scheduling leaves `publish_at`/`published_at` exactly as they were.

## Unpublishing

Setting `status: 'draft'` on a published post hides it publicly
immediately (the `status = 'published'` clause in
`blog_is_visible_to_public()` fails). `publish_at` and `published_at` are
both **left untouched** — unpublishing is not treated as "never was
published"; the historical record survives.

## Republishing

Setting `status: 'published'` again on a post that has a non-`NULL`
`published_at` from a previous publish **does not replace it** —
`blog_compute_publish_state()` only sets `published_at` when it is
currently `NULL`. This is the documented rule: `published_at` always
reflects the **first** time a post ever went live, not the most recent
time. If a post is unpublished and later republished — with or without a
new `publish_at` — its original `published_at` timestamp is preserved.

This holds even when republishing sets a new *future* `publish_at`
(rescheduling): the post's `published_at` keeps showing its original
first-publish date even though the post is currently hidden again pending
the new schedule. This is intentional — `published_at` is a historical
fact, not a "currently live" flag; use `status` + `publish_at` (i.e.
`blog_is_visible_to_public()`) to determine current visibility, never
`published_at`.

## Featured

`featured` is an independent boolean, settable on create or update
regardless of `status`. It does not gate visibility by itself —
`index.php`'s `featured=1` filter is combined with the same public
visibility clause anonymous callers always get
(`status = 'published' AND (publish_at IS NULL OR publish_at <= now)`), so:

- A draft or not-yet-scheduled-live post with `featured = true` will
  **not** appear in a public `featured=1` query.
- Only a post that is simultaneously featured, published, and currently
  available (per the same rules as any other post) appears in public
  featured results.
- Toggling `featured` off/on again is a normal field update — no impact on
  `publish_at`/`published_at`.

## Verification

Two automated integration suites exercise this against a real running
instance (PHP built-in server + MySQL/MariaDB):

```bash
php -S 127.0.0.1:8987 -t backend &
php backend/tests/blog_crud_test.php              # broad CRUD/auth/role coverage
php backend/tests/blog_publishing_state_test.php  # the publishing-state rules on this page
```

`blog_publishing_state_test.php` walks the full state machine end to end:
draft creation and its admin-visible/public-hidden split, immediate
publish, editing a published post (`updated_at` changes, `created_at`
doesn't, `published_at` is retained), scheduling a future post and
confirming it's absent from the public API, simulating its `publish_at`
arriving with **no** further edit (proving both automatic public visibility
and the `published_at` backfill, and that the backfill doesn't bump
`updated_at`), unpublish, republish (`published_at` unchanged), and
feature/unfeature (including that a featured-but-unpublished post is
excluded from public featured results). Both suites passed in full at the
time this document was written (56/56 and 35/35 assertions respectively).
