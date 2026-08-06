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
 * Body: { name: string (required), slug?: string, description?: string|null }
 *
 * `id` may be given as a query param or in the JSON body. Requires an
 * authenticated admin session + CSRF header. `slug`/`description` are only
 * changed when present in the body — omitting them leaves the existing
 * value untouched. The new name/slug must each stay unique.
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

    $slug = $existing['slug'];
    if (array_key_exists('slug', $body)) {
        $slug = is_string($body['slug']) ? trim($body['slug']) : '';
        if ($slug === '' || blog_strlen($slug) > 120 || !blog_is_valid_slug($slug)) {
            json_response(422, ['error' => 'slug must be lowercase alphanumeric segments separated by hyphens, at most 120 characters']);
        }
        if (taxonomy_slug_exists($pdo, 'categories', $slug, $id)) {
            json_response(409, ['error' => "Category slug \"{$slug}\" is already in use"]);
        }
    }

    $description = $existing['description'];
    if (array_key_exists('description', $body)) {
        $descriptionInput = $body['description'];
        $description = ($descriptionInput !== null && $descriptionInput !== '') ? trim((string) $descriptionInput) : null;
    }

    try {
        $pdo->prepare('UPDATE categories SET name = :name, slug = :slug, description = :description WHERE id = :id')
            ->execute(['name' => $name, 'slug' => $slug, 'description' => $description, 'id' => $id]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            json_response(409, ['error' => "Category \"{$name}\" already exists"]);
        }

        throw $e;
    }

    $updated = taxonomy_find($pdo, 'categories', $id);

    json_response(200, ['data' => taxonomy_format($updated, taxonomy_category_post_count($pdo, $id))]);
} catch (Throwable $e) {
    error_log('[categories/update] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
