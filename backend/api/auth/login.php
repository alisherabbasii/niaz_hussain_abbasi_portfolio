<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';

/**
 * POST /api/auth/login.php
 * Body: { "email": string, "password": string }
 *
 * On success, starts an authenticated session (HttpOnly, SameSite=Lax
 * cookie) and returns the admin's public profile. Always returns a generic
 * "invalid email or password" message on failure so the response never
 * reveals whether a given email is registered.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

$body = read_json_body();

if ($body === null) {
    json_response(400, ['error' => 'Invalid JSON body']);
}

$email = is_string($body['email'] ?? null) ? trim($body['email']) : '';
$password = is_string($body['password'] ?? null) ? $body['password'] : '';

if ($email === '' || $password === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['error' => 'A valid email and password are required']);
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare(
        'SELECT id, name, email, password_hash, role, is_active FROM admins WHERE email = :email'
    );
    $stmt->execute(['email' => $email]);
    $admin = $stmt->fetch();

    $isActive = $admin !== false && (int) $admin['is_active'] === 1;

    // Always run password_verify(), even on a miss, against a fixed dummy
    // hash so a nonexistent/inactive email doesn't respond measurably
    // faster than a real one (timing side-channel on account enumeration).
    $hashToVerify = $isActive
        ? $admin['password_hash']
        : '$2y$10$WwR6r6b8p6f0m4o4iJhU0eYQ0jZ2QwF0k0m1n2o3p4q5r6s7t8u9v.';

    $passwordValid = password_verify($password, $hashToVerify);

    if (!$isActive || !$passwordValid) {
        json_response(401, ['error' => 'Invalid email or password']);
    }

    session_login((int) $admin['id']);

    $update = $pdo->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id');
    $update->execute(['id' => $admin['id']]);

    json_response(200, [
        'admin' => [
            'id' => (int) $admin['id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('[auth/login] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
