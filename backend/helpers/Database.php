<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

/**
 * Reusable, lazily-initialized PDO connection.
 *
 * Every controller/model in the backend should obtain its connection via
 * Database::getConnection() rather than constructing PDO directly, so there
 * is exactly one connection per request and one place that owns DSN/option
 * config.
 */
final class Database
{
    private static ?PDO $connection = null;

    private function __construct()
    {
    }

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            self::$connection = db_connect();
        }

        return self::$connection;
    }

    /**
     * Reset the cached connection. Primarily useful in tests/CLI scripts
     * (e.g. install.php) that may want a fresh connection after DDL changes.
     */
    public static function reset(): void
    {
        self::$connection = null;
    }
}
