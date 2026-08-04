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
 * POST /api/tags/create.php
 * Body: { name: string (required) }
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
if ($name === '' || blog_strlen($name) > 60) {
    json_response(422, ['error' => 'name is required and must be at most 60 characters']);
}

$slugBase = blog_slugify($name);
if ($slugBase === '') {
    json_response(422, ['error' => 'name must contain at least one letter or number']);
}

try {
    $pdo = Database::getConnection();

    if (taxonomy_name_exists($pdo, 'tags', $name)) {
        json_response(409, ['error' => "Tag \"{$name}\" already exists"]);
    }

    $pdo->beginTransaction();

    try {
        $slug = blog_unique_table_slug($pdo, 'tags', $slugBase);

        $insert = $pdo->prepare('INSERT INTO tags (name, slug) VALUES (:name, :slug)');
        $insert->execute(['name' => $name, 'slug' => $slug]);
        $id = (int) $pdo->lastInsertId();

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();

        if ($e instanceof PDOException && $e->getCode() === '23000') {
            json_response(409, ['error' => "Tag \"{$name}\" already exists"]);
        }

        throw $e;
    }

    $tag = taxonomy_find($pdo, 'tags', $id);

    json_response(201, ['data' => taxonomy_format($tag)]);
} catch (Throwable $e) {
    error_log('[tags/create] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
