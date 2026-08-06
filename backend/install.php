<?php

declare(strict_types=1);

/**
 * One-time (idempotent) installer for the CMS database foundation.
 *
 * What it does, in order:
 *   1. Creates the target database if it doesn't already exist.
 *   2. Applies backend/database/schema.sql (all CREATE TABLE ... IF NOT EXISTS).
 *   3. Records the applied schema version in the `migrations` table.
 *   4. Inserts the first admin user from .env, if no admin exists yet.
 *   5. Creates the upload directories on disk, if missing.
 *
 * Safe to re-run: every step checks current state before acting, so running
 * this twice against an already-installed database is a no-op that reports
 * what it skipped.
 *
 * Usage:
 *   CLI  (preferred): php backend/install.php
 *   Web  (only if CLI/shell access isn't available on the host): visit
 *        install.php?token=<INSTALL_TOKEN>, where INSTALL_TOKEN matches the
 *        value set in .env. Delete or block this file once installation is
 *        complete — it is not meant to stay reachable in production.
 */

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/uploads.php';

$isCli = PHP_SAPI === 'cli';

if (!$isCli) {
    $expectedToken = env_get('INSTALL_TOKEN');
    $providedToken = $_GET['token'] ?? null;

    if ($expectedToken === null || $expectedToken === '' || !hash_equals($expectedToken, (string) $providedToken)) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Forbidden.\n";
        echo "Run via CLI instead: php backend/install.php\n";
        echo "Or set INSTALL_TOKEN in .env and visit install.php?token=<INSTALL_TOKEN>.\n";
        exit(1);
    }

    header('Content-Type: text/plain; charset=utf-8');
}

/** Print a line of installer output, CLI or web (plain text either way). */
function installer_log(string $message): void
{
    echo $message . PHP_EOL;
}

/** Validate a DB identifier (database name) before it's interpolated into DDL. */
function assert_safe_identifier(string $value, string $label): void
{
    if (!preg_match('/^[A-Za-z0-9_]+$/', $value)) {
        throw new RuntimeException("Refusing unsafe {$label}: {$value}");
    }
}

