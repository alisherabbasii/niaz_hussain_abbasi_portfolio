<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/AdminUser.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * PUT /api/profile/update.php
 * Body: { full_name: string, email: string }
 *
 * Lets the currently authenticated admin update their own display name and
 * email. Deliberately does not accept `role`, `username`, or `is_active` —
 * self-service profile editing can never change permissions; that's
 * exclusively backend/api/users/update.php, which only a super_admin can
 * reach. Requires an authenticated session + CSRF header.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') {
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

$fullName = is_string($body['full_name'] ?? null) ? trim($body['full_name']) : '';
if ($fullName === '' || admin_user_strlen($fullName) > 120) {
    json_response(422, ['error' => 'full_name is required and must be at most 120 characters']);
}

$email = is_string($body['email'] ?? null) ? admin_user_normalize_email($body['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, ['error' => 'A valid email is required']);
}

$id = (int) $admin['id'];

try {
    $pdo = Database::getConnection();

    if (admin_email_exists($pdo, $email, $id)) {
        json_response(409, ['error' => "email \"{$email}\" is already in use"]);
    }

    $pdo->prepare('UPDATE admins SET full_name = :full_name, email = :email WHERE id = :id')
        ->execute(['full_name' => $fullName, 'email' => $email, 'id' => $id]);

    json_response(200, [
        'admin' => [
            'id' => $id,
            'name' => $fullName,
            'username' => $admin['username'],
            'email' => $email,
            'role' => $admin['role'],
        ],
    ]);
} catch (Throwable $e) {
    if ($e instanceof PDOException && $e->getCode() === '23000') {
        json_response(409, ['error' => 'Email is already in use']);
    }
    error_log('[profile/update] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
