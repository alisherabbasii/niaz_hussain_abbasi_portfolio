<?php

declare(strict_types=1);

/**
 * Migration 004: retire the Tags module, make Category a required
 * relationship, and add categories.description.
 *
 * The Blog CMS is being simplified down to a single first-class taxonomy —
 * Category — with full admin CRUD; Tags (free-text, auto-created, no real
 * management UI) and the never-built "Media" library placeholder are being
 * removed. This migration brings an existing database up to that shape:
 *
 *  1. Add categories.description (nullable) — the Category CRUD form's
 *     optional description field.
 *  2. Find-or-create a "General" category as the fallback for any post that
 *     predates category_id being required.
 *  3. Backfill blog_posts.category_id = General.id wherever it's NULL, so no
 *     post is left uncategorized before the column is tightened.
 *  4. Make blog_posts.category_id NOT NULL and switch its FK from
 *     ON DELETE SET NULL to ON DELETE RESTRICT — a DB-level backstop
 *     matching the app-level "can't delete a category still assigned to
 *     posts" check in backend/api/categories/delete.php. Every post must
 *     always have a category; orphaning one by deleting its category out
 *     from under it is no longer possible even at the schema level.
 *  5. Drop blog_post_tags then tags (children-before-parent, since
 *     blog_post_tags.tag_id FKs into tags).
 *
 * Every step checks current state before acting, so this is safe to run
 * against either a brand-new database (schema.sql already creates the final
 * shape, so every step below is a no-op) or an existing one with real posts
 * and tags already in it.
 *
 * Returned as ['version' => ..., 'description' => ..., 'up' => callable]
 * for backend/migrate.php to run and record.
 */

return [
    'version' => '004_categories_cleanup',
    'description' => 'categories: add description; blog_posts.category_id: backfill + NOT NULL + ON DELETE RESTRICT; drop tags/blog_post_tags',
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

        $tableExists = static function (string $table) use ($pdo, $dbName): bool {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table'
            );
            $stmt->execute(['db' => $dbName, 'table' => $table]);
            return ((int) $stmt->fetchColumn()) > 0;
        };

        $fkExists = static function (string $table, string $constraint) use ($pdo, $dbName): bool {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                 WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND CONSTRAINT_NAME = :constraint
                   AND CONSTRAINT_TYPE = \'FOREIGN KEY\''
            );
            $stmt->execute(['db' => $dbName, 'table' => $table, 'constraint' => $constraint]);
            return ((int) $stmt->fetchColumn()) > 0;
        };

        $columnIsNullable = static function (string $table, string $column) use ($pdo, $dbName): bool {
            $stmt = $pdo->prepare(
                'SELECT IS_NULLABLE FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND COLUMN_NAME = :column'
            );
            $stmt->execute(['db' => $dbName, 'table' => $table, 'column' => $column]);
            return $stmt->fetchColumn() === 'YES';
        };

        // Step 1: categories.description.
        if (!$columnExists('categories', 'description')) {
            $pdo->exec('ALTER TABLE categories ADD COLUMN description TEXT NULL AFTER slug');
        }

        // Step 2: find-or-create the "General" fallback category.
        $stmt = $pdo->prepare('SELECT id FROM categories WHERE slug = :slug LIMIT 1');
        $stmt->execute(['slug' => 'general']);
        $generalId = $stmt->fetchColumn();

        if ($generalId === false) {
            $insert = $pdo->prepare('INSERT INTO categories (name, slug) VALUES (:name, :slug)');
            $insert->execute(['name' => 'General', 'slug' => 'general']);
            $generalId = (int) $pdo->lastInsertId();
        } else {
            $generalId = (int) $generalId;
        }

        // Step 3: backfill any post left without a category.
        $backfill = $pdo->prepare('UPDATE blog_posts SET category_id = :category_id WHERE category_id IS NULL');
        $backfill->execute(['category_id' => $generalId]);

        // Step 4: category_id NOT NULL + FK switched to ON DELETE RESTRICT.
        if ($fkExists('blog_posts', 'fk_posts_category')) {
            $pdo->exec('ALTER TABLE blog_posts DROP FOREIGN KEY fk_posts_category');
        }
        if ($columnIsNullable('blog_posts', 'category_id')) {
            $pdo->exec('ALTER TABLE blog_posts MODIFY COLUMN category_id INT UNSIGNED NOT NULL');
        }
        if (!$fkExists('blog_posts', 'fk_posts_category')) {
            $pdo->exec(
                'ALTER TABLE blog_posts ADD CONSTRAINT fk_posts_category
                 FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT'
            );
        }

        // Step 5: drop the Tags module's tables (children-before-parent).
        if ($tableExists('blog_post_tags')) {
            $pdo->exec('DROP TABLE blog_post_tags');
        }
        if ($tableExists('tags')) {
            $pdo->exec('DROP TABLE tags');
        }
    },
];
