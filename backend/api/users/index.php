<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/AdminUser.php';
require_once __DIR__ . '/../../helpers/Permissions.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * GET /api/users/index.php
 * Query params (all optional):
 *   page       int, default 1
 *   per_page   int, default 10, max 50
 *   search     substring match against full_name/username/email
 *   role       one of super_admin|admin|editor
 *   status     "active" | "inactive"
 *
 * Requires an authenticated super_admin session.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();
permission_require_manage_users($admin);

try {
    $pdo = Database::getConnection();

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = (int) ($_GET['per_page'] ?? 10);
    $perPage = $perPage > 0 ? min(50, $perPage) : 10;
    $offset = ($page - 1) * $perPage;

    $conditions = [];
    $params = [];

    $search = trim((string) ($_GET['search'] ?? ''));
    if ($search !== '') {
        $conditions[] = '(full_name LIKE :search_name OR username LIKE :search_username OR email LIKE :search_email)';
        $searchTerm = '%' . $search . '%';
        $params['search_name'] = $searchTerm;
        $params['search_username'] = $searchTerm;
        $params['search_email'] = $searchTerm;
    }

    $role = trim((string) ($_GET['role'] ?? ''));
    if ($role !== '') {
        if (!permission_role_is_valid($role)) {
            json_response(422, ['error' => 'role must be one of: ' . implode(', ', ADMIN_ROLES)]);
        }
        $conditions[] = 'role = :role';
        $params['role'] = $role;
    }

    $status = trim((string) ($_GET['status'] ?? ''));
    if ($status === 'active') {
        $conditions[] = 'is_active = 1';
    } elseif ($status === 'inactive') {
        $conditions[] = 'is_active = 0';
    } elseif ($status !== '') {
        json_response(422, ['error' => 'status must be "active" or "inactive"']);
    }

    $whereSql = $conditions !== [] ? ('WHERE ' . implode(' AND ', $conditions)) : '';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM admins {$whereSql}");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetchColumn();

    $listSql = admin_user_select_base() . " {$whereSql}
                ORDER BY full_name ASC
                LIMIT :limit OFFSET :offset";
    $listStmt = $pdo->prepare($listSql);
    foreach ($params as $key => $value) {
        $listStmt->bindValue(':' . $key, $value);
    }
    $listStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();
    $rows = $listStmt->fetchAll();

    json_response(200, [
        'data' => array_map('admin_user_format', $rows),
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $perPage > 0 ? (int) ceil($total / $perPage) : 0,
        ],
    ]);
} catch (Throwable $e) {
    error_log('[users/index] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
