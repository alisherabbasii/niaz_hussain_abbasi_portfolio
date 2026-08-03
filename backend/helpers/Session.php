<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

/**
 * PHP native session bootstrap: HttpOnly/SameSite=Lax cookie, idle timeout,
 * and fixation-safe regeneration on login. No JWT, no DB-backed sessions —
 * just the file-based session store PHP already ships with.
 */

const SESSION_COOKIE_NAME = 'cms_admin_session';

/** Idle timeout in seconds before a session is considered expired (default 2 hours). */
function session_timeout_seconds(): int
{
    return (int) env_get('SESSION_TIMEOUT_SECONDS', '7200');
}

/** True if the current request arrived over HTTPS (directly or via a trusted proxy header). */
function session_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }

    return ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

/**
 * Start (or resume) the admin session for the current request. Safe to call
 * more than once per request. Expires and restarts the session if the idle
 * timeout has elapsed, otherwise slides the timeout forward on activity.
 */
function session_bootstrap(): void
{
    static $bootstrapped = false;

    if ($bootstrapped) {
        return;
    }

    $bootstrapped = true;

    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name(SESSION_COOKIE_NAME);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => session_is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    $now = time();
    $lastActivity = $_SESSION['last_activity'] ?? null;

    if (is_int($lastActivity) && ($now - $lastActivity) > session_timeout_seconds()) {
        session_hard_expire();
        session_start();
        $now = time();
    }

    $_SESSION['last_activity'] = $now;
}

/** Wipe session data, drop the session cookie, and destroy the session store entry. */
function session_hard_expire(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'],
        ]);
    }

    session_destroy();
}

/**
 * Mark the current session as authenticated for the given admin, rotating
 * the session ID first to prevent session fixation.
 */
function session_login(int $adminId): void
{
    session_regenerate_id(true);
    $_SESSION['admin_id'] = $adminId;
    $_SESSION['last_activity'] = time();
}

/** Clear authentication and destroy the session entirely. */
function session_logout(): void
{
    session_hard_expire();
}

/** The authenticated admin's id for this session, or null if not logged in. */
function session_admin_id(): ?int
{
    return isset($_SESSION['admin_id']) ? (int) $_SESSION['admin_id'] : null;
}
