<?php

declare(strict_types=1);

/**
 * Incremental migration runner for schema changes made *after* the initial
 * install.php run (which only ever applies backend/database/schema.sql).
 *
 * Each file in backend/database/migrations/ returns
 * ['version' => string, 'description' => string, 'up' => callable(PDO): void].
 * Files are applied in filename order; a version already present in the
 * `migrations` table is skipped. Every migration's `up` callback is expected
 * to be idempotent on its own (see 002_admin_user_management.php for the
 * pattern: check information_schema before altering anything), since MySQL
 * DDL isn't transactional and a run can be safely repeated either way.
 *
 * Usage: php backend/migrate.php
 */

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

function migrate_log(string $message): void
{
    echo $message . PHP_EOL;
}

try {
    migrate_log('=== Running pending migrations ===');

    $pdo = db_connect();

    $applied = array_column(
        $pdo->query('SELECT version FROM migrations')->fetchAll(),
        'version'
    );

    $files = glob(__DIR__ . '/database/migrations/*.php') ?: [];
    sort($files, SORT_STRING);

    if ($files === []) {
        migrate_log('No migration files found.');
        exit(0);
    }

    $ranAny = false;

    foreach ($files as $file) {
        $migration = require $file;

        if (!is_array($migration) || !isset($migration['version'], $migration['description'], $migration['up'])) {
            throw new RuntimeException("Malformed migration file: {$file}");
        }

        $version = $migration['version'];

        if (in_array($version, $applied, true)) {
            migrate_log("[skip] {$version} (already applied)");
            continue;
        }

        migrate_log("[run]  {$version} — {$migration['description']}");
        ($migration['up'])($pdo);

        $insert = $pdo->prepare('INSERT INTO migrations (version, description) VALUES (:version, :description)');
        $insert->execute(['version' => $version, 'description' => $migration['description']]);

        migrate_log("[done] {$version}");
        $ranAny = true;
    }

    migrate_log($ranAny ? '=== Migrations complete. ===' : '=== Already up to date. ===');
} catch (Throwable $e) {
    migrate_log('MIGRATION FAILED: ' . $e->getMessage());
    exit(1);
}
