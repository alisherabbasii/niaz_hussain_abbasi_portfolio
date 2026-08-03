<?php

declare(strict_types=1);

/**
 * Manual, self-contained integration test for backend/api/blog/*.php.
 *
 * There is no PHPUnit/Pest in this repo (no composer.json), so this is a
 * plain CLI script that drives the real HTTP endpoints with cURL against a
 * running PHP built-in server, exactly like the React frontend would (same
 * cookie/CSRF dance — see backend/middleware/CsrfMiddleware.php).
 *
 * Usage:
 *   php -S 127.0.0.1:8987 -t backend &
 *   php backend/tests/blog_crud_test.php
 *   (BASE_URL env var overrides the default http://127.0.0.1:8987)
 *
 * Exits 0 if every assertion passed, 1 otherwise. Cleans up every admin user
 * and blog post it creates, but leaves any category/tag rows it
 * find-or-creates (harmless, matches normal app behavior).
 */

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../helpers/Database.php';

$baseUrl = getenv('BASE_URL') ?: 'http://127.0.0.1:8987';

$failures = 0;
$passes = 0;

function report(bool $ok, string $label, string $detail = ''): void
{
    global $failures, $passes;
    if ($ok) {
        $passes++;
        echo "  PASS  {$label}\n";
    } else {
        $failures++;
        echo "  FAIL  {$label}" . ($detail !== '' ? " -- {$detail}" : '') . "\n";
    }
}

/**
 * A cookie-jar-backed HTTP client that mimics src/api/client.ts: tracks the
 * session cookie, mirrors the XSRF-TOKEN cookie into an X-CSRF-Token header
 * on every mutating request. Built on PHP stream wrappers (no ext-curl in
 * this environment) rather than cURL.
 */
final class TestClient
{
    private string $baseUrl;
    /** @var array<string,string> */
    private array $cookies = [];
    private ?string $csrfToken = null;

    public function __construct(string $baseUrl, string $identity)
    {
        $this->baseUrl = $baseUrl;
    }

    /** @return array{status:int, json: array|null, raw: string} */
    public function request(string $method, string $path, ?array $body = null, bool $withCsrf = true): array
    {
        $headers = ['Content-Type: application/json'];
        if ($withCsrf && $this->csrfToken !== null) {
            $headers[] = 'X-CSRF-Token: ' . $this->csrfToken;
        }
        if ($this->cookies !== []) {
            $pairs = [];
            foreach ($this->cookies as $name => $value) {
                $pairs[] = $name . '=' . $value;
            }
            $headers[] = 'Cookie: ' . implode('; ', $pairs);
        }

        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => $body !== null ? json_encode($body) : '',
                'ignore_errors' => true,
                'timeout' => 10,
            ],
        ]);

        $rawBody = @file_get_contents($this->baseUrl . $path, false, $context);

        if ($rawBody === false || !isset($http_response_header)) {
            fwrite(STDERR, "Request failed for {$method} {$path}\n");
            exit(1);
        }

        $status = 0;
        if (preg_match('#^HTTP/\S+\s+(\d+)#', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }

        foreach ($http_response_header as $headerLine) {
            if (preg_match('/^Set-Cookie:\s*([^=]+)=([^;]*)/i', $headerLine, $m)) {
                $this->cookies[$m[1]] = $m[2];
                if (strcasecmp($m[1], 'XSRF-TOKEN') === 0) {
                    $this->csrfToken = urldecode($m[2]);
                }
            }
        }

        $json = json_decode($rawBody, true);

        return ['status' => $status, 'json' => is_array($json) ? $json : null, 'raw' => $rawBody];
    }

    public function get(string $path): array
    {
        return $this->request('GET', $path);
    }

    public function post(string $path, array $body): array
    {
        return $this->request('POST', $path, $body);
    }

    public function put(string $path, array $body): array
    {
        return $this->request('PUT', $path, $body);
    }

    public function delete(string $path, ?array $body = null): array
    {
        return $this->request('DELETE', $path, $body);
    }

    /** Seed the CSRF cookie without needing to already be authenticated. */
    public function bootstrapCsrf(): void
    {
        $this->get('/api/auth/me.php');
    }

    public function login(string $email, string $password): array
    {
        return $this->post('/api/auth/login.php', ['email' => $email, 'password' => $password]);
    }
}

