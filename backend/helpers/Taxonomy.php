<?php

declare(strict_types=1);

require_once __DIR__ . '/Blog.php';

/**
 * Shared logic for backend/api/categories/*.php: name/slug normalization,
 * uniqueness checks, and row formatting. Slug generation reuses
 * blog_slugify()/blog_unique_table_slug() from Blog.php, which are generic
 * string utilities, not blog-post-specific. The $table parameter on these
 * functions is a holdover from when Tags shared this same (id, name UNIQUE,
 * slug UNIQUE, created_at) shape; today it's always 'categories'.
 */

/** Collapse internal whitespace and trim, so "  Tech   News " and "Tech News" collide as duplicates. */
function taxonomy_normalize_name(string $name): string
{
    return preg_replace('/\s+/', ' ', trim($name)) ?? '';
}

/** True if $name is already used (case-insensitively, per utf8mb4_unicode_ci) by a different row in $table. */
function taxonomy_name_exists(PDO $pdo, string $table, string $name, ?int $excludeId = null): bool
{
    if ($excludeId !== null) {
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE name = :name AND id != :id LIMIT 1");
        $stmt->execute(['name' => $name, 'id' => $excludeId]);
    } else {
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE name = :name LIMIT 1");
        $stmt->execute(['name' => $name]);
    }

    return $stmt->fetch() !== false;
}

/** True if $slug is already used by a different row in $table. */
function taxonomy_slug_exists(PDO $pdo, string $table, string $slug, ?int $excludeId = null): bool
{
    if ($excludeId !== null) {
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE slug = :slug AND id != :id LIMIT 1");
        $stmt->execute(['slug' => $slug, 'id' => $excludeId]);
    } else {
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE slug = :slug LIMIT 1");
        $stmt->execute(['slug' => $slug]);
    }

    return $stmt->fetch() !== false;
}

/** Fetch a single categories row by id, or null if it doesn't exist. */
function taxonomy_find(PDO $pdo, string $table, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT id, name, slug, description, created_at FROM {$table} WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/** Number of blog_posts rows currently assigned to categories.id = $id. */
function taxonomy_category_post_count(PDO $pdo, int $categoryId): int
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM blog_posts WHERE category_id = :id');
    $stmt->execute(['id' => $categoryId]);

    return (int) $stmt->fetchColumn();
}

/** Format a categories row (from taxonomy_find()) into the API's JSON shape. $postCount defaults to 0 (a freshly created category can't have any posts yet); pass taxonomy_category_post_count()'s result explicitly wherever the row might already have posts assigned. */
function taxonomy_format(array $row, int $postCount = 0): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'slug' => $row['slug'],
        'description' => $row['description'] ?? null,
        'created_at' => $row['created_at'],
        'post_count' => $postCount,
    ];
}
