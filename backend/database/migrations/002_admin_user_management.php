<?php

declare(strict_types=1);

/**
 * Migration 002: multi-admin user management.
 *
 * Brings the `admins` table up to the shape the user-management module
 * needs: `full_name` (renamed from `name`), a unique `username`, and a role
 * enum expanded from ('owner','admin') to ('super_admin','admin','editor').
 *
 * Every step checks information_schema before acting, so this is safe to run
 * against either a brand-new database (schema.sql already creates the final
 * shape, so every step below is a no-op) or an existing one with real admin
 * accounts and passwords already in it (nothing here touches password_hash,
 * and no accounts are dropped).
 *
 * Returned as ['version' => ..., 'description' => ..., 'up' => callable]
 * for backend/migrate.php to run and record.
 */

return [
    'version' => '002_admin_user_management',
    'description' => 'admins: rename name->full_name, add username, expand role enum to super_admin/admin/editor, add is_active/role indexes',
    'up' => static function (PDO $pdo): void {
        $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();

        $columnExists = static function (string $table, string $column) use ($pdo, $dbName): bool {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND COLUMN_NAME = :column'
            );
            $stmt->execute(['db' => $dbName, 'table' => $table, 'column' => $column]);
            return ((int) $stmt->fetchColumn()) > 0;
        };

        $indexExists = static function (string $table, string $index) use ($pdo, $dbName): bool {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND INDEX_NAME = :index'
            );
            $stmt->execute(['db' => $dbName, 'table' => $table, 'index' => $index]);
            return ((int) $stmt->fetchColumn()) > 0;
        };

        // Step 1: name -> full_name.
        if ($columnExists('admins', 'name') && !$columnExists('admins', 'full_name')) {
            $pdo->exec('ALTER TABLE admins CHANGE COLUMN name full_name VARCHAR(120) NOT NULL');
        } elseif (!$columnExists('admins', 'full_name')) {
            $pdo->exec('ALTER TABLE admins ADD COLUMN full_name VARCHAR(120) NOT NULL DEFAULT \'\' AFTER id');
        }

        // Step 2: add username (nullable first — backfilled below, then locked to NOT NULL).
        if (!$columnExists('admins', 'username')) {
            $pdo->exec('ALTER TABLE admins ADD COLUMN username VARCHAR(60) NULL AFTER full_name');
        }

        // Step 3: backfill username for any existing row that doesn't have one yet
        // (pre-existing admins from before this migration, or a fresh column with
        // legacy rows). Derived from the email's local part, sanitized, and
        // de-duplicated with a numeric suffix.
        $rows = $pdo->query('SELECT id, email FROM admins WHERE username IS NULL OR username = \'\'')->fetchAll();

        foreach ($rows as $row) {
            $local = strtolower((string) strstr($row['email'], '@', true));
            $base = preg_replace('/[^a-z0-9._-]+/', '', $local) ?? '';
            if ($base === '') {
                $base = 'admin' . $row['id'];
            }

            $candidate = $base;
            $suffix = 2;
            while (true) {
                $check = $pdo->prepare('SELECT id FROM admins WHERE username = :username AND id != :id LIMIT 1');
                $check->execute(['username' => $candidate, 'id' => $row['id']]);
                if ($check->fetch() === false) {
                    break;
                }
                $candidate = $base . $suffix;
                $suffix++;
            }

            $update = $pdo->prepare('UPDATE admins SET username = :username WHERE id = :id');
            $update->execute(['username' => $candidate, 'id' => $row['id']]);
        }

        // Step 4: lock username down (NOT NULL + unique index).
        $pdo->exec('ALTER TABLE admins MODIFY COLUMN username VARCHAR(60) NOT NULL');
        if (!$indexExists('admins', 'uq_admins_username')) {
            $pdo->exec('ALTER TABLE admins ADD UNIQUE INDEX uq_admins_username (username)');
        }

        // Step 5: expand the role enum in two hops so existing 'owner' rows are
        // never truncated mid-flight — widen to a superset first, remap data,
        // then narrow to the final set once nothing references the old value.
        $roleColumn = $pdo->query(
            "SELECT COLUMN_TYPE FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = '" . str_replace("'", "''", (string) $dbName) . "' AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'role'"
        )->fetchColumn();

        if (is_string($roleColumn) && str_contains($roleColumn, "'owner'")) {
            $pdo->exec("ALTER TABLE admins MODIFY COLUMN role ENUM('owner','admin','super_admin','editor') NOT NULL DEFAULT 'admin'");
            $pdo->exec("UPDATE admins SET role = 'super_admin' WHERE role = 'owner'");
        }

        $pdo->exec("ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin','admin','editor') NOT NULL DEFAULT 'admin'");

        // Step 6: indexes used by the users list (filter by status/role).
        if (!$indexExists('admins', 'idx_admins_is_active')) {
            $pdo->exec('ALTER TABLE admins ADD INDEX idx_admins_is_active (is_active)');
        }
        if (!$indexExists('admins', 'idx_admins_role')) {
            $pdo->exec('ALTER TABLE admins ADD INDEX idx_admins_role (role)');
        }
    },
];
