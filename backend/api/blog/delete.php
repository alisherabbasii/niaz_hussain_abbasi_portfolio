<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Blog.php';
require_once __DIR__ . '/../../helpers/Permissions.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * DELETE /api/blog/delete.php?id=123
 * `id` may be given as a query param or in a JSON body.
 * Requires an authenticated admin session + CSRF header. 'editor' callers
 * may only delete posts they authored.
 * blog_post_tags rows for the post are cascade-deleted by the schema's FK.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'DELETE') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();

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

    $stmt = $pdo->prepare('SELECT id, author_id FROM blog_posts WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $existing = $stmt->fetch();

    if ($existing === false) {
        json_response(404, ['error' => 'Blog post not found']);
    }

    permission_require_can_manage_post($admin, (int) $existing['author_id']);

    $pdo->beginTransaction();

    $pdo->prepare('DELETE FROM blog_posts WHERE id = :id')->execute(['id' => $id]);

    $pdo->commit();

    json_response(200, ['message' => 'Blog post deleted', 'data' => ['id' => $id]]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[blog/delete] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
