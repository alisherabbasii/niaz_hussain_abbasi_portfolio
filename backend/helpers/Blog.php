<?php

declare(strict_types=1);

/**
 * Shared logic for backend/api/blog/*.php: slug handling, resolving the
 * free-text author/category/tags fields the blog CRUD API exposes onto the
 * relational admins/categories/tags tables the schema actually stores them
 * in, and formatting a blog_posts row (plus its joins) into the API's JSON
 * shape.
 */

const BLOG_SLUG_PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

/** Deterministically derive a URL slug from arbitrary text (lowercase, ASCII, hyphenated). */
function blog_slugify(string $text): string
{
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    if ($ascii === false) {
        $ascii = $text;
    }

    $slug = strtolower(trim($ascii));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';

    return trim($slug, '-');
}

function blog_is_valid_slug(string $slug): bool
{
    return preg_match(BLOG_SLUG_PATTERN, $slug) === 1;
}

/** Character length of a UTF-8 string, without depending on the mbstring extension. */
function blog_strlen(string $value): int
{
    if (function_exists('iconv_strlen')) {
        $length = @iconv_strlen($value, 'UTF-8');
        if ($length !== false) {
            return $length;
        }
    }

    return strlen($value);
}

/** True if the given slug is already used by a different blog post. */
function blog_slug_exists(PDO $pdo, string $slug, ?int $excludeId = null): bool
{
    if ($excludeId !== null) {
        $stmt = $pdo->prepare('SELECT id FROM blog_posts WHERE slug = :slug AND id != :id LIMIT 1');
        $stmt->execute(['slug' => $slug, 'id' => $excludeId]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM blog_posts WHERE slug = :slug LIMIT 1');
        $stmt->execute(['slug' => $slug]);
    }

    return $stmt->fetch() !== false;
}

/** Find-or-create a unique slug in $table, avoiding collisions on $base. */
function blog_unique_table_slug(PDO $pdo, string $table, string $base): string
{
    $slug = $base !== '' ? $base : bin2hex(random_bytes(4));
    $suffix = 2;

    while (true) {
        $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE slug = :slug LIMIT 1");
        $stmt->execute(['slug' => $slug]);

        if ($stmt->fetch() === false) {
            return $slug;
        }

        $slug = $base . '-' . $suffix++;
    }
}

/**
 * Resolve a free-text category name to a categories.id, creating the
 * category if it doesn't exist yet. Returns null for an empty/absent name.
 *
 * @throws InvalidArgumentException if the name has no usable characters.
 */
function blog_resolve_category_id(PDO $pdo, ?string $categoryName): ?int
{
    $name = trim((string) $categoryName);

    if ($name === '') {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id FROM categories WHERE name = :name LIMIT 1');
    $stmt->execute(['name' => $name]);
    $row = $stmt->fetch();

    if ($row !== false) {
        return (int) $row['id'];
    }

    $slug = blog_slugify($name);

    if ($slug === '') {
        throw new InvalidArgumentException('Category must contain at least one letter or number.');
    }

    $slug = blog_unique_table_slug($pdo, 'categories', $slug);

    $insert = $pdo->prepare('INSERT INTO categories (name, slug) VALUES (:name, :slug)');
    $insert->execute(['name' => $name, 'slug' => $slug]);

    return (int) $pdo->lastInsertId();
}

/**
 * Resolve the "author" request field to an admins.id. Accepts an admin id
 * (int or numeric string), an admin name/email (string), or null/'' to fall
 * back to the currently authenticated admin.
 *
 * @throws InvalidArgumentException if a given author doesn't match an active admin.
 */
function blog_resolve_author_id(PDO $pdo, mixed $authorInput, int $fallbackAdminId): int
{
    if ($authorInput === null || $authorInput === '') {
        return $fallbackAdminId;
    }

    if (is_int($authorInput) || (is_string($authorInput) && ctype_digit($authorInput))) {
        $id = (int) $authorInput;
        $stmt = $pdo->prepare('SELECT id FROM admins WHERE id = :id AND is_active = 1 LIMIT 1');
        $stmt->execute(['id' => $id]);

        if ($stmt->fetch() === false) {
            throw new InvalidArgumentException("No active author found with id {$id}.");
        }

        return $id;
    }

    if (is_string($authorInput)) {
        // Real (non-emulated) prepared statements can't reuse one named
        // placeholder more than once per query, so each OR branch gets its
        // own parameter bound to the same value (see the same pattern in
        // backend/api/blog/index.php's search filter).
        $stmt = $pdo->prepare(
            'SELECT id FROM admins WHERE (full_name = :name OR username = :username OR email = :email) AND is_active = 1 LIMIT 1'
        );
        $stmt->execute(['name' => $authorInput, 'username' => $authorInput, 'email' => $authorInput]);
        $row = $stmt->fetch();

        if ($row === false) {
            throw new InvalidArgumentException("No active author found matching \"{$authorInput}\".");
        }

        return (int) $row['id'];
    }

    throw new InvalidArgumentException('author must be a string or an integer id.');
}

/**
 * Replace a post's tag set with $tagNames: find-or-create each tag, then
 * overwrite blog_post_tags for that post. Names are deduplicated
 * case-insensitively; blank entries are dropped.
 */
function blog_sync_tags(PDO $pdo, int $postId, array $tagNames): void
{
    $normalized = [];

    foreach ($tagNames as $tagName) {
        if (!is_string($tagName)) {
            continue;
        }

        $trimmed = trim($tagName);

        if ($trimmed === '') {
            continue;
        }

        $normalized[strtolower($trimmed)] = $trimmed;
    }

    $tagIds = [];

    foreach ($normalized as $name) {
        $stmt = $pdo->prepare('SELECT id FROM tags WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        $row = $stmt->fetch();

        if ($row !== false) {
            $tagIds[] = (int) $row['id'];
            continue;
        }

        $slug = blog_unique_table_slug($pdo, 'tags', blog_slugify($name));

        $insert = $pdo->prepare('INSERT INTO tags (name, slug) VALUES (:name, :slug)');
        $insert->execute(['name' => $name, 'slug' => $slug]);
        $tagIds[] = (int) $pdo->lastInsertId();
    }

    $pdo->prepare('DELETE FROM blog_post_tags WHERE post_id = :post_id')->execute(['post_id' => $postId]);

    if ($tagIds !== []) {
        $insert = $pdo->prepare('INSERT INTO blog_post_tags (post_id, tag_id) VALUES (:post_id, :tag_id)');
        foreach ($tagIds as $tagId) {
            $insert->execute(['post_id' => $postId, 'tag_id' => $tagId]);
        }
    }
}

/** Tag names attached to a post, alphabetically sorted. */
function blog_fetch_tags(PDO $pdo, int $postId): array
{
    $stmt = $pdo->prepare(
        'SELECT t.name FROM tags t
         INNER JOIN blog_post_tags bpt ON bpt.tag_id = t.id
         WHERE bpt.post_id = :post_id
         ORDER BY t.name ASC'
    );
    $stmt->execute(['post_id' => $postId]);

    return array_column($stmt->fetchAll(), 'name');
}

/**
 * Parse a request date/datetime value into MySQL DATETIME format.
 * Returns null for an empty/absent value.
 *
 * @throws InvalidArgumentException if the value isn't a parseable date string.
 */
function blog_parse_datetime(mixed $value, string $fieldName = 'publish_date'): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_string($value)) {
        throw new InvalidArgumentException("{$fieldName} must be a string.");
    }

    $timestamp = strtotime($value);

    if ($timestamp === false) {
        throw new InvalidArgumentException("{$fieldName} \"{$value}\" is not a valid date.");
    }

    return date('Y-m-d H:i:s', $timestamp);
}

/**
 * First value present in $body among $keys (checked in order), distinguishing
 * "present with any value (including null)" from "absent entirely".
 */
function blog_body_has(array $body, string ...$keys): bool
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $body)) {
            return true;
        }
    }

    return false;
}

