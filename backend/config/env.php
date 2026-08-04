<?php

declare(strict_types=1);

/**
 * Minimal .env loader — no Composer dependency required.
 *
 * Parses KEY=VALUE lines from a .env file into $_ENV / $_SERVER / getenv(),
 * skipping blank lines and lines starting with '#'. Supports optional single
 * or double quoted values. Does not overwrite variables already present in
 * the environment (real server env vars always win over .env file values).
 */

/**
 * Resolve the default .env location: prefer backend/.env (where this
 * project's .env actually lives), falling back to the project root for
 * deployments that place it one level up instead.
 */
function env_default_path(): string
{
    $backendPath = dirname(__DIR__) . '/.env';

    if (is_file($backendPath)) {
        return $backendPath;
    }

    return dirname(__DIR__, 2) . '/.env';
}

/**
 * Load a .env file into the process environment, if not already loaded.
 *
 * @param string|null $path Absolute path to the .env file. Defaults to
 *                           backend/.env, falling back to the project root.
 */
function env_load(?string $path = null): void
{
    static $loaded = false;

    if ($loaded) {
        return;
    }

    $path ??= env_default_path();

    if (!is_file($path) || !is_readable($path)) {
        $loaded = true;
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        $loaded = true;
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        if ($key === '') {
            continue;
        }

        // Strip matching surrounding quotes, single or double.
        if (strlen($value) >= 2) {
            $first = $value[0];
            $last = $value[-1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                $value = substr($value, 1, -1);
            }
        }

        // Never overwrite a value already set in the real environment.
        if (getenv($key) !== false) {
            continue;
        }

        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    $loaded = true;
}

/**
 * The application's single source of truth for "what time is it right now,"
 * used consistently for publish scheduling (blog_compute_publish_state,
 * blog_is_visible_to_public) and for MySQL's own CURRENT_TIMESTAMP defaults
 * (see db_connect() in config/database.php, which points the MySQL session
 * at the same offset). Override via APP_TIMEZONE in .env; defaults to
 * Asia/Karachi (this site's production timezone — Pakistan Standard Time,
 * fixed UTC+5, no DST) if unset. See docs/BLOG-DATE-AND-PUBLISHING-RULES.md.
 */
function app_timezone(): string
{
    return env_get('APP_TIMEZONE', 'Asia/Karachi') ?? 'Asia/Karachi';
}

/**
 * Read an environment variable with an optional default and required flag.
 *
 * @throws RuntimeException if $required is true and the variable is unset or empty.
 */
function env_get(string $key, ?string $default = null, bool $required = false): ?string
{
    env_load();

    $value = getenv($key);

    if ($value === false || $value === '') {
        if ($required) {
            throw new RuntimeException("Missing required environment variable: {$key}");
        }
        return $default;
    }

    return $value;
}

// Applied the moment this file is included (every endpoint requires it,
// directly or via helpers/Session.php / config/database.php), so every
// date()/time()/strtotime() call in the request — and every comparison
// against a stored publish_at/published_at — uses the same explicit
// timezone instead of whatever PHP's ini default happens to be on a given
// host (commonly UTC, which does not match this site's audience or the
// admin's own wall-clock expectations). Idempotent: env_load() underneath
// this is itself guarded, so re-including this file is a no-op.
date_default_timezone_set(app_timezone());
