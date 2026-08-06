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
 * POST /api/categories/create.php
 * Body: { name: string (required), description?: string|null }
 *
 * Requires an authenticated admin session + CSRF header. `name` is
 * normalized (trimmed, internal whitespace collapsed) and must be unique;
 * the slug is derived from the normalized name and de-duplicated if needed.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
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

$name = is_string($body['name'] ?? null) ? taxonomy_normalize_name($body['name']) : '';
if ($name === '' || blog_strlen($name) > 100) {
    json_response(422, ['error' => 'name is required and must be at most 100 characters']);
}

$slugBase = blog_slugify($name);
if ($slugBase === '') {
    json_response(422, ['error' => 'name must contain at least one letter or number']);
}

$descriptionInput = array_key_exists('description', $body) ? $body['description'] : null;
$description = ($descriptionInput !== null && $descriptionInput !== '') ? trim((string) $descriptionInput) : null;

try {
    $pdo = Database::getConnection();

    if (taxonomy_name_exists($pdo, 'categories', $name)) {
        json_response(409, ['error' => "Category \"{$name}\" already exists"]);
    }

    $pdo->beginTransaction();

    try {
        $slug = blog_unique_table_slug($pdo, 'categories', $slugBase);

        $insert = $pdo->prepare('INSERT INTO categories (name, slug, description) VALUES (:name, :slug, :description)');
        $insert->execute(['name' => $name, 'slug' => $slug, 'description' => $description]);
        $id = (int) $pdo->lastInsertId();

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();

        if ($e instanceof PDOException && $e->getCode() === '23000') {
            json_response(409, ['error' => "Category \"{$name}\" already exists"]);
        }

        throw $e;
    }

    $category = taxonomy_find($pdo, 'categories', $id);

    json_response(201, ['data' => taxonomy_format($category)]);
} catch (Throwable $e) {
    error_log('[categories/create] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
