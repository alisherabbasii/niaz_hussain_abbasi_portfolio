# Database Foundation

Implements the database layer described in `docs/01-CMS-ARCHITECTURE.md` §4/§6.
**Scope of this doc/commit: database foundation only** — schema, connection
handling, config loading, and the installer. No routing, controllers,
authentication endpoints, or React changes are part of this layer; those are
later phases in the architecture doc.

---

## 1. What was built

| File | Purpose |
|---|---|
| `backend/database/schema.sql` | All `CREATE TABLE IF NOT EXISTS` statements. Idempotent, InnoDB, `utf8mb4`/`utf8mb4_unicode_ci` throughout. |
| `backend/install.php` | One-time (safely re-runnable) installer: creates the database, applies the schema, records the schema version, seeds the first admin user, creates upload directories. |
| `backend/config/env.php` | Minimal `.env` parser (no Composer dependency). Populates `getenv()`/`$_ENV`/`$_SERVER`. |
| `backend/config/database.php` | `db_connect()` — builds a PDO connection from environment config. Single source of DSN/PDO options. |
| `backend/helpers/Database.php` | `Database::getConnection()` — lazily-initialized, request-scoped singleton wrapping `db_connect()`, so future controllers/models share one connection. |
| `.env.example` | Template for `.env` (never committed). Documents every variable the backend reads. |

No file under `src/` (the React app) was touched.

---

## 2. Schema

### Tables

- **`migrations`** — schema version tracker. `install.php` inserts one row (`001_initial_schema`) the first time it runs; re-running is a no-op.
- **`admins`** — multi-user login. `password_hash` only (never plaintext/reversible), `role` (`owner` | `admin`), `is_active` flag, `last_login_at`.
- **`categories`** — first-class, one per post.
- **`tags`** — first-class, many-to-many with posts.
- **`blog_posts`** — post content and metadata: `status` (`draft` | `published`), `featured`, `seo_title`/`seo_description` (nullable, fall back to `title`/`description` at read time), `publish_at` (admin-chosen scheduling target, added by `migrations/003_blog_publish_at.php` — nullable, may be a future date), `published_at` (timestamp a post actually first went live, set once — distinct from `updated_at`), `FULLTEXT` index on `(title, description, content)` for server-side search. There is no `scheduled` status value: a future-scheduled post is `status = 'published'` with a future `publish_at`; hiding it from public queries until `publish_at` arrives is application-layer work, not yet implemented (`idx_posts_publish_at (status, publish_at)` exists to support that query once it is).
- **`blog_post_tags`** — join table, composite PK `(post_id, tag_id)`, cascading deletes both directions.
- **`uploads`** — one row per uploaded file (cover images and in-editor images share this table), storing disk path, public URL, MIME type, size, and dimensions.
- **`settings`** — generic key/value store for site-wide config (e.g. default SEO fallbacks) that doesn't warrant its own table.

### Foreign keys

