<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/AdminUser.php';
require_once __DIR__ . '/../../helpers/Permissions.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * DELETE /api/users/delete.php?id=123
 * Body or query must also include `confirm: true` — a deliberate, explicit
 * second signal beyond the id itself (the frontend's confirm dialog is the
 * first; this is the server-side belt-and-suspenders check).
 *
 * `admins.id` is referenced ON DELETE RESTRICT from blog_posts.author_id and
 * uploads.uploaded_by, so deleting a user who has authored content or
 * uploads fails at the database level; that's caught below and turned into
 * a 409 suggesting deactivation instead, which is the safer, auditable path.
 *
 * Requires an authenticated super_admin session + CSRF header.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'DELETE') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();
permission_require_manage_users($admin);

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

$body = read_json_body() ?? [];
$idSource = $_GET['id'] ?? ($body['id'] ?? null);

if (!is_numeric($idSource) || (int) $idSource <= 0) {
    json_response(422, ['error' => 'A valid numeric id is required']);
}
$id = (int) $idSource;

$confirmSource = $_GET['confirm'] ?? ($body['confirm'] ?? null);
if (!filter_var($confirmSource, FILTER_VALIDATE_BOOLEAN)) {
    json_response(422, ['error' => 'Deletion requires explicit confirmation (confirm=true).']);
}

if ($id === (int) $admin['id']) {
    json_response(403, ['error' => 'You cannot delete your own account.']);
}

try {
    $pdo = Database::getConnection();

    $target = admin_user_find($pdo, $id);
    if ($target === null) {
        json_response(404, ['error' => 'Admin user not found']);
    }

    permission_require_can_act_on_target($admin, $target);

    if (admin_is_last_active_super_admin($pdo, $target)) {
        json_response(409, ['error' => 'Cannot delete the last active super admin.']);
    }

    $pdo->prepare('DELETE FROM admins WHERE id = :id')->execute(['id' => $id]);

    json_response(200, ['message' => 'Admin user deleted', 'data' => ['id' => $id]]);
} catch (Throwable $e) {
    if ($e instanceof PDOException && $e->getCode() === '23000') {
        json_response(409, ['error' => 'Cannot delete this user because they have authored content or uploads. Deactivate the account instead.']);
    }
    error_log('[users/delete] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
