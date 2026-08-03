<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/Session.php';
require_once __DIR__ . '/../helpers/Database.php';
require_once __DIR__ . '/../helpers/Response.php';

/**
 * Session-backed auth guard for admin API routes. session_bootstrap() must
 * already have been called (json_response() below assumes headers are still
 * open, i.e. no output sent yet).
 */

/**
 * The currently authenticated admin (id, name, email, role, is_active), or
 * null if there is no session, the session has no admin, or that admin has
 * since been deactivated.
 */
function auth_current_admin(): ?array
{
    $adminId = session_admin_id();

    if ($adminId === null) {
        return null;
    }

    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('SELECT id, name, email, role, is_active FROM admins WHERE id = :id');
    $stmt->execute(['id' => $adminId]);
    $admin = $stmt->fetch();

    if ($admin === false || (int) $admin['is_active'] !== 1) {
        session_logout();
        return null;
    }

    return $admin;
}

/**
 * Middleware for protected routes: call at the top of any admin endpoint.
 * Returns the authenticated admin's record, or sends a 401 JSON response
 * and terminates the request if there isn't one.
 */
function auth_require_admin(): array
{
    $admin = auth_current_admin();

    if ($admin === null) {
        json_response(401, ['error' => 'Unauthorized']);
    }

    return $admin;
}
