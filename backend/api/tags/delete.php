<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Taxonomy.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * DELETE /api/tags/delete.php?id=123
 * `id` may be given as a query param or in a JSON body.
 * Requires an authenticated admin session + CSRF header.
 *
 * Unlike categories, a tag can always be deleted regardless of use: its
 * blog_post_tags rows are cascade-deleted by the schema's FK
 * (fk_bpt_tag ... ON DELETE CASCADE), which only removes the post<->tag
 * relationship rows, never the posts themselves.
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

    $existing = taxonomy_find($pdo, 'tags', $id);
    if ($existing === null) {
        json_response(404, ['error' => 'Tag not found']);
    }

    $pdo->beginTransaction();

    $pdo->prepare('DELETE FROM tags WHERE id = :id')->execute(['id' => $id]);

    $pdo->commit();

    json_response(200, ['message' => 'Tag deleted', 'data' => ['id' => $id]]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[tags/delete] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