- `blog_posts.category_id → categories.id` — `ON DELETE SET NULL` (deleting a category doesn't delete its posts).
- `blog_posts.author_id → admins.id` — `ON DELETE RESTRICT` (an admin can't be deleted while they still own posts).
- `blog_post_tags.post_id → blog_posts.id`, `blog_post_tags.tag_id → tags.id` — both `ON DELETE CASCADE`.
- `uploads.uploaded_by → admins.id` — `ON DELETE RESTRICT`.

### Why this table set (vs. the fuller design in §4 of the architecture doc)

The architecture doc's §4 also sketches `login_attempts` (rate-limiting) and
`audit_log` (admin action history) tables. Those belong to the **authentication
and admin-CRUD phases** (Phase 2/3), not the database foundation — they're
intentionally deferred so this layer stays scoped to storage, not behavior.
Add them as new migrations when those phases are implemented, rather than
retrofitting them here.

---

## 3. Installer (`backend/install.php`)

Steps, in order, each independently idempotent:

1. `CREATE DATABASE IF NOT EXISTS` (using `DB_NAME` from `.env`).
2. Apply every statement in `schema.sql` (`CREATE TABLE IF NOT EXISTS`).
3. Record `001_initial_schema` in `migrations`, unless already present.
4. Insert the first admin from `INSTALL_ADMIN_*` env vars — `password_hash()`'d, `role = 'owner'` if it's the very first admin row, otherwise `role = 'admin'`. Skipped if an admin with that email already exists.
5. Create the upload directories (`UPLOADS_PATH`, plus `covers/` and `blog/` subdirectories) if missing, and drop a `.htaccess` inside them that disables PHP execution (defense-in-depth per §7.7 of the architecture doc — uploaded files must never be runnable as scripts, even before an upload endpoint exists).

### Running it

```bash
# Preferred — CLI, works on any host with shell access:
php backend/install.php
```

If the host has no shell access, `install.php` can be run over HTTP instead,
but only with an explicit token:

```
https://yoursite.com/install.php?token=<INSTALL_TOKEN>
```

`INSTALL_TOKEN` must be set in `.env` for the web path to work at all — with
it unset (the `.env.example` default), web access is refused outright.
**Delete or block `install.php` after installing** — it has no reason to stay
reachable in production once the schema exists.

### Safe to re-run

Every step checks current state first (table existence via `IF NOT EXISTS`,
migration/admin rows via `SELECT` before `INSERT`, directories via `is_dir()`).
Running it twice against an already-installed database reports what it
skipped and makes no destructive changes.

---

## 4. Configuration (`.env`)

Copy `.env.example` to `.env` (gitignored, never committed) and fill in real
values:

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_CHARSET` | Connection details. No default credentials ship anywhere — a missing required variable throws rather than silently connecting with a guessed value. |
| `APP_ENV` | `development` / `production` — reserved for later phases (error verbosity, etc.); not yet branched on by this layer. |
| `UPLOADS_PATH` | Where uploaded files live on disk, relative to `backend/` unless absolute. |
| `INSTALL_ADMIN_NAME`, `INSTALL_ADMIN_EMAIL`, `INSTALL_ADMIN_PASSWORD` | Used once, by `install.php`, to seed the first admin. Not read anywhere else. |
| `INSTALL_TOKEN` | Only consulted if `install.php` is accessed over HTTP. Leave blank to force CLI-only installation. |

`backend/config/env.php`'s loader never overwrites a variable that's already
set in the real process environment — so on hosts that inject config via
actual env vars (rather than a `.env` file), those take precedence
automatically.

---

## 5. Connecting from future backend code

```php
require_once __DIR__ . '/../helpers/Database.php';

$pdo = Database::getConnection();
$stmt = $pdo->prepare('SELECT * FROM blog_posts WHERE slug = :slug');
$stmt->execute(['slug' => $slug]);
$post = $stmt->fetch();
```

- Always PDO, always prepared statements with bound parameters — no
  string-concatenated SQL anywhere (`PDO::ATTR_EMULATE_PREPARES => false`
  forces real server-side prepares, not just PDO-emulated ones).
- `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION` — failures throw rather than
  requiring manual error-code checks after every call.
- One connection per request, created lazily on first use via
  `Database::getConnection()`.

---

## 6. Verification performed

- `php -l` on all four new PHP files — no syntax errors.
- End-to-end run against a local MariaDB instance: `schema.sql` applied
  cleanly (verified table/FK/`FULLTEXT` index shapes via `SHOW CREATE TABLE`),
  applied a second time with no errors (`IF NOT EXISTS` idempotency),
  `install.php`'s migration-recording and admin-seeding logic verified
  (`password_hash`/`password_verify` round-trip, duplicate-admin skip,
  first-admin-gets-`owner`-role), and upload-directory creation verified
  idempotent on repeat runs.
- Ran with no `.env` present — fails fast with `Missing required environment
  variable: DB_NAME` instead of connecting with a default/guessed value.

---

## 7. Explicitly out of scope here

Per the architecture doc's phasing, none of the following are part of this
database foundation and are not implemented yet:

- REST API / routing / controllers (Phase 1's other half).
- Session-based auth, login/logout endpoints, CSRF, rate limiting (Phase 2).
- Admin CRUD UI, image upload endpoints, HTML sanitization (Phase 3).
- Public API consumed by React, or any change to `src/` (Phase 4).
- Content migration from `content/blog/*.md` (Phase 5).
