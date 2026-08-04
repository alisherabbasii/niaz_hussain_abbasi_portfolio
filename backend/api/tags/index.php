<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Taxonomy.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';

/**
 * GET /api/tags/index.php
 * Public read: every tag, alphabetically by name. Tag names/slugs are
 * already exposed via published posts (blog/index.php, blog/show.php), so
 * listing them on their own adds no new exposure and lets the public blog
 * pages build a tag filter without authenticating.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();

try {
    $pdo = Database::getConnection();

    $rows = $pdo->query('SELECT id, name, slug FROM tags ORDER BY name ASC')->fetchAll();

    json_response(200, ['data' => array_map('taxonomy_format', $rows)]);
} catch (Throwable $e) {
    error_log('[tags/index] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
