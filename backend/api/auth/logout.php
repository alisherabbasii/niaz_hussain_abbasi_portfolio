<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';

/**
 * POST /api/auth/logout.php
 * Destroys the current session (if any) and clears the session cookie.
 * Idempotent: calling it with no active session still returns 200.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

session_logout();

json_response(200, ['message' => 'Logged out']);