$superAdminEmail = env_get('INSTALL_ADMIN_EMAIL', required: true);
$superAdminPassword = env_get('INSTALL_ADMIN_PASSWORD', required: true);

$pdo = Database::getConnection();

$createdPostIds = [];
$createdAdminIds = [];

register_shutdown_function(function () use (&$createdPostIds, &$createdAdminIds, $pdo): void {
    foreach ($createdPostIds as $id) {
        $pdo->prepare('DELETE FROM blog_posts WHERE id = :id')->execute(['id' => $id]);
    }
    foreach ($createdAdminIds as $id) {
        $pdo->prepare('DELETE FROM admins WHERE id = :id')->execute(['id' => $id]);
    }
});

echo "== Setup ==\n";

$super = new TestClient($baseUrl, 'super');
$super->bootstrapCsrf();
$loginResp = $super->login($superAdminEmail, $superAdminPassword);
report($loginResp['status'] === 200, 'super_admin login', (string) $loginResp['status']);
if ($loginResp['status'] !== 200) {
    fwrite(STDERR, "Cannot continue without a working super_admin login. Response: {$loginResp['raw']}\n");
    exit(1);
}

// Create a throwaway 'editor' account to exercise role-scoped authorization.
$editorSuffix = bin2hex(random_bytes(4));
$editorEmail = "test.editor.{$editorSuffix}@example.test";
$editorUsername = "test_editor_{$editorSuffix}";
$editorPassword = 'Test-Password-1';

$editorCreateResp = $super->post('/api/users/create.php', [
    'full_name' => 'Test Editor',
    'username' => $editorUsername,
    'email' => $editorEmail,
    'role' => 'editor',
    'password' => $editorPassword,
    'password_confirmation' => $editorPassword,
]);
report($editorCreateResp['status'] === 201, 'create throwaway editor account', (string) $editorCreateResp['status']);
$editorId = $editorCreateResp['json']['data']['id'] ?? null;
if (is_int($editorId)) {
    $createdAdminIds[] = $editorId;
}

$editor = new TestClient($baseUrl, 'editor');
$editor->bootstrapCsrf();
$editorLoginResp = $editor->login($editorEmail, $editorPassword);
report($editorLoginResp['status'] === 200, 'editor login', (string) $editorLoginResp['status']);

$anon = new TestClient($baseUrl, 'anon');
$anon->bootstrapCsrf();

$suffix = bin2hex(random_bytes(4));

echo "\n== 1. Create draft ==\n";

$draftSlug = "test-draft-post-{$suffix}";
$createDraftResp = $super->post('/api/blog/create.php', [
    'title' => 'Test Draft Post',
    'slug' => $draftSlug,
    'short_description' => 'A draft post used for automated backend testing.',
    'content' => '<p>Draft content.</p>',
    'cover_image' => '/uploads/blog/covers/test-cover.jpg',
    'cover_image_alt' => 'A test cover image',
    'author' => $superAdminEmail,
    'category' => 'Automated Tests',
    'tags' => ['test', 'draft'],
    'status' => 'draft',
    'is_featured' => false,
    'seo_title' => 'SEO Title',
    'seo_description' => 'SEO description.',
]);
report($createDraftResp['status'] === 201, 'POST create.php (draft) -> 201', (string) $createDraftResp['status']);
$draftPost = $createDraftResp['json']['data'] ?? [];
if (isset($draftPost['id'])) {
    $createdPostIds[] = $draftPost['id'];
}
report(($draftPost['draft'] ?? null) === true, 'draft post has draft=true');
report(($draftPost['excerpt'] ?? null) === 'A draft post used for automated backend testing.', 'short_description stored as excerpt');
report(($draftPost['cover_image'] ?? null) === '/uploads/blog/covers/test-cover.jpg', 'cover_image stored/returned');
report(($draftPost['cover_image_alt'] ?? null) === 'A test cover image', 'cover_image_alt stored/returned');
report(array_key_exists('publish_date', $draftPost) && $draftPost['publish_date'] === null, 'draft has no publish_date');
report(in_array('draft', $draftPost['tags'] ?? [], true) && in_array('test', $draftPost['tags'] ?? [], true), 'tags attached correctly');

echo "\n== 2. Create published post (immediate + scheduled) ==\n";

