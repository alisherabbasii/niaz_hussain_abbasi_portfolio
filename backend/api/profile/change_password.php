<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/AdminUser.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * POST /api/profile/change_password.php
 * Body: { current_password: string, new_password: string, new_password_confirmation: string }
 *
 * Self-service password change: unlike backend/api/users/reset_password.php
 * (admin resetting *someone else's* password), this requires proving the
 * current password first. Regenerates the session id on success (same
 * fixation-safe rotation session_login() does) since the credential that
 * authenticated the old session id has just changed.
 *
 * Requires an authenticated session + CSRF header.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

$body = read_json_body();
if ($body === null) {
    json_response(400, ['error' => 'Invalid JSON body']);
}

$currentPassword = is_string($body['current_password'] ?? null) ? $body['current_password'] : '';
$newPassword = is_string($body['new_password'] ?? null) ? $body['new_password'] : '';
$newPasswordConfirmation = is_string($body['new_password_confirmation'] ?? null) ? $body['new_password_confirmation'] : '';

if ($currentPassword === '') {
    json_response(422, ['error' => 'current_password is required']);
}

$passwordError = admin_user_password_error($newPassword);
if ($passwordError !== null) {
    json_response(422, ['error' => $passwordError]);
}
if ($newPassword !== $newPasswordConfirmation) {
    json_response(422, ['error' => 'new_password and new_password_confirmation must match']);
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare('SELECT password_hash FROM admins WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => (int) $admin['id']]);
    $row = $stmt->fetch();

    if ($row === false || !password_verify($currentPassword, $row['password_hash'])) {
        json_response(401, ['error' => 'Current password is incorrect']);
    }

    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $pdo->prepare('UPDATE admins SET password_hash = :password_hash WHERE id = :id')
        ->execute(['password_hash' => $passwordHash, 'id' => (int) $admin['id']]);

    session_regenerate_id(true);

    json_response(200, ['message' => 'Password changed successfully']);
} catch (Throwable $e) {
    error_log('[profile/change_password] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
