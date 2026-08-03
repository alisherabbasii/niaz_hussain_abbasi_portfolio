<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * GET /api/auth/me.php
 * Returns the current session's admin profile, or 401 if not authenticated.
 * Also (re)issues the CSRF cookie, so the frontend can bootstrap a token
 * from this call before it has logged in.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();

try {
    $admin = auth_current_admin();

    if ($admin === null) {
        json_response(401, ['error' => 'Unauthorized']);
    }

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
    error_log('[auth/me] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
