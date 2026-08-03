<?php

declare(strict_types=1);

require_once __DIR__ . '/../helpers/Session.php';

/**
 * Double-submit CSRF protection. A random token is stored server-side in the
 * session and mirrored into a readable (non-HttpOnly) cookie; the frontend
 * echoes it back as a request header on every state-changing call. An
 * attacker's cross-site form can make the browser send the session cookie
 * automatically, but has no way to read the CSRF cookie to forge the header.
 *
 * session_bootstrap() must be called before either function here.
 */

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/** Ensure a CSRF token exists for this session and (re)send it as a cookie. */
function csrf_ensure_token(): string
{
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    $token = $_SESSION['csrf_token'];

    setcookie(CSRF_COOKIE_NAME, $token, [
        'expires' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => session_is_https(),
        'httponly' => false,
        'samesite' => 'Lax',
    ]);

    return $token;
}

/** True if the request carries a CSRF header matching the session's token. */
function csrf_verify_request(): bool
{
    $expected = $_SESSION['csrf_token'] ?? null;

    if (!is_string($expected) || $expected === '') {
        return false;
    }

    $provided = csrf_extract_header();

    return is_string($provided) && $provided !== '' && hash_equals($expected, $provided);
}

function csrf_extract_header(): ?string
{
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp($name, CSRF_HEADER_NAME) === 0) {
                return $value;
            }
        }
    }

    return $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
}
