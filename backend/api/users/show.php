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
 * GET /api/users/show.php?id=123
 * Requires an authenticated super_admin session.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();
permission_require_manage_users($admin);

$id = $_GET['id'] ?? null;
if (!is_numeric($id) || (int) $id <= 0) {
    json_response(422, ['error' => 'A valid numeric id is required']);
}

try {
    $pdo = Database::getConnection();
    $target = admin_user_find($pdo, (int) $id);

    if ($target === null) {
        json_response(404, ['error' => 'Admin user not found']);
    }

    json_response(200, ['data' => admin_user_format($target)]);
} catch (Throwable $e) {
    error_log('[users/show] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
