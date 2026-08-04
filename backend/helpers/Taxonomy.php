<?php

declare(strict_types=1);

require_once __DIR__ . '/Blog.php';

/**
 * Shared logic for backend/api/categories/*.php and backend/api/tags/*.php.
 * Both tables share an identical (id, name UNIQUE, slug UNIQUE, created_at)
 * shape, so name normalization, uniqueness checks, and row formatting live
 * here once instead of being duplicated per resource. Slug generation reuses
 * blog_slugify()/blog_unique_table_slug() from Blog.php, which are generic
 * string utilities, not blog-post-specific.
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

/** Fetch a single categories/tags row by id, or null if it doesn't exist. */
function taxonomy_find(PDO $pdo, string $table, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT id, name, slug FROM {$table} WHERE id = :id LIMIT 1");
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

/** Format a categories/tags row (from taxonomy_find()) into the API's JSON shape. */
function taxonomy_format(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'slug' => $row['slug'],
    ];
}
