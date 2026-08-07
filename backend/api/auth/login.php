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
        'SELECT id, full_name, username, email, password_hash, role, is_active FROM admins WHERE email = :email'
    );
    $stmt->execute(['email' => $email]);
    $admin = $stmt->fetch();

    // Always run password_verify(), even on a miss, against a fixed dummy
    // hash so a nonexistent email doesn't respond measurably faster than a
    // real one (timing side-channel on account enumeration). An inactive
    // account still has a real hash on file, so it's verified against that
    // — checking it costs the same as an active account's check, so this
    // doesn't introduce a new timing signal, and it lets a genuinely
    // correct password be told apart from a wrong one even when inactive.
    $hashToVerify = $admin !== false
        ? $admin['password_hash']
        : '$2y$10$WwR6r6b8p6f0m4o4iJhU0eYQ0jZ2QwF0k0m1n2o3p4q5r6s7t8u9v.';

    $passwordValid = password_verify($password, $hashToVerify);

    if ($admin === false || !$passwordValid) {
        json_response(401, ['error' => 'Invalid email or password']);
    }

    // Only reachable once the password has already been proven correct, so
    // revealing "inactive" here doesn't tell an attacker anything they
    // couldn't already deduce — they'd need the real password to get here.
    if ((int) $admin['is_active'] !== 1) {
        json_response(401, [
            'error' => 'This account is inactive. Contact the site owner for access.',
            'code' => 'ACCOUNT_INACTIVE',
        ]);
    }

    session_login((int) $admin['id']);

    $update = $pdo->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id');
    $update->execute(['id' => $admin['id']]);

    json_response(200, [
        'admin' => [
            'id' => (int) $admin['id'],
            'name' => $admin['full_name'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'role' => $admin['role'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('[auth/login] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
