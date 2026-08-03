<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Upload.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * DELETE /api/upload/delete.php?id=123
 * `id` may be given as a query param or in a JSON body.
 * Requires an authenticated admin session + CSRF header.
 *
 * Removes both the `uploads` row and the file on disk. Deleting an upload
 * does not touch any blog_posts.cover_image_path/content that already
 * references its URL — those fields are plain strings, not foreign keys.
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

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT id, disk_path FROM uploads WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $upload = $stmt->fetch();

    if ($upload === false) {
        $pdo->rollBack();
        json_response(404, ['error' => 'Upload not found']);
    }

    $pdo->prepare('DELETE FROM uploads WHERE id = :id')->execute(['id' => $id]);

    $pdo->commit();

    $diskPath = $upload['disk_path'];
    if (is_string($diskPath) && $diskPath !== '' && is_file($diskPath) && upload_path_is_within_uploads($diskPath)) {
        @unlink($diskPath);
    }

    json_response(200, ['message' => 'Upload deleted', 'data' => ['id' => $id]]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[upload/delete] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
