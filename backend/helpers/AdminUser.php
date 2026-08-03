<?php

declare(strict_types=1);

/**
 * Shared logic for backend/api/users/**.php and backend/api/profile/**.php:
 * field validation/normalization, uniqueness checks, password strength, the
 * "last active super_admin" safety checks, and formatting an admins row into
 * the API's JSON shape (password_hash is never included).
 */

const ADMIN_USERNAME_PATTERN = '/^[a-zA-Z0-9](?:[a-zA-Z0-9._-]{1,30}[a-zA-Z0-9])?$/';
const ADMIN_PASSWORD_MIN_LENGTH = 10;

/** Character length of a UTF-8 string, without depending on the mbstring extension. */
function admin_user_strlen(string $value): int
{
    if (function_exists('iconv_strlen')) {
        $length = @iconv_strlen($value, 'UTF-8');
        if ($length !== false) {
            return $length;
        }
    }

    return strlen($value);
}

/** Lowercase + trim an email address for storage/comparison. */
function admin_user_normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function admin_user_username_valid(string $username): bool
{
    $length = strlen($username);
    return $length >= 3 && $length <= 32 && preg_match(ADMIN_USERNAME_PATTERN, $username) === 1;
}

/**
 * Strong-password check: at least ADMIN_PASSWORD_MIN_LENGTH characters,
 * containing at least one letter and one digit. Returns an error message, or
 * null if the password is acceptable.
 */
function admin_user_password_error(string $password): ?string
{
    if (admin_user_strlen($password) < ADMIN_PASSWORD_MIN_LENGTH) {
        return 'Password must be at least ' . ADMIN_PASSWORD_MIN_LENGTH . ' characters long.';
    }

    if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
        return 'Password must contain at least one letter and one number.';
    }

    return null;
}

/** True if $username is already used by a different admin. */
function admin_username_exists(PDO $pdo, string $username, ?int $excludeId = null): bool
{
    $sql = 'SELECT id FROM admins WHERE username = :username';
    $params = ['username' => $username];

    if ($excludeId !== null) {
        $sql .= ' AND id != :id';
        $params['id'] = $excludeId;
    }

    $stmt = $pdo->prepare($sql . ' LIMIT 1');
    $stmt->execute($params);

    return $stmt->fetch() !== false;
}

/** True if $email is already used by a different admin. */
function admin_email_exists(PDO $pdo, string $email, ?int $excludeId = null): bool
{
    $sql = 'SELECT id FROM admins WHERE email = :email';
    $params = ['email' => $email];

    if ($excludeId !== null) {
        $sql .= ' AND id != :id';
        $params['id'] = $excludeId;
    }

    $stmt = $pdo->prepare($sql . ' LIMIT 1');
    $stmt->execute($params);

    return $stmt->fetch() !== false;
}

/**
 * Number of active super_admin accounts, optionally excluding one id (used
 * to answer "would this be the last one?" by excluding the target first).
 */
function admin_count_active_super_admins(PDO $pdo, ?int $excludeId = null): int
{
    $sql = "SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND is_active = 1";
    $params = [];

    if ($excludeId !== null) {
        $sql .= ' AND id != :id';
        $params['id'] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return (int) $stmt->fetchColumn();
}

/** True if deactivating/deleting $target would remove the last active super_admin. */
function admin_is_last_active_super_admin(PDO $pdo, array $target): bool
{
    if (($target['role'] ?? null) !== 'super_admin' || (int) ($target['is_active'] ?? 0) !== 1) {
        return false;
    }

    return admin_count_active_super_admins($pdo, (int) $target['id']) === 0;
}

/** SELECT base for reading admins rows without password_hash. */
function admin_user_select_base(): string
{
    return 'SELECT id, full_name, username, email, role, is_active, last_login_at, created_at, updated_at
             FROM admins';
}

/** Fetch one admins row (no password_hash) by id, or null if not found. */
function admin_user_find(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(admin_user_select_base() . ' WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row === false ? null : $row;
}

/** Format an admins row (from admin_user_select_base()) into the API's JSON shape. */
function admin_user_format(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'full_name' => $row['full_name'],
        'username' => $row['username'],
        'email' => $row['email'],
        'role' => $row['role'],
        'is_active' => (bool) $row['is_active'],
        'last_login_at' => $row['last_login_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