/** Value of the first key in $keys that exists in $body, or null if none do. */
function blog_body_get(array $body, string ...$keys): mixed
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $body)) {
            return $body[$key];
        }
    }

    return null;
}

/**
 * Compute the (publish_at, published_at) pair a create/update should persist,
 * given the post's draft/published state and the caller's requested
 * schedule.
 *
 * - `publish_at` is the admin-chosen scheduling target: when omitted on a
 *   publish, it defaults to "now" (immediate); when omitted on an edit that
 *   doesn't touch scheduling, the existing value is kept.
 * - `published_at` is set exactly once — the first time the post is both
 *   `published` and its effective `publish_at` is now-or-past — and is never
 *   overwritten again afterward (an already-set value survives unpublishing,
 *   re-editing, or rescheduling), matching "set on first publication, not
 *   replaced on every edit".
 * - A future `publish_at` on a published post leaves `published_at` null:
 *   the post is scheduled, not yet actually live (callers filter public
 *   reads on `publish_at <= NOW()` to hide it until then).
 * - Moving a post back to draft leaves both columns untouched.
 *
 * @return array{publish_at: ?string, published_at: ?string}
 */
function blog_compute_publish_state(
    bool $isDraft,
    bool $publishAtProvided,
    ?string $requestedPublishAt,
    ?string $existingPublishAt,
    ?string $existingPublishedAt
): array {
    if ($isDraft) {
        return [
            'publish_at' => $publishAtProvided ? $requestedPublishAt : $existingPublishAt,
            'published_at' => $existingPublishedAt,
        ];
    }

    $now = date('Y-m-d H:i:s');
    $target = $publishAtProvided ? $requestedPublishAt : $existingPublishAt;
    $target ??= $now;

    $publishedAt = $existingPublishedAt;
    if ($publishedAt === null && $target <= $now) {
        $publishedAt = $target;
    }

    return [
        'publish_at' => $target,
        'published_at' => $publishedAt,
    ];
}

