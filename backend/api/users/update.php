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
 * PUT /api/users/update.php?id=123
 * Body: any subset of { full_name, username, email, role, is_active,
 * password, password_confirmation }. Fields omitted are left unchanged;
 * activate/deactivate is just `is_active` in this same body, same pattern
 * as the `draft` flag in blog/update.php. Omitting `password` (or leaving it
 * blank) preserves the existing password_hash untouched.
 *
 * Requires an authenticated super_admin session + CSRF header.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') {
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

try {
    $pdo = Database::getConnection();

    $existing = admin_user_find($pdo, $id);
    if ($existing === null) {
        json_response(404, ['error' => 'Admin user not found']);
    }

    permission_require_can_act_on_target($admin, $existing);

    $fullName = $existing['full_name'];
    if (array_key_exists('full_name', $body)) {
        $fullName = is_string($body['full_name']) ? trim($body['full_name']) : '';
        if ($fullName === '' || admin_user_strlen($fullName) > 120) {
            json_response(422, ['error' => 'full_name must be a non-empty string of at most 120 characters']);
        }
    }

    $username = $existing['username'];
    if (array_key_exists('username', $body)) {
        $username = is_string($body['username']) ? trim($body['username']) : '';
        if (!admin_user_username_valid($username)) {
            json_response(422, ['error' => 'username must be 3-32 characters: letters, numbers, dots, underscores, or hyphens']);
        }
    }

    $email = $existing['email'];
    if (array_key_exists('email', $body)) {
        $email = is_string($body['email']) ? admin_user_normalize_email($body['email']) : '';
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(422, ['error' => 'A valid email is required']);
        }
    }

    $role = $existing['role'];
    if (array_key_exists('role', $body)) {
        $role = is_string($body['role']) ? trim($body['role']) : '';
        if (!permission_role_is_valid($role)) {
            json_response(422, ['error' => 'role must be one of: ' . implode(', ', ADMIN_ROLES)]);
        }
        permission_require_role_assignable($admin, $role);

        // Demoting the last active super_admin away from that role is just as
        // dangerous as deactivating/deleting them — same guard applies.
        if ($role !== 'super_admin' && admin_is_last_active_super_admin($pdo, $existing)) {
            json_response(409, ['error' => 'Cannot change the role of the last active super admin.']);
        }
    }

    $isActive = (bool) $existing['is_active'];
    if (array_key_exists('is_active', $body)) {
        $isActive = filter_var($body['is_active'], FILTER_VALIDATE_BOOLEAN);

        if ($isActive === false && (int) $existing['is_active'] === 1) {
            if ((int) $existing['id'] === (int) $admin['id']) {
                json_response(403, ['error' => 'You cannot deactivate your own account.']);
            }
            if (admin_is_last_active_super_admin($pdo, $existing)) {
                json_response(409, ['error' => 'Cannot deactivate the last active super admin.']);
            }
        }
    }

    $passwordHash = null;
    if (array_key_exists('password', $body) && is_string($body['password']) && $body['password'] !== '') {
        $password = $body['password'];
        $passwordConfirmation = is_string($body['password_confirmation'] ?? null) ? $body['password_confirmation'] : '';

        $passwordError = admin_user_password_error($password);
        if ($passwordError !== null) {
            json_response(422, ['error' => $passwordError]);
        }
        if ($password !== $passwordConfirmation) {
            json_response(422, ['error' => 'password and password_confirmation must match']);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    }

    if ($username !== $existing['username'] && admin_username_exists($pdo, $username, $id)) {
        json_response(409, ['error' => "username \"{$username}\" is already in use"]);
    }
    if ($email !== $existing['email'] && admin_email_exists($pdo, $email, $id)) {
        json_response(409, ['error' => "email \"{$email}\" is already in use"]);
    }

    $sql = 'UPDATE admins SET full_name = :full_name, username = :username, email = :email,
                role = :role, is_active = :is_active';
    $params = [
        'full_name' => $fullName,
        'username' => $username,
        'email' => $email,
        'role' => $role,
        'is_active' => $isActive ? 1 : 0,
        'id' => $id,
    ];

    if ($passwordHash !== null) {
        $sql .= ', password_hash = :password_hash';
        $params['password_hash'] = $passwordHash;
    }

    $sql .= ' WHERE id = :id';

    $pdo->prepare($sql)->execute($params);

    $updated = admin_user_find($pdo, $id);
    json_response(200, ['data' => admin_user_format($updated)]);
} catch (Throwable $e) {
    if ($e instanceof PDOException && $e->getCode() === '23000') {
        json_response(409, ['error' => 'Username or email is already in use']);
    }
    error_log('[users/update] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
