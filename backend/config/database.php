<?php

declare(strict_types=1);

require_once __DIR__ . '/env.php';

/**
 * PDO connection factory. Reads connection details from the environment
 * (populated from .env by env.php) — no credentials are ever hardcoded here.
 */

/**
 * Build a fresh PDO connection using .env configuration.
 *
 * @throws RuntimeException if required env vars are missing.
 * @throws PDOException if the connection itself fails.
 */
function db_connect(): PDO
{
    $host = env_get('DB_HOST', '127.0.0.1');
    $port = env_get('DB_PORT', '3306');
    $name = env_get('DB_NAME', required: true);
    $user = env_get('DB_USER', required: true);
    $pass = env_get('DB_PASS', '');
    $charset = env_get('DB_CHARSET', 'utf8mb4');

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $host,
        $port,
        $name,
        $charset
    );

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE {$charset}_unicode_ci",
    ];

    $pdo = new PDO($dsn, $user, $pass, $options);

    // Point MySQL's own CURRENT_TIMESTAMP (created_at/updated_at defaults —
    // see schema.sql) at the same wall-clock offset PHP uses for
    // publish_at/published_at (config/env.php's date_default_timezone_set),
    // computed fresh per connection so it stays correct even if
    // APP_TIMEZONE is ever changed to a zone that observes DST. Without
    // this, created_at/updated_at would silently drift from
    // publish_at/published_at whenever the DB server's own default timezone
    // (frequently UTC on managed hosting) differs from the app's. See
    // docs/BLOG-DATE-AND-PUBLISHING-RULES.md.
    $offset = (new DateTime('now', new DateTimeZone(app_timezone())))->format('P');
    $pdo->exec("SET time_zone = '{$offset}'");

    return $pdo;
}