$publishedSlug = "test-published-post-{$suffix}";
$createPublishedResp = $super->post('/api/blog/create.php', [
    'title' => 'Test Published Post',
    'slug' => $publishedSlug,
    'short_description' => 'A published post used for automated backend testing.',
    'content' => '<p>Published content.</p>',
    'author' => $superAdminEmail,
    'category' => 'Automated Tests',
    'tags' => ['test', 'published'],
    'status' => 'published',
    'is_featured' => true,
]);
report($createPublishedResp['status'] === 201, 'POST create.php (published) -> 201', (string) $createPublishedResp['status']);
$publishedPost = $createPublishedResp['json']['data'] ?? [];
if (isset($publishedPost['id'])) {
    $createdPostIds[] = $publishedPost['id'];
}
report(($publishedPost['draft'] ?? null) === false, 'published post has draft=false');
report(is_string($publishedPost['publish_date'] ?? null), 'published post got a publish_date (published_at) immediately');
report(($publishedPost['featured'] ?? null) === true, 'is_featured stored as featured=true');

$futureDate = date('Y-m-d H:i:s', strtotime('+1 year'));
$scheduledSlug = "test-scheduled-post-{$suffix}";
$createScheduledResp = $super->post('/api/blog/create.php', [
    'title' => 'Test Scheduled Post',
    'slug' => $scheduledSlug,
    'content' => '<p>Scheduled content.</p>',
    'status' => 'published',
    'publish_at' => $futureDate,
]);
report($createScheduledResp['status'] === 201, 'POST create.php (scheduled future) -> 201', (string) $createScheduledResp['status']);
$scheduledPost = $createScheduledResp['json']['data'] ?? [];
$scheduledId = $scheduledPost['id'] ?? null;
if (is_int($scheduledId)) {
    $createdPostIds[] = $scheduledId;
}
report(($scheduledPost['publish_at'] ?? null) === $futureDate, 'scheduled post stores the future publish_at target');
report(array_key_exists('publish_date', $scheduledPost) && $scheduledPost['publish_date'] === null, 'scheduled post has NO published_at yet (not actually live)');

$anonShowScheduled = $anon->get('/api/blog/show.php?id=' . $scheduledId);
report($anonShowScheduled['status'] === 404, 'anonymous caller cannot see a future-scheduled post (404)', (string) $anonShowScheduled['status']);

$adminShowScheduled = $super->get('/api/blog/show.php?id=' . $scheduledId);
report($adminShowScheduled['status'] === 200, 'admin caller CAN see a future-scheduled post', (string) $adminShowScheduled['status']);

$anonIndex = $anon->get('/api/blog/index.php?per_page=50');
$anonSlugs = array_column($anonIndex['json']['data'] ?? [], 'slug');
report(!in_array($scheduledSlug, $anonSlugs, true), 'scheduled post absent from anonymous listing');
report(in_array($publishedSlug, $anonSlugs, true), 'immediately-published post present in anonymous listing');

echo "\n== 3. Duplicate slug rejection ==\n";

$dupResp = $super->post('/api/blog/create.php', [
    'title' => 'Duplicate Slug Attempt',
    'slug' => $publishedSlug,
    'content' => '<p>Should be rejected.</p>',
    'status' => 'draft',
]);
report($dupResp['status'] === 409, 'duplicate slug -> 409', (string) $dupResp['status']);

echo "\n== 4. Fetch for edit ==\n";

$fetchResp = $super->get('/api/blog/show.php?id=' . $draftPost['id']);
report($fetchResp['status'] === 200, 'GET show.php?id= -> 200', (string) $fetchResp['status']);
$fetched = $fetchResp['json']['data'] ?? [];
report(($fetched['title'] ?? null) === 'Test Draft Post', 'fetched post has expected title');
$originalCreatedAt = $fetched['created_at'] ?? null;
$originalUpdatedAt = $fetched['updated_at'] ?? null;
report(is_string($originalCreatedAt) && is_string($originalUpdatedAt), 'fetched post has created_at/updated_at');

echo "\n== 5 & 6. Update title/content, verify updated_at changes ==\n";

sleep(1); // ensure a distinguishable second-resolution timestamp