try {
    installer_log('=== CMS database installation ===');

    $host = env_get('DB_HOST', '127.0.0.1');
    $port = env_get('DB_PORT', '3306');
    $name = env_get('DB_NAME', required: true);
    $user = env_get('DB_USER', required: true);
    $pass = env_get('DB_PASS', '');
    $charset = env_get('DB_CHARSET', 'utf8mb4');

    assert_safe_identifier($name, 'DB_NAME');
    assert_safe_identifier($charset, 'DB_CHARSET');

    // Step 1: ensure the database itself exists (connect without a dbname first).
    installer_log("[1/5] Ensuring database `{$name}` exists...");
    $serverDsn = sprintf('mysql:host=%s;port=%s;charset=%s', $host, $port, $charset);
    $serverPdo = new PDO($serverDsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $serverPdo->exec(sprintf(
        'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET %s COLLATE %s_unicode_ci',
        $name,
        $charset,
        $charset
    ));
    $serverPdo = null;
    installer_log("      Database ready.");

    // Step 2: apply schema.sql against the real database connection.
    installer_log('[2/5] Applying schema...');
    $pdo = db_connect();

    $schemaPath = __DIR__ . '/database/schema.sql';
    $schemaSql = file_get_contents($schemaPath);

    if ($schemaSql === false) {
        throw new RuntimeException("Could not read schema file: {$schemaPath}");
    }

    // Strip whole-line comments before splitting: schema.sql's convention is
    // a `-- comment` line directly above each statement, and splitting on
    // ';' first left prior code checking only whether an entire statement
    // *started* with '--', which discarded every commented statement (i.e.
    // every CREATE TABLE) instead of just genuinely comment-only chunks.
    $schemaSql = preg_replace('/^\s*--.*$/m', '', $schemaSql) ?? $schemaSql;

    $statements = array_filter(
        array_map('trim', explode(';', $schemaSql)),
        static fn (string $stmt): bool => $stmt !== ''
    );

    foreach ($statements as $statement) {
        $pdo->exec($statement);
    }
    installer_log('      Schema applied (tables created if missing).');

    // Step 3: record the schema version in `migrations`, once.
    installer_log('[3/5] Recording migration version...');
    $version = '001_initial_schema';
    $stmt = $pdo->prepare('SELECT id FROM migrations WHERE version = :version');
    $stmt->execute(['version' => $version]);

    if ($stmt->fetch() === false) {
        $insert = $pdo->prepare(
            'INSERT INTO migrations (version, description) VALUES (:version, :description)'
        );
        $insert->execute([
            'version' => $version,
            'description' => 'Initial schema: admins, blog_posts, categories, uploads, settings',
        ]);
        installer_log("      Recorded migration '{$version}'.");
    } else {
        installer_log("      Migration '{$version}' already recorded, skipping.");
    }

    // Step 4: seed the first admin user from .env, if none exists yet.
    installer_log('[4/5] Seeding first admin user...');
    $adminEmail = env_get('INSTALL_ADMIN_EMAIL', required: true);
    $adminName = env_get('INSTALL_ADMIN_NAME', 'Site Admin');
    $adminUsername = env_get('INSTALL_ADMIN_USERNAME', strtolower((string) strstr($adminEmail, '@', true)));
    $adminPassword = env_get('INSTALL_ADMIN_PASSWORD', required: true);

    if (strlen($adminPassword) < 8) {
        throw new RuntimeException('INSTALL_ADMIN_PASSWORD must be at least 8 characters.');
    }

    $stmt = $pdo->prepare('SELECT id FROM admins WHERE email = :email');
    $stmt->execute(['email' => $adminEmail]);

    if ($stmt->fetch() === false) {
        $countStmt = $pdo->query('SELECT COUNT(*) AS total FROM admins');
        $isFirstAdmin = ((int) $countStmt->fetch()['total']) === 0;

        $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);

        $insert = $pdo->prepare(
            'INSERT INTO admins (full_name, username, email, password_hash, role, is_active)
             VALUES (:full_name, :username, :email, :password_hash, :role, 1)'
        );
        $insert->execute([
            'full_name' => $adminName,
            'username' => $adminUsername,
            'email' => $adminEmail,
            'password_hash' => $passwordHash,
            'role' => $isFirstAdmin ? 'super_admin' : 'admin',
        ]);
        installer_log("      Admin '{$adminEmail}' created.");
    } else {
        installer_log("      Admin '{$adminEmail}' already exists, skipping.");
    }

    // Step 5: create upload directories on disk.
    installer_log('[5/5] Ensuring upload directories exist...');
    $uploadsBase = uploads_base_dir();

    $directories = [
        $uploadsBase,
        $uploadsBase . '/blog',
        $uploadsBase . '/blog/covers',
        $uploadsBase . '/blog/content',
    ];

    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
                throw new RuntimeException("Failed to create directory: {$dir}");
            }
            installer_log("      Created {$dir}");
        } else {
            installer_log("      Already exists: {$dir}");
        }
    }

    // Defense-in-depth: uploaded files must never be executable as PHP.
    $htaccessPath = $uploadsBase . '/.htaccess';
    if (!is_file($htaccessPath)) {
        file_put_contents(
            $htaccessPath,
            "# Uploaded files are never trusted as executable code.\n" .
            "php_flag engine off\n" .
            "RemoveHandler .php .phtml .php3 .php4 .php5 .php7\n" .
            "<FilesMatch \"\\.(php|phtml|php\\d)$\">\n" .
            "  Require all denied\n" .
            "</FilesMatch>\n"
        );
        installer_log("      Wrote {$htaccessPath}");
    }

    installer_log('=== Installation complete. ===');
} catch (Throwable $e) {
    installer_log('INSTALLATION FAILED: ' . $e->getMessage());
    exit(1);
}
