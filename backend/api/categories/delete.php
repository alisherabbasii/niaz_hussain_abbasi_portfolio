<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Taxonomy.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * DELETE /api/categories/delete.php?id=123
 * `id` may be given as a query param or in a JSON body.
 * Requires an authenticated admin session + CSRF header.
 *
 * A category still assigned to any post is refused with a 409 rather than
 * deleted out from under those posts — blog_posts.category_id is NOT NULL
 * and its FK is ON DELETE RESTRICT (see migration 004), so the database
 * itself would reject the DELETE anyway; this check exists to surface a
 * clear, actionable error instead of a raw FK-constraint failure. Reassign
 * (or delete) those posts first, then retry.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'DELETE') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
auth_require_admin();

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

$body = read_json_body();
$idSource = $_GET['id'] ?? ($body['id'] ?? null);

if (!is_numeric($idSource) || (int) $idSource <= 0) {
    json_response(422, ['error' => 'A valid numeric id is required']);
}
$id = (int) $idSource;

try {
    $pdo = Database::getConnection();

    $existing = taxonomy_find($pdo, 'categories', $id);
    if ($existing === null) {
        json_response(404, ['error' => 'Category not found']);
    }

    $pdo->beginTransaction();

    $postCount = taxonomy_category_post_count($pdo, $id);
    if ($postCount > 0) {
        $pdo->rollBack();
        json_response(409, [
            'error' => 'This category is assigned to existing blog posts. Move or delete those blogs before deleting this category.',
        ]);
    }

    $pdo->prepare('DELETE FROM categories WHERE id = :id')->execute(['id' => $id]);

    $pdo->commit();

    json_response(200, ['message' => 'Category deleted', 'data' => ['id' => $id]]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[categories/delete] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
