<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Taxonomy.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';

/**
 * GET /api/categories/index.php
 * Public read: every category, alphabetically by name, with its assigned
 * post count. Category names/slugs are already exposed via published posts
 * (blog/index.php, blog/show.php), so listing them on their own adds no new
 * exposure and lets both the public blog pages and the admin Category
 * management UI build off one endpoint.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();

try {
    $pdo = Database::getConnection();

    // Single query with the post count joined in, rather than one
    // taxonomy_category_post_count() call per row.
    $rows = $pdo->query(
        'SELECT c.id, c.name, c.slug, c.description, c.created_at, COUNT(bp.id) AS post_count
         FROM categories c
         LEFT JOIN blog_posts bp ON bp.category_id = c.id
         GROUP BY c.id
         ORDER BY c.name ASC'
    )->fetchAll();

    $data = array_map(
        static fn (array $row): array => taxonomy_format($row, (int) $row['post_count']),
        $rows
    );

    json_response(200, ['data' => $data]);
} catch (Throwable $e) {
    error_log('[categories/index] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
