<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Blog.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * GET /api/blog/related.php?id=123
 * GET /api/blog/related.php?slug=some-post
 *
 * Powers the article page's "Related Articles" section and previous/next
 * navigation. Exactly one of `id`/`slug` must be given, identifying the
 * *current* article; a draft 404s for anonymous callers, same as show.php.
 *
 * Every candidate (related, previous, next) is restricted to public posts —
 * published, and not scheduled for the future — regardless of whether the
 * current article itself is a draft an admin is previewing.
 *
 * Related posts are ranked same-category first, then by most recent; a
 * candidate outside the current post's category is excluded entirely rather
 * than padded in as an unrelated "recent post" (an empty `related` array is
 * a valid, expected response). This is computed with a single ranked SQL
 * query and previous/next with one indexed lookup each (see
 * blog_fetch_adjacent_public_post), rather than fetching every post and
 * ranking client-side, so the cost doesn't grow with the size of the blog.
 */

const RELATED_POSTS_LIMIT = 3;

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
        $stmt = $pdo->prepare('SELECT * FROM blog_posts WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM blog_posts WHERE slug = :slug LIMIT 1');
        $stmt->execute(['slug' => $slug]);
    }

    $current = $stmt->fetch();

    if ($current === false || ($admin === null && !blog_is_visible_to_public($current))) {
        json_response(404, ['error' => 'Blog post not found']);
    }

    $currentId = (int) $current['id'];
    $categoryId = (int) $current['category_id'];
    $visible = blog_public_visibility_sql();

    // --- Related posts -----------------------------------------------
    $relatedSql = "SELECT bp.*, a.full_name AS author_name, c.name AS category_name
             FROM blog_posts bp
             LEFT JOIN admins a ON a.id = bp.author_id
             LEFT JOIN categories c ON c.id = bp.category_id
             WHERE bp.id != :current_id AND bp.category_id = :category_id AND {$visible}
             ORDER BY bp.publish_at DESC, bp.id DESC
             LIMIT :limit";

    $relatedStmt = $pdo->prepare($relatedSql);
    $relatedStmt->bindValue('current_id', $currentId, PDO::PARAM_INT);
    $relatedStmt->bindValue('category_id', $categoryId, PDO::PARAM_INT);
    $relatedStmt->bindValue('now', date('Y-m-d H:i:s'));
    $relatedStmt->bindValue('limit', RELATED_POSTS_LIMIT, PDO::PARAM_INT);
    $relatedStmt->execute();
    $relatedRows = $relatedStmt->fetchAll();

    $related = array_map(
        static function (array $row) use ($pdo): array {
            blog_backfill_published_at($pdo, $row);
            return blog_format_post($row);
        },
        $relatedRows
    );

    // --- Previous / next -----------------------------------------------
    $previousRow = blog_fetch_adjacent_public_post($pdo, $currentId, $current['publish_at'], 'previous');
    $nextRow = blog_fetch_adjacent_public_post($pdo, $currentId, $current['publish_at'], 'next');

    $formatAdjacent = static function (?array $row) use ($pdo): ?array {
        if ($row === null) {
            return null;
        }
        blog_backfill_published_at($pdo, $row);
        return blog_format_post($row);
    };

    json_response(200, [
        'data' => [
            'related' => $related,
            'previous' => $formatAdjacent($previousRow),
            'next' => $formatAdjacent($nextRow),
        ],
    ]);
} catch (Throwable $e) {
    error_log('[blog/related] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
