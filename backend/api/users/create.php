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
 * POST /api/users/create.php
 * Body: {
 *   full_name: string (required),
 *   username: string (required, unique, 3-32 chars),
 *   email: string (required, unique),
 *   role: 'super_admin'|'admin'|'editor' (required),
 *   is_active?: bool (default true),
 *   password: string (required, strong),
 *   password_confirmation: string (required, must match password)
 * }
 *
 * Requires an authenticated super_admin session + CSRF header. Only a
 * super_admin may create another super_admin account.
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

$fullName = is_string($body['full_name'] ?? null) ? trim($body['full_name']) : '';
if ($fullName === '' || admin_user_strlen($fullName) > 120) {
    json_response(422, ['error' => 'full_name is required and must be at most 120 characters']);
}

$username = is_string($body['username'] ?? null) ? trim($body['username']) : '';
if (!admin_user_username_valid($username)) {
    json_response(422, ['error' => 'username must be 3-32 characters: letters, numbers, dots, underscores, or hyphens']);
}

$email = is_string($body['email'] ?? null) ? admin_user_normalize_email($body['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['error' => 'A valid email is required']);
}

$role = is_string($body['role'] ?? null) ? trim($body['role']) : '';
if (!permission_role_is_valid($role)) {
    json_response(422, ['error' => 'role must be one of: ' . implode(', ', ADMIN_ROLES)]);
}
permission_require_role_assignable($admin, $role);

$isActive = filter_var($body['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

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

    if (admin_username_exists($pdo, $username)) {
        json_response(409, ['error' => "username \"{$username}\" is already in use"]);
    }
    if (admin_email_exists($pdo, $email)) {
        json_response(409, ['error' => "email \"{$email}\" is already in use"]);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $insert = $pdo->prepare(
        'INSERT INTO admins (full_name, username, email, password_hash, role, is_active)
         VALUES (:full_name, :username, :email, :password_hash, :role, :is_active)'
    );
    $insert->execute([
        'full_name' => $fullName,
        'username' => $username,
        'email' => $email,
        'password_hash' => $passwordHash,
        'role' => $role,
        'is_active' => $isActive ? 1 : 0,
    ]);

    $newId = (int) $pdo->lastInsertId();
    $created = admin_user_find($pdo, $newId);

    json_response(201, ['data' => admin_user_format($created)]);
} catch (Throwable $e) {
    if ($e instanceof PDOException && $e->getCode() === '23000') {
        json_response(409, ['error' => 'Username or email is already in use']);
    }
    error_log('[users/create] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
