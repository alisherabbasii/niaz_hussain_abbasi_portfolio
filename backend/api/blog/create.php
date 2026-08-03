<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Blog.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * POST /api/blog/create.php
 * Body: {
 *   title: string (required),
 *   content: string (required),
 *   slug?: string (derived from title if omitted),
 *   excerpt?: string,
 *   author?: string|int (admin id, name, or email; defaults to the caller),
 *   category?: string (found-or-created by name),
 *   tags?: string[] (each found-or-created by name),
 *   featured?: bool,
 *   draft?: bool (default true),
 *   seo_title?: string|null,
 *   seo_description?: string|null,
 *   publish_date?: string|null (any strtotime-parseable date; defaults to
 *                    now when draft is false and no date is given)
 * }
 *
 * Requires an authenticated admin session + CSRF header. Slugs must be
 * unique across all blog posts.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(405, ['error' => 'Method not allowed']);
}

session_bootstrap();
csrf_ensure_token();
$admin = auth_require_admin();

if (!csrf_verify_request()) {
    json_response(403, ['error' => 'Invalid or missing CSRF token']);
}

$body = read_json_body();

if ($body === null) {
    json_response(400, ['error' => 'Invalid JSON body']);
}

$title = is_string($body['title'] ?? null) ? trim($body['title']) : '';
$content = is_string($body['content'] ?? null) ? trim($body['content']) : '';

if ($title === '' || blog_strlen($title) > 200) {
    json_response(422, ['error' => 'title is required and must be at most 200 characters']);
}

if ($content === '') {
    json_response(422, ['error' => 'content is required']);
}

$slug = is_string($body['slug'] ?? null) ? trim($body['slug']) : '';
if ($slug === '') {
    $slug = blog_slugify($title);
}
if ($slug === '' || blog_strlen($slug) > 220 || !blog_is_valid_slug($slug)) {
    json_response(422, ['error' => 'slug must be lowercase alphanumeric segments separated by hyphens, at most 220 characters']);
}

$excerpt = is_string($body['excerpt'] ?? null) ? trim($body['excerpt']) : '';
if (blog_strlen($excerpt) > 400) {
    json_response(422, ['error' => 'excerpt must be at most 400 characters']);
}

$seoTitle = array_key_exists('seo_title', $body) && $body['seo_title'] !== null
    ? trim((string) $body['seo_title'])
    : null;
if ($seoTitle !== null && blog_strlen($seoTitle) > 200) {
    json_response(422, ['error' => 'seo_title must be at most 200 characters']);
}

$seoDescription = array_key_exists('seo_description', $body) && $body['seo_description'] !== null
    ? trim((string) $body['seo_description'])
    : null;
if ($seoDescription !== null && blog_strlen($seoDescription) > 400) {
    json_response(422, ['error' => 'seo_description must be at most 400 characters']);
}

$featured = filter_var($body['featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
$draft = filter_var($body['draft'] ?? true, FILTER_VALIDATE_BOOLEAN);
$status = $draft ? 'draft' : 'published';

$tags = [];
if (array_key_exists('tags', $body)) {
    if (!is_array($body['tags'])) {
        json_response(422, ['error' => 'tags must be an array of strings']);
    }
    $tags = $body['tags'];
}

try {
    $pdo = Database::getConnection();

    if (blog_slug_exists($pdo, $slug)) {
        json_response(409, ['error' => "slug \"{$slug}\" is already in use"]);
    }

    try {
        $publishDate = blog_parse_datetime($body['publish_date'] ?? null);
    } catch (InvalidArgumentException $e) {
        json_response(422, ['error' => $e->getMessage()]);
    }
    if (!$draft && $publishDate === null) {
        $publishDate = date('Y-m-d H:i:s');
    }

    $pdo->beginTransaction();

    try {
        $categoryId = blog_resolve_category_id($pdo, is_string($body['category'] ?? null) ? $body['category'] : null);
        $authorId = blog_resolve_author_id($pdo, $body['author'] ?? null, (int) $admin['id']);

        $insert = $pdo->prepare(
            'INSERT INTO blog_posts
                (title, slug, description, content, category_id, author_id, status, featured,
                 seo_title, seo_description, published_at)
             VALUES
                (:title, :slug, :description, :content, :category_id, :author_id, :status, :featured,
                 :seo_title, :seo_description, :published_at)'
        );
        $insert->execute([
            'title' => $title,
            'slug' => $slug,
            'description' => $excerpt,
            'content' => $content,
            'category_id' => $categoryId,
            'author_id' => $authorId,
            'status' => $status,
            'featured' => $featured ? 1 : 0,
            'seo_title' => $seoTitle,
            'seo_description' => $seoDescription,
            'published_at' => $publishDate,
        ]);

        $postId = (int) $pdo->lastInsertId();

        blog_sync_tags($pdo, $postId, $tags);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();

        if ($e instanceof InvalidArgumentException) {
            json_response(422, ['error' => $e->getMessage()]);
        }

        if ($e instanceof PDOException && $e->getCode() === '23000') {
            json_response(409, ['error' => "slug \"{$slug}\" is already in use"]);
        }

        throw $e;
    }

    $stmt = $pdo->prepare(blog_select_base() . ' WHERE bp.id = :id LIMIT 1');
    $stmt->execute(['id' => $postId]);
    $row = $stmt->fetch();

    json_response(201, ['data' => blog_format_post($row, blog_fetch_tags($pdo, $postId))]);
} catch (Throwable $e) {
    error_log('[blog/create] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
