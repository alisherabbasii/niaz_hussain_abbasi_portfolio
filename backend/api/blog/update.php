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
 * PUT /api/blog/update.php?id=123
 * Body: any subset of the fields accepted by create.php (including its
 * short_description/is_featured/status/publish_at aliases). Fields omitted
 * from the body are left unchanged; a field explicitly set to null clears
 * it where the column is nullable (category, cover_image, cover_image_alt,
 * seo_title, seo_description).
 *
 * `id` may be given as a query param or in the JSON body. Requires an
 * authenticated admin session + CSRF header. 'editor' callers may only
 * update posts they authored. Slugs must stay unique.
 */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') {
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

$idSource = $_GET['id'] ?? ($body['id'] ?? null);
if (!is_numeric($idSource) || (int) $idSource <= 0) {
    json_response(422, ['error' => 'A valid numeric id is required']);
}
$id = (int) $idSource;

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare(blog_select_base() . ' WHERE bp.id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $existing = $stmt->fetch();

    if ($existing === false) {
        json_response(404, ['error' => 'Blog post not found']);
    }

    permission_require_can_manage_post($admin, (int) $existing['author_id']);

    $title = $existing['title'];
    if (array_key_exists('title', $body)) {
        $title = is_string($body['title']) ? trim($body['title']) : '';
        if ($title === '' || blog_strlen($title) > 200) {
            json_response(422, ['error' => 'title must be a non-empty string of at most 200 characters']);
        }
    }

    $content = $existing['content'];
    if (array_key_exists('content', $body)) {
        $content = is_string($body['content']) ? trim($body['content']) : '';
        if ($content === '') {
            json_response(422, ['error' => 'content must be a non-empty string']);
        }
    }

    $slug = $existing['slug'];
    if (array_key_exists('slug', $body)) {
        $slug = is_string($body['slug']) ? trim($body['slug']) : '';
        if ($slug === '' || blog_strlen($slug) > 220 || !blog_is_valid_slug($slug)) {
            json_response(422, ['error' => 'slug must be lowercase alphanumeric segments separated by hyphens, at most 220 characters']);
        }
    }

    $excerpt = $existing['description'];
    if (blog_body_has($body, 'excerpt', 'short_description')) {
        $excerptInput = blog_body_get($body, 'excerpt', 'short_description');
        $excerpt = is_string($excerptInput) ? trim($excerptInput) : '';
        if (blog_strlen($excerpt) > 400) {
            json_response(422, ['error' => 'excerpt (short_description) must be at most 400 characters']);
        }
    }

    $coverImage = $existing['cover_image_path'];
    if (blog_body_has($body, 'cover_image')) {
        $coverImageInput = blog_body_get($body, 'cover_image');
        $coverImage = ($coverImageInput !== null && $coverImageInput !== '') ? trim((string) $coverImageInput) : null;
        if ($coverImage !== null && !blog_is_valid_cover_image_path($coverImage)) {
            json_response(422, ['error' => 'cover_image must be an uploaded file path (starting with "/"), at most 500 characters']);
        }
    }

    $coverImageAlt = $existing['cover_image_alt'];
    if (blog_body_has($body, 'cover_image_alt')) {
        $coverImageAltInput = blog_body_get($body, 'cover_image_alt');
        $coverImageAlt = ($coverImageAltInput !== null && $coverImageAltInput !== '') ? trim((string) $coverImageAltInput) : null;
        if ($coverImageAlt !== null && blog_strlen($coverImageAlt) > 300) {
            json_response(422, ['error' => 'cover_image_alt must be at most 300 characters']);
        }
    }

    $seoTitle = $existing['seo_title'];
    if (array_key_exists('seo_title', $body)) {
        $seoTitle = $body['seo_title'] !== null ? trim((string) $body['seo_title']) : null;
        if ($seoTitle !== null && blog_strlen($seoTitle) > 200) {
            json_response(422, ['error' => 'seo_title must be at most 200 characters']);
        }
    }

    $seoDescription = $existing['seo_description'];
    if (array_key_exists('seo_description', $body)) {
        $seoDescription = $body['seo_description'] !== null ? trim((string) $body['seo_description']) : null;
        if ($seoDescription !== null && blog_strlen($seoDescription) > 400) {
            json_response(422, ['error' => 'seo_description must be at most 400 characters']);
        }
    }

    $featured = (bool) $existing['featured'];
    if (blog_body_has($body, 'featured', 'is_featured')) {
        $featured = filter_var(blog_body_get($body, 'featured', 'is_featured'), FILTER_VALIDATE_BOOLEAN);
    }

    $draft = $existing['status'] === 'draft';
    if (blog_body_has($body, 'status')) {
        $statusInput = is_string($body['status']) ? trim($body['status']) : '';
        if (!in_array($statusInput, ['draft', 'published'], true)) {
            json_response(422, ['error' => "status must be 'draft' or 'published'"]);
        }
        $draft = $statusInput === 'draft';
    } elseif (blog_body_has($body, 'draft')) {
        $draft = filter_var($body['draft'], FILTER_VALIDATE_BOOLEAN);
    }
    $status = $draft ? 'draft' : 'published';

    $publishAtProvided = blog_body_has($body, 'publish_at', 'publish_date');
    $requestedPublishAt = $existing['publish_at'];
    if ($publishAtProvided) {
        try {
            $requestedPublishAt = blog_parse_datetime(blog_body_get($body, 'publish_at', 'publish_date'), 'publish_at');
        } catch (InvalidArgumentException $e) {
            json_response(422, ['error' => $e->getMessage()]);
        }
    }
    $publishState = blog_compute_publish_state(
        $draft,
        $publishAtProvided,
        $requestedPublishAt,
        $existing['publish_at'],
        $existing['published_at']
    );

    $tagsProvided = array_key_exists('tags', $body);
    $tags = [];
    if ($tagsProvided) {
        if (!is_array($body['tags'])) {
            json_response(422, ['error' => 'tags must be an array of strings']);
        }
        $tags = $body['tags'];
    }

    if (blog_slug_exists($pdo, $slug, $id)) {
        json_response(409, ['error' => "slug \"{$slug}\" is already in use"]);
    }

    $authorId = (int) $existing['author_id'];
    if (array_key_exists('author', $body)) {
        try {
            $authorId = blog_resolve_author_id($pdo, $body['author'], (int) $admin['id']);
        } catch (InvalidArgumentException $e) {
            json_response(422, ['error' => $e->getMessage()]);
        }
        if (($admin['role'] ?? null) === 'editor' && $authorId !== (int) $admin['id']) {
            json_response(403, ['error' => 'Editors may only assign posts to themselves.']);
        }
    }

    $pdo->beginTransaction();

    try {
        $categoryId = $existing['category_id'] !== null ? (int) $existing['category_id'] : null;
        if (array_key_exists('category', $body)) {
            $categoryId = blog_resolve_category_id($pdo, is_string($body['category']) ? $body['category'] : null);
        }

        $update = $pdo->prepare(
            'UPDATE blog_posts SET
                title = :title,
                slug = :slug,
                description = :description,
                content = :content,
                cover_image_path = :cover_image_path,
                cover_image_alt = :cover_image_alt,
                category_id = :category_id,
                author_id = :author_id,
                status = :status,
                featured = :featured,
                seo_title = :seo_title,
                seo_description = :seo_description,
                publish_at = :publish_at,
                published_at = :published_at
             WHERE id = :id'
        );
        $update->execute([
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
            'id' => $id,
        ]);

        if ($tagsProvided) {
            blog_sync_tags($pdo, $id, $tags);
        }

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
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    json_response(200, ['data' => blog_format_post($row, blog_fetch_tags($pdo, $id))]);
} catch (Throwable $e) {
    error_log('[blog/update] ' . $e->getMessage());
    json_response(500, ['error' => 'Something went wrong. Please try again.']);
}
