<?php

declare(strict_types=1);

/**
 * Migration 003: scheduled publishing support for blog_posts.
 *
 * Adds `publish_at` (the admin-chosen target date/time a post should go
 * live) as a column distinct from `published_at` (the timestamp a post
 * actually first became live). Today the API writes a future-dated
 * `publish_date` straight into `published_at`, which is also read as "has
 * this post ever been published" — so a future-dated, non-draft post shows
 * up as published immediately instead of waiting. `publish_at` gives a
 * future session something to filter public queries on
 * (`status = 'published' AND (publish_at IS NULL OR publish_at <= NOW())`)
 * without overloading `published_at`'s existing meaning or introducing a
 * third `status` enum value.
 *
 * No `status` enum change is made here: a "scheduled" state is fully
 * representable as `status = 'published'` + a future `publish_at`, per the
 * existing draft/published model — see docs/11A-BLOG-IMPLEMENTATION-AUDIT.md.
 *
 * Every step checks information_schema before acting, so this is safe to run
 * against either a brand-new database (schema.sql already creates the final
 * shape, so every step below is a no-op) or an existing one with real posts
 * already in it (nothing here touches title/slug/content/etc., and no rows
 * are dropped).
 *
 * Returned as ['version' => ..., 'description' => ..., 'up' => callable]
 * for backend/migrate.php to run and record.
 */

return [
    'version' => '003_blog_publish_at',
    'description' => 'blog_posts: add publish_at (scheduled publish target, distinct from published_at) + supporting index, backfill from published_at',
    'up' => static function (PDO $pdo): void {
        $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();

        $columnExists = static function (string $table, string $column) use ($pdo, $dbName): bool {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND COLUMN_NAME = :column'
            );
            $stmt->execute(['db' => $dbName, 'table' => $table, 'column' => $column]);
            return ((int) $stmt->fetchColumn()) > 0;
        };

        $indexExists = static function (string $table, string $index) use ($pdo, $dbName): bool {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND INDEX_NAME = :index'
            );
            $stmt->execute(['db' => $dbName, 'table' => $table, 'index' => $index]);
            return ((int) $stmt->fetchColumn()) > 0;
        };

        // Step 1: add publish_at, nullable, right before published_at.
        if (!$columnExists('blog_posts', 'publish_at')) {
            $pdo->exec('ALTER TABLE blog_posts ADD COLUMN publish_at DATETIME NULL AFTER seo_description');
        }

        // Step 2: backfill from published_at for any row that predates this
        // column, so an existing scheduled-looking date isn't silently lost
        // once the API starts reading publish_at instead of published_at.
        $pdo->exec(
            'UPDATE blog_posts SET publish_at = published_at
             WHERE publish_at IS NULL AND published_at IS NOT NULL'
        );

        // Step 3: index to support "hide until publish_at arrives" queries.
        if (!$indexExists('blog_posts', 'idx_posts_publish_at')) {
            $pdo->exec('ALTER TABLE blog_posts ADD INDEX idx_posts_publish_at (status, publish_at)');
        }
    },
];
