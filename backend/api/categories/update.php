<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Blog.php';
require_once __DIR__ . '/../../helpers/Taxonomy.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * PUT /api/categories/update.php?id=123
 * Body: { name: string (required) }
 *
 * `id` may be given as a query param or in the JSON body. Requires an
 * authenticated admin session + CSRF header. Renaming does not change the
 * category's slug (nothing currently filters by category slug — blog
 * listings filter by name — so a rename can't break an existing link); the
 * new name must stay unique.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
auth_require_admin();

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

$body = read_json_body();
if ($body === null) {
    json_response(400, ['error' => 'Invalid JSON body']);
}

$idSource = $_GET['id'] ?? ($body['id'] ?? null);
if (!is_numeric($idSource) || (int) $idSource <= 0) {
    json_response(422, ['error' => 'A valid numeric id is required']);
}
$id = (int) $idSource;

$name = is_string($body['name'] ?? null) ? taxonomy_normalize_name($body['name']) : '';
if ($name === '' || blog_strlen($name) > 100) {
    json_response(422, ['error' => 'name is required and must be at most 100 characters']);
}

try {
    $pdo = Database::getConnection();

    $existing = taxonomy_find($pdo, 'categories', $id);
    if ($existing === null) {
        json_response(404, ['error' => 'Category not found']);
    }

    if (taxonomy_name_exists($pdo, 'categories', $name, $id)) {
        json_response(409, ['error' => "Category \"{$name}\" already exists"]);
    }

    try {
        $pdo->prepare('UPDATE categories SET name = :name WHERE id = :id')
            ->execute(['name' => $name, 'id' => $id]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            json_response(409, ['error' => "Category \"{$name}\" already exists"]);
        }

        throw $e;
    }

    $updated = taxonomy_find($pdo, 'categories', $id);

    json_response(200, ['data' => taxonomy_format($updated)]);
} catch (Throwable $e) {
    error_log('[categories/update] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
