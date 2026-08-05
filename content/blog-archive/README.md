# Archived Markdown articles

These 7 files are **not read by any code** — the blog is now database-backed
(`backend/api/blog/*.php` + `blog_posts` table), and nothing in `src/` or
`backend/` reads `content/blog*/*.md` anymore. This directory only exists so
the content itself isn't silently lost.

None of these slugs currently exist in the `blog_posts` table. Six of the
seven were `draft: false` under the old static-site model (i.e. they were
"live" content at the time the site ran on Markdown files); one
(`notes-on-gps-base-station-calibration.md`) was still `draft: true` and was
never published.

To bring one of these back onto the live site, an admin has to manually
re-create it through `/admin/blogs/new`: paste/reformat the body into the
TipTap editor and re-enter title, description, category, tags, and date from
the frontmatter. There is no automated importer.

See `docs/BLOG-MIGRATION-INVENTORY.md` for the per-file status and history
of the Markdown → database cleanup.
