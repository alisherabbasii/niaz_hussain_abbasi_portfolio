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