/**
 * Catch up published_at for a post whose scheduled publish_at has arrived
 * but which hasn't been written to since (blog_compute_publish_state only
 * ever runs on a create/update call, so a scheduled post nobody edits again
 * after it goes live would otherwise leave published_at null forever).
 * Mutates $row in place so the caller's response reflects the backfilled
 * value immediately, without requiring a second read.
 *
 * Deliberately does not touch updated_at: this is the system catching up a
 * value that should already be true, not an admin edit (see
 * docs/BLOG-DATE-AND-PUBLISHING-RULES.md's date rules) — the `updated_at =
 * updated_at` self-assignment suppresses MySQL's ON UPDATE CURRENT_TIMESTAMP
 * for this statement, which would otherwise fire because *some* column in
 * the row changed.
 *
 * Call on every row read from blog_select_base() (index.php, show.php) so
 * a scheduled post becomes fully "published_at is set" the moment any
 * caller (admin or public) reads it after its publish_at passes — no cron
 * needed.
 */
function blog_backfill_published_at(PDO $pdo, array &$row): void
{
    if ($row['status'] !== 'published' || $row['published_at'] !== null || $row['publish_at'] === null) {
        return;
    }

    if ($row['publish_at'] > date('Y-m-d H:i:s')) {
        return;
    }

    $stmt = $pdo->prepare(
        'UPDATE blog_posts SET published_at = :published_at, updated_at = updated_at
         WHERE id = :id AND published_at IS NULL'
    );
    $stmt->execute(['published_at' => $row['publish_at'], 'id' => $row['id']]);

    $row['published_at'] = $row['publish_at'];
}

/** True if $value is a plausible already-uploaded path (see backend/helpers/Upload.php's public_url shape). */
function blog_is_valid_cover_image_path(string $value): bool
{
    return str_starts_with($value, '/') && blog_strlen($value) <= 500;
}

/**
 * True if a blog_posts row (from blog_select_base()) should be visible to an
 * anonymous/public caller: published, and either not scheduled or its
 * scheduled publish_at has already arrived.
 */
function blog_is_visible_to_public(array $row): bool
{
    if ($row['status'] !== 'published') {
        return false;
    }

    return $row['publish_at'] === null || $row['publish_at'] <= date('Y-m-d H:i:s');
}

/**
 * The shared SELECT base for reading blog_posts with its author/category
 * names joined in. Callers append WHERE/ORDER BY/LIMIT as needed.
 */
function blog_select_base(): string
{
    return 'SELECT bp.*, a.full_name AS author_name, c.name AS category_name
             FROM blog_posts bp
             LEFT JOIN admins a ON a.id = bp.author_id
             LEFT JOIN categories c ON c.id = bp.category_id';
}

/** Format one blog_posts row (from blog_select_base()) plus its tags into the API's JSON shape. */
function blog_format_post(array $row, array $tags): array
{
    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'slug' => $row['slug'],
        'excerpt' => $row['description'],
        'content' => $row['content'],
        'cover_image' => $row['cover_image_path'],
        'cover_image_alt' => $row['cover_image_alt'],
        'author' => $row['author_name'],
        'category' => $row['category_name'],
        'tags' => $tags,
        'featured' => (bool) $row['featured'],
        'draft' => $row['status'] === 'draft',
        'seo_title' => $row['seo_title'],
        'seo_description' => $row['seo_description'],
        'publish_at' => $row['publish_at'],
        'publish_date' => $row['published_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
