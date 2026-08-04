<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Blog.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * GET /api/blog/show.php?id=123
 * GET /api/blog/show.php?slug=some-post
 *
 * Exactly one of `id`/`slug` must be given. Draft posts 404 for anonymous
 * callers (rather than revealing their existence via a 403/401).
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();

$id = isset($_GET['id']) && ctype_digit((string) $_GET['id']) ? (int) $_GET['id'] : null;
$slug = isset($_GET['slug']) ? trim((string) $_GET['slug']) : '';

if ($id === null && $slug === '') {
    json_response(422, ['error' => 'id or slug is required']);
}

try {
    $admin = auth_current_admin();
    $pdo = Database::getConnection();

    if ($id !== null) {
        $stmt = $pdo->prepare(blog_select_base() . ' WHERE bp.id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
    } else {
        $stmt = $pdo->prepare(blog_select_base() . ' WHERE bp.slug = :slug LIMIT 1');
        $stmt->execute(['slug' => $slug]);
    }

    $row = $stmt->fetch();

    if ($row === false || ($admin === null && !blog_is_visible_to_public($row))) {
        json_response(404, ['error' => 'Blog post not found']);
    }

    blog_backfill_published_at($pdo, $row);

    $tags = blog_fetch_tags($pdo, (int) $row['id']);

    json_response(200, ['data' => blog_format_post($row, $tags)]);
} catch (Throwable $e) {
    error_log('[blog/show] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
