<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Blog.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * GET /api/blog/index.php
 * Query params (all optional):
 *   page       int, default 1
 *   per_page   int, default 10, max 50
 *   search     substring match against title/description/content
 *   category   filter by category name
 *   featured   "1"/"0"/"true"/"false"
 *   draft      "1"/"0"/"true"/"false" — only honored for an authenticated
 *              admin; anonymous callers always get published-only results.
 *   sort       "updated_desc" | "updated_asc" — sorts by bp.updated_at,
 *              tie-broken by bp.id so paginated order is deterministic.
 *              Any other/absent value keeps the default order (published_at,
 *              then created_at, then id, all newest-first) — see
 *              docs/BLOG-DATE-AND-PUBLISHING-RULES.md.
 *
 * Anonymous callers never see draft posts. An authenticated admin sees every
 * status unless `draft` narrows it.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();

try {
    $admin = auth_current_admin();
    $pdo = Database::getConnection();

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = (int) ($_GET['per_page'] ?? 10);
    $perPage = $perPage > 0 ? min(50, $perPage) : 10;
    $offset = ($page - 1) * $perPage;

    $conditions = [];
    $params = [];

    $search = trim((string) ($_GET['search'] ?? ''));
    if ($search !== '') {
        // Real (non-emulated) prepared statements can't reuse one named
        // placeholder more than once per query, so each LIKE gets its own
        // parameter bound to the same value.
        $conditions[] = '(bp.title LIKE :search_title OR bp.description LIKE :search_description OR bp.content LIKE :search_content)';
        $searchTerm = '%' . $search . '%';
        $params['search_title'] = $searchTerm;
        $params['search_description'] = $searchTerm;
        $params['search_content'] = $searchTerm;
    }

    $category = trim((string) ($_GET['category'] ?? ''));
    if ($category !== '') {
        $conditions[] = 'c.name = :category';
        $params['category'] = $category;
    }

    if (isset($_GET['featured'])) {
        $featured = filter_var($_GET['featured'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($featured !== null) {
            $conditions[] = 'bp.featured = :featured';
            $params['featured'] = $featured ? 1 : 0;
        }
    }

    if ($admin !== null && isset($_GET['draft'])) {
        $draft = filter_var($_GET['draft'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($draft !== null) {
            $conditions[] = 'bp.status = :status';
            $params['status'] = $draft ? 'draft' : 'published';
        }
    } elseif ($admin === null) {
        $conditions[] = "bp.status = 'published' AND (bp.publish_at IS NULL OR bp.publish_at <= :now)";
        $params['now'] = date('Y-m-d H:i:s');
    }

    $whereSql = $conditions !== [] ? ('WHERE ' . implode(' AND ', $conditions)) : '';

    // Whitelisted, not built from raw input — $_GET['sort'] only ever
    // selects one of these literal ORDER BY clauses. Every branch ends in
    // `bp.id` as a final tiebreaker: published_at/created_at/updated_at are
    // DATETIME (second precision), so rows created or published within the
    // same second — bulk imports, seed data, or two posts published back to
    // back — tie on those columns alone, and MySQL does not guarantee a
    // stable order for ties without one. Without this, tied rows could
    // shuffle between requests (older posts intermittently outranking newer
    // ones) and even shift across pages of the same paginated query.
    $orderBy = match ($_GET['sort'] ?? null) {
        'updated_desc' => 'bp.updated_at DESC, bp.id DESC',
        'updated_asc' => 'bp.updated_at ASC, bp.id ASC',
        default => 'bp.published_at DESC, bp.created_at DESC, bp.id DESC',
    };

    $countSql = "SELECT COUNT(DISTINCT bp.id) AS total
                 FROM blog_posts bp
                 LEFT JOIN categories c ON c.id = bp.category_id
                 {$whereSql}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetch()['total'];

    $listSql = blog_select_base() . " {$whereSql}
                ORDER BY {$orderBy}
                LIMIT :limit OFFSET :offset";
    $listStmt = $pdo->prepare($listSql);
    foreach ($params as $key => $value) {
        $listStmt->bindValue(':' . $key, $value);
    }
    $listStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();
    $rows = $listStmt->fetchAll();

    $data = array_map(
        static function (array $row) use ($pdo): array {
            blog_backfill_published_at($pdo, $row);
            return blog_format_post($row);
        },
        $rows
    );

    json_response(200, [
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 0,
        ],
    ]);
} catch (Throwable $e) {
    error_log('[blog/index] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
