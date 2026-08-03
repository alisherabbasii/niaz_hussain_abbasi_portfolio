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
 * POST /api/users/reset_password.php?id=123
 * Body: { password: string, password_confirmation: string }
 *
 * Admin-initiated password reset for *another* admin account (no current
 * password needed — the caller is already an authenticated super_admin).
 * Resetting your own password here is rejected on purpose: use
 * POST /api/profile/change_password.php instead, which verifies the current
 * password rather than letting a live session silently rewrite its own
 * credential.
 *
 * Requires an authenticated super_admin session + CSRF header.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();
permission_require_manage_users($admin);

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

$body = read_json_body();
if ($body === null) {
    json_response(400, ['error' => 'Invalid JSON body']);
}

$idSource = $_GET['id'] ?? ($body['id'] ?? null);
if (!is_numeric($idSource) || (int) $idSource <= 0) {
    json_response(422, ['error' => 'A valid numeric id is required']);
}
$id = (int) $idSource;

if ($id === (int) $admin['id']) {
    json_response(403, ['error' => 'Use your profile page to change your own password.']);
}

$password = is_string($body['password'] ?? null) ? $body['password'] : '';
$passwordConfirmation = is_string($body['password_confirmation'] ?? null) ? $body['password_confirmation'] : '';

$passwordError = admin_user_password_error($password);
if ($passwordError !== null) {
    json_response(422, ['error' => $passwordError]);
}
if ($password !== $passwordConfirmation) {
    json_response(422, ['error' => 'password and password_confirmation must match']);
}

try {
    $pdo = Database::getConnection();

    $target = admin_user_find($pdo, $id);
    if ($target === null) {
        json_response(404, ['error' => 'Admin user not found']);
    }

    permission_require_can_act_on_target($admin, $target);

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare('UPDATE admins SET password_hash = :password_hash WHERE id = :id')
        ->execute(['password_hash' => $passwordHash, 'id' => $id]);

    json_response(200, ['message' => 'Password reset successfully']);
} catch (Throwable $e) {
    error_log('[users/reset_password] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
