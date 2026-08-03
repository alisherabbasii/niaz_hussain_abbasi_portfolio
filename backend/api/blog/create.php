<?php

declare(strict_types=1);

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../helpers/Session.php';
require_once __DIR__ . '/../../helpers/Database.php';
require_once __DIR__ . '/../../helpers/Blog.php';
require_once __DIR__ . '/../../helpers/Permissions.php';
require_once __DIR__ . '/../../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

/**
 * POST /api/blog/create.php
 * Body: {
 *   title: string (required),
 *   content: string (required),
 *   slug?: string (derived from title if omitted),
 *   excerpt? / short_description?: string,
 *   cover_image?: string|null (an already-uploaded path, e.g. from
 *                  POST /api/upload/cover.php's returned url),
 *   cover_image_alt?: string|null,
 *   author?: string|int (admin id, name, or email; defaults to the caller;
 *              an 'editor' caller may only author as themselves),
 *   category?: string (found-or-created by name),
 *   tags?: string[] (each found-or-created by name),
 *   featured? / is_featured?: bool,
 *   draft?: bool (default true) / status?: 'draft'|'published',
 *   seo_title?: string|null,
 *   seo_description?: string|null,
 *   publish_date? / publish_at?: string|null (any strtotime-parseable date —
 *                  a future date schedules the post: it's stored as
 *                  published, but stays hidden from public reads and
 *                  `published_at` stays null until that time arrives)
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

$excerptInput = blog_body_get($body, 'excerpt', 'short_description');
$excerpt = is_string($excerptInput) ? trim($excerptInput) : '';
if (blog_strlen($excerpt) > 400) {
    json_response(422, ['error' => 'excerpt (short_description) must be at most 400 characters']);
}

$coverImageInput = blog_body_get($body, 'cover_image');
$coverImage = ($coverImageInput !== null && $coverImageInput !== '') ? trim((string) $coverImageInput) : null;
if ($coverImage !== null && !blog_is_valid_cover_image_path($coverImage)) {
    json_response(422, ['error' => 'cover_image must be an uploaded file path (starting with "/"), at most 500 characters']);
}

$coverImageAltInput = blog_body_get($body, 'cover_image_alt');
$coverImageAlt = ($coverImageAltInput !== null && $coverImageAltInput !== '') ? trim((string) $coverImageAltInput) : null;
if ($coverImageAlt !== null && blog_strlen($coverImageAlt) > 300) {
    json_response(422, ['error' => 'cover_image_alt must be at most 300 characters']);
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

$featured = filter_var(blog_body_get($body, 'featured', 'is_featured') ?? false, FILTER_VALIDATE_BOOLEAN);

$draft = true;
if (blog_body_has($body, 'status')) {
    $status = is_string($body['status']) ? trim($body['status']) : '';
    if (!in_array($status, ['draft', 'published'], true)) {
        json_response(422, ['error' => "status must be 'draft' or 'published'"]);
    }
    $draft = $status === 'draft';
} elseif (blog_body_has($body, 'draft')) {
    $draft = filter_var($body['draft'], FILTER_VALIDATE_BOOLEAN);
}
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

    $publishAtInput = blog_body_get($body, 'publish_at', 'publish_date');
    try {
        $requestedPublishAt = blog_parse_datetime($publishAtInput, 'publish_at');
    } catch (InvalidArgumentException $e) {
        json_response(422, ['error' => $e->getMessage()]);
    }
    $publishState = blog_compute_publish_state(
        $draft,
        blog_body_has($body, 'publish_at', 'publish_date'),
        $requestedPublishAt,
        null,
        null
    );

    $authorInput = $body['author'] ?? null;
    try {
        $authorId = blog_resolve_author_id($pdo, $authorInput, (int) $admin['id']);
    } catch (InvalidArgumentException $e) {
        json_response(422, ['error' => $e->getMessage()]);
    }
    if (($admin['role'] ?? null) === 'editor' && $authorId !== (int) $admin['id']) {
        json_response(403, ['error' => 'Editors may only create posts authored by themselves.']);
    }

    $pdo->beginTransaction();

    try {
        $categoryId = blog_resolve_category_id($pdo, is_string($body['category'] ?? null) ? $body['category'] : null);

        $insert = $pdo->prepare(
            'INSERT INTO blog_posts
                (title, slug, description, content, cover_image_path, cover_image_alt,
                 category_id, author_id, status, featured,
                 seo_title, seo_description, publish_at, published_at)
             VALUES
                (:title, :slug, :description, :content, :cover_image_path, :cover_image_alt,
                 :category_id, :author_id, :status, :featured,
                 :seo_title, :seo_description, :publish_at, :published_at)'
        );
        $insert->execute([
            'title' => $title,
            'slug' => $slug,
            'description' => $excerpt,
            'content' => $content,
            'cover_image_path' => $coverImage,
            'cover_image_alt' => $coverImageAlt,
            'category_id' => $categoryId,
            'author_id' => $authorId,
            'status' => $status,
            'featured' => $featured ? 1 : 0,
            'seo_title' => $seoTitle,
            'seo_description' => $seoDescription,
            'publish_at' => $publishState['publish_at'],
            'published_at' => $publishState['published_at'],
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