$updateResp = $super->put('/api/blog/update.php?id=' . $draftPost['id'], [
    'title' => 'Test Draft Post (Edited)',
    'content' => '<p>Edited draft content.</p>',
]);
report($updateResp['status'] === 200, 'PUT update.php (title/content) -> 200', (string) $updateResp['status']);
$updated = $updateResp['json']['data'] ?? [];
report(($updated['title'] ?? null) === 'Test Draft Post (Edited)', 'title updated');
report(($updated['content'] ?? null) === '<p>Edited draft content.</p>', 'content updated');
report(($updated['created_at'] ?? null) === $originalCreatedAt, 'created_at unchanged after edit');
report(($updated['updated_at'] ?? null) !== $originalUpdatedAt, 'updated_at changed after a real edit');

$noopResp = $super->get('/api/blog/show.php?id=' . $draftPost['id']);
$beforeNoop = $noopResp['json']['data']['updated_at'] ?? null;
sleep(1);
$noopUpdateResp = $super->put('/api/blog/update.php?id=' . $draftPost['id'], [
    'title' => 'Test Draft Post (Edited)', // identical to current value
]);
$afterNoop = $noopUpdateResp['json']['data']['updated_at'] ?? null;
report($beforeNoop === $afterNoop, 'updated_at NOT bumped when the submitted value is identical (no real change)');

echo "\n== 7. Change tags ==\n";

$tagsResp = $super->put('/api/blog/update.php?id=' . $draftPost['id'], [
    'tags' => ['test', 'retagged'],
]);
report($tagsResp['status'] === 200, 'PUT update.php (tags) -> 200', (string) $tagsResp['status']);
$retagged = $tagsResp['json']['data']['tags'] ?? [];
sort($retagged);
report($retagged === ['retagged', 'test'], 'tag set replaced correctly (old tag dropped, new tag added)');

$stmt = $pdo->prepare('SELECT COUNT(*) FROM blog_post_tags WHERE post_id = :id');
$stmt->execute(['id' => $draftPost['id']]);
$relCount = (int) $stmt->fetchColumn();
report($relCount === 2, 'exactly one relationship row per tag, no duplicates', "found {$relCount}");

echo "\n== 8. Unpublish (and re-publish preserves original publish_date) ==\n";

$originalPublishDate = $publishedPost['publish_date'];

$unpublishResp = $super->put('/api/blog/update.php?id=' . $publishedPost['id'], [
    'status' => 'draft',
]);
report($unpublishResp['status'] === 200, 'PUT update.php (unpublish) -> 200', (string) $unpublishResp['status']);
$unpublished = $unpublishResp['json']['data'] ?? [];
report(($unpublished['draft'] ?? null) === true, 'post is now a draft');
report(($unpublished['publish_date'] ?? null) === $originalPublishDate, 'publish_date preserved (not cleared) on unpublish');

sleep(1);
$republishResp = $super->put('/api/blog/update.php?id=' . $publishedPost['id'], [
    'status' => 'published',
]);
$republished = $republishResp['json']['data'] ?? [];
report(($republished['draft'] ?? null) === false, 'post is published again');
report(($republished['publish_date'] ?? null) === $originalPublishDate, 'publish_date NOT replaced on re-publish (first-publication timestamp preserved)');

echo "\n== 9. Delete ==\n";

$deleteResp = $super->delete('/api/blog/delete.php?id=' . $draftPost['id']);
report($deleteResp['status'] === 200, 'DELETE delete.php -> 200', (string) $deleteResp['status']);
$createdPostIds = array_values(array_filter($createdPostIds, fn ($id) => $id !== $draftPost['id']));

$afterDeleteResp = $super->get('/api/blog/show.php?id=' . $draftPost['id']);
report($afterDeleteResp['status'] === 404, 'deleted post 404s afterward', (string) $afterDeleteResp['status']);

$stmt = $pdo->prepare('SELECT COUNT(*) FROM blog_post_tags WHERE post_id = :id');
$stmt->execute(['id' => $draftPost['id']]);
report((int) $stmt->fetchColumn() === 0, 'blog_post_tags rows removed safely on delete');

echo "\n== 10. Unauthorized / role-based rejection ==\n";

$anonCreateResp = $anon->post('/api/blog/create.php', [
    'title' => 'Should Fail',
    'content' => 'x',
]);
report($anonCreateResp['status'] === 401, 'anonymous create -> 401', (string) $anonCreateResp['status']);

