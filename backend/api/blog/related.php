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
 * Related posts are ranked same-category first, then by number of shared
 * tags, then by most recent; a candidate sharing neither is excluded
 * entirely rather than padded in as an unrelated "recent post" (an empty
 * `related` array is a valid, expected response). This is computed with a
 * single ranked SQL query and previous/next with one indexed lookup each
 * (see blog_fetch_adjacent_public_post), rather than fetching every post
 * and ranking client-side, so the cost doesn't grow with the size of the
 * blog.
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
    $categoryId = $current['category_id'] !== null ? (int) $current['category_id'] : null;
    $tags = blog_fetch_tags($pdo, $currentId);
    $visible = blog_public_visibility_sql();

    // --- Related posts -----------------------------------------------
    // Real (non-emulated) prepared statements can't reuse one named
    // placeholder more than once per query (see the same pattern in
    // backend/helpers/Blog.php's blog_resolve_author_id), so the tag names
    // each get their own numbered placeholder.
    $tagParams = [];
    $tagPlaceholders = [];
    foreach (array_values($tags) as $i => $tagName) {
        $key = "tag{$i}";
        $tagPlaceholders[] = ":{$key}";
        $tagParams[$key] = $tagName;
    }

    $sharedTagExpr = $tagPlaceholders !== []
        ? 'COUNT(DISTINCT CASE WHEN t.name IN (' . implode(', ', $tagPlaceholders) . ') THEN t.id END)'
        : '0';
    $categoryMatchExpr = $categoryId !== null ? '(bp.category_id = :category_id)' : '0';

    $relatedSql = "SELECT bp.*, a.full_name AS author_name, c.name AS category_name,
                {$categoryMatchExpr} AS category_match,
                {$sharedTagExpr} AS shared_tag_count
             FROM blog_posts bp
             LEFT JOIN admins a ON a.id = bp.author_id
             LEFT JOIN categories c ON c.id = bp.category_id
             LEFT JOIN blog_post_tags bpt ON bpt.post_id = bp.id
             LEFT JOIN tags t ON t.id = bpt.tag_id
             WHERE bp.id != :current_id AND {$visible}
             GROUP BY bp.id
             HAVING category_match = 1 OR shared_tag_count > 0
             ORDER BY category_match DESC, shared_tag_count DESC, bp.publish_at DESC, bp.id DESC
             LIMIT :limit";

    $relatedStmt = $pdo->prepare($relatedSql);
    $relatedStmt->bindValue('current_id', $currentId, PDO::PARAM_INT);
    if ($categoryId !== null) {
        $relatedStmt->bindValue('category_id', $categoryId, PDO::PARAM_INT);
    }
    foreach ($tagParams as $key => $value) {
        $relatedStmt->bindValue($key, $value, PDO::PARAM_STR);
    }
    $relatedStmt->bindValue('now', date('Y-m-d H:i:s'));
    $relatedStmt->bindValue('limit', RELATED_POSTS_LIMIT, PDO::PARAM_INT);
    $relatedStmt->execute();
    $relatedRows = $relatedStmt->fetchAll();

    $related = array_map(
        static function (array $row) use ($pdo): array {
            blog_backfill_published_at($pdo, $row);
            return blog_format_post($row, blog_fetch_tags($pdo, (int) $row['id']));
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
        return blog_format_post($row, blog_fetch_tags($pdo, (int) $row['id']));
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