$anonUpdateResp = $anon->put('/api/blog/update.php?id=' . $publishedPost['id'], ['title' => 'Nope']);
report($anonUpdateResp['status'] === 401, 'anonymous update -> 401', (string) $anonUpdateResp['status']);

$anonDeleteResp = $anon->delete('/api/blog/delete.php?id=' . $publishedPost['id']);
report($anonDeleteResp['status'] === 401, 'anonymous delete -> 401', (string) $anonDeleteResp['status']);

// No CSRF header at all (simulate a cross-site POST with cookies only).
$noCsrfClient = new TestClient($baseUrl, 'nocsrf');
$noCsrfClient->bootstrapCsrf();
// Deliberately reuse the super admin's session cookie file contents by logging in normally,
// then issue a request that skips attaching the CSRF header.
$noCsrfClient->login($superAdminEmail, $superAdminPassword);
$noCsrfResp = $noCsrfClient->request('POST', '/api/blog/create.php', ['title' => 'x', 'content' => 'x'], withCsrf: false);
report($noCsrfResp['status'] === 403, 'authenticated request missing CSRF header -> 403', (string) $noCsrfResp['status']);

// Role scoping: editor creates their own post, then super_admin (non-owner-restricted) can still manage it,
// but editor cannot manage a post authored by someone else.
$editorPostResp = $editor->post('/api/blog/create.php', [
    'title' => 'Editor Owned Post',
    'slug' => "test-editor-post-{$suffix}",
    'content' => '<p>Owned by editor.</p>',
    'status' => 'draft',
]);
report($editorPostResp['status'] === 201, 'editor can create their own post', (string) $editorPostResp['status']);
$editorPostId = $editorPostResp['json']['data']['id'] ?? null;
if (is_int($editorPostId)) {
    $createdPostIds[] = $editorPostId;
}

$editorEditsOtherResp = $editor->put('/api/blog/update.php?id=' . $publishedPost['id'], ['title' => 'Hijacked']);
report($editorEditsOtherResp['status'] === 403, "editor cannot update another admin's post -> 403", (string) $editorEditsOtherResp['status']);

$editorDeletesOtherResp = $editor->delete('/api/blog/delete.php?id=' . $publishedPost['id']);
report($editorDeletesOtherResp['status'] === 403, "editor cannot delete another admin's post -> 403", (string) $editorDeletesOtherResp['status']);

$editorEditsOwnResp = $editor->put('/api/blog/update.php?id=' . $editorPostId, ['title' => 'Editor Owned Post (Edited)']);
report($editorEditsOwnResp['status'] === 200, 'editor CAN update their own post', (string) $editorEditsOwnResp['status']);

$editorAssignsAuthorResp = $editor->put('/api/blog/update.php?id=' . $editorPostId, ['author' => $superAdminEmail]);
report($editorAssignsAuthorResp['status'] === 403, 'editor cannot reassign author to someone else', (string) $editorAssignsAuthorResp['status']);

echo "\n== Extra validation checks ==\n";

$missingTitleResp = $super->post('/api/blog/create.php', ['content' => 'x']);
report($missingTitleResp['status'] === 422 && isset($missingTitleResp['json']['error']), 'missing title -> 422 with clear error message');

$badTagsResp = $super->post('/api/blog/create.php', ['title' => 'x', 'content' => 'x', 'tags' => 'not-an-array']);
report($badTagsResp['status'] === 422, 'non-array tags -> 422');

$badCoverResp = $super->post('/api/blog/create.php', ['title' => 'x', 'content' => 'x', 'cover_image' => 'not-a-path']);
report($badCoverResp['status'] === 422, 'cover_image not starting with "/" -> 422');

$badStatusResp = $super->post('/api/blog/create.php', ['title' => 'x', 'content' => 'x', 'status' => 'archived']);
report($badStatusResp['status'] === 422, "status other than draft/published -> 422");

$noSqlLeak = stripos($missingTitleResp['raw'], 'SQLSTATE') === false
    && stripos($badTagsResp['raw'], 'PDOException') === false;
report($noSqlLeak, 'no raw SQL/PDO error text leaked in responses');

echo "\n== Summary ==\n";
echo "Passed: {$passes}, Failed: {$failures}\n";

exit($failures === 0 ? 0 : 1);
