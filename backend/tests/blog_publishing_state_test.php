<?php

declare(strict_types=1);

/**
 * Manual, self-contained integration test for the blog post publishing
 * state machine: draft/published/scheduled/featured visibility and the
 * created_at/updated_at/publish_at/published_at date rules documented in
 * docs/BLOG-DATE-AND-PUBLISHING-RULES.md.
 *
 * Complements backend/tests/blog_crud_test.php (which covers CRUD/auth/role
 * scoping broadly) by walking the exact 10 publishing-state cases from that
 * doc end to end, including the one path blog_crud_test.php doesn't reach:
 * a scheduled post whose publish_at arrives with no further edit ever made
 * (blog_backfill_published_at in helpers/Blog.php).
 *
 * Usage:
 *   php -S 127.0.0.1:8987 -t backend &
 *   php backend/tests/blog_publishing_state_test.php
 *   (BASE_URL env var overrides the default http://127.0.0.1:8987)
 *
 * Exits 0 if every assertion passed, 1 otherwise. Cleans up every blog post
 * and test category it creates.
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

final class PublishTestClient
{
    private string $baseUrl;
    /** @var array<string,string> */
    private array $cookies = [];
    private ?string $csrfToken = null;

    public function __construct(string $baseUrl)
    {
        $this->baseUrl = $baseUrl;
    }

    /** @return array{status:int, json: array|null, raw: string} */
    public function request(string $method, string $path, ?array $body = null): array
    {
        $headers = ['Content-Type: application/json'];
        if ($this->csrfToken !== null) {
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
$createdCategoryIds = [];
register_shutdown_function(function () use (&$createdPostIds, &$createdCategoryIds, $pdo): void {
    // Posts first: categories can't be deleted (FK ON DELETE RESTRICT) while
    // any post still references them.
    foreach ($createdPostIds as $id) {
        $pdo->prepare('DELETE FROM blog_posts WHERE id = :id')->execute(['id' => $id]);
    }
    foreach ($createdCategoryIds as $id) {
        $pdo->prepare('DELETE FROM categories WHERE id = :id')->execute(['id' => $id]);
    }
});

$admin = new PublishTestClient($baseUrl);
$admin->bootstrapCsrf();
$loginResp = $admin->login($superAdminEmail, $superAdminPassword);
report($loginResp['status'] === 200, 'admin login', (string) $loginResp['status']);
if ($loginResp['status'] !== 200) {
    fwrite(STDERR, "Cannot continue without a working admin login.\n");
    exit(1);
}

$anon = new PublishTestClient($baseUrl);
$anon->bootstrapCsrf();

$suffix = bin2hex(random_bytes(4));

// Every blog post now requires a real category_id (see migration
// 004_categories_cleanup).
$categoryResp = $admin->post('/api/categories/create.php', ['name' => "Publish State Test {$suffix}"]);
report($categoryResp['status'] === 201, 'create test category', (string) $categoryResp['status']);
$testCategoryId = $categoryResp['json']['data']['id'] ?? null;
if (is_int($testCategoryId)) {
    $createdCategoryIds[] = $testCategoryId;
}

echo "\n== 0. Timezone sanity ==\n";
$tzRow = $pdo->query('SELECT @@session.time_zone AS tz')->fetch();
report(date_default_timezone_get() !== '', 'PHP has an explicit default timezone set', date_default_timezone_get());
report($tzRow['tz'] !== 'SYSTEM', 'MySQL session time_zone is an explicit offset, not SYSTEM', (string) $tzRow['tz']);
$phpNow = new DateTime();
$mysqlNow = new DateTime($pdo->query('SELECT NOW() AS n')->fetch()['n']);
report(abs($phpNow->getTimestamp() - $mysqlNow->getTimestamp()) <= 2, 'PHP and MySQL agree on wall-clock time (within 2s)');

echo "\n== 1. Draft post ==\n";
$draftSlug = "pub-test-draft-{$suffix}";
$r = $admin->post('/api/blog/create.php', [
    'title' => 'Publish State Draft',
    'slug' => $draftSlug,
    'content' => '<p>draft</p>',
    'category_id' => $testCategoryId,
    'status' => 'draft',
]);
report($r['status'] === 201, 'draft post created', (string) $r['status']);
$draft = $r['json']['data'] ?? [];
if (isset($draft['id'])) $createdPostIds[] = $draft['id'];
$createdAt = $draft['created_at'] ?? null;

$adminShow = $admin->get('/api/blog/show.php?id=' . $draft['id']);
report($adminShow['status'] === 200, 'draft visible to admin');

$anonShow = $anon->get('/api/blog/show.php?id=' . $draft['id']);
report($anonShow['status'] === 404, 'draft NOT visible to public (id lookup 404s)', (string) $anonShow['status']);
$anonShowBySlug = $anon->get('/api/blog/show.php?slug=' . $draftSlug);
report($anonShowBySlug['status'] === 404, 'draft slug request 404s for public callers', (string) $anonShowBySlug['status']);

echo "\n== 2. Publish immediately ==\n";
$publishResp = $admin->put('/api/blog/update.php?id=' . $draft['id'], ['status' => 'published']);
report($publishResp['status'] === 200, 'publish -> 200');
$published = $publishResp['json']['data'] ?? [];
report($published['draft'] === false, 'now published');
report(is_string($published['publish_date']), 'published_at set on first publish');
$firstPublishedAt = $published['publish_date'];

$anonShowNow = $anon->get('/api/blog/show.php?id=' . $draft['id']);
report($anonShowNow['status'] === 200, 'published post now visible to public');

echo "\n== 3 & 4 & 5. Edit published post: updated_at changes, created_at doesn't ==\n";
sleep(1);
$editResp = $admin->put('/api/blog/update.php?id=' . $draft['id'], ['title' => 'Publish State Draft (edited)']);
$edited = $editResp['json']['data'] ?? [];
report($edited['created_at'] === $createdAt, 'created_at unchanged after edit');
report($edited['updated_at'] !== $draft['updated_at'], 'updated_at changed after edit');
report($edited['publish_date'] === $firstPublishedAt, 'published_at retained on normal edit');

echo "\n== 6 & 7. Schedule future post, confirm absent from public API ==\n";
$futureSlug = "pub-test-future-{$suffix}";
$future = date('Y-m-d H:i:s', strtotime('+1 hour'));
$r = $admin->post('/api/blog/create.php', [
    'title' => 'Publish State Future',
    'slug' => $futureSlug,
    'content' => '<p>future</p>',
    'category_id' => $testCategoryId,
    'status' => 'published',
    'publish_at' => $future,
]);
report($r['status'] === 201, 'scheduled post saved successfully', (string) $r['status']);
$scheduled = $r['json']['data'] ?? [];
if (isset($scheduled['id'])) $createdPostIds[] = $scheduled['id'];
report($scheduled['publish_at'] === $future, 'scheduled post stores the publish_at target');
report($scheduled['publish_date'] === null, 'scheduled post has no published_at yet');

$adminShowFuture = $admin->get('/api/blog/show.php?id=' . $scheduled['id']);
report($adminShowFuture['status'] === 200, 'scheduled post visible in admin');

$anonShowFuture = $anon->get('/api/blog/show.php?id=' . $scheduled['id']);
report($anonShowFuture['status'] === 404, 'scheduled post hidden from public (404)', (string) $anonShowFuture['status']);

$anonIndex = $anon->get('/api/blog/index.php?per_page=100');
$anonSlugs = array_column($anonIndex['json']['data'] ?? [], 'slug');
report(!in_array($futureSlug, $anonSlugs, true), 'scheduled post absent from public listing/API');

echo "\n== Future post becomes available automatically when its time arrives (no rebuild, no edit) ==\n";
// Simulate time passing by moving publish_at into the past directly in the
// DB -- exactly what "the scheduled time arrives" looks like from the
// server's perspective. Deliberately does NOT call update.php: this proves
// visibility and the published_at backfill both happen on ordinary reads,
// with no admin action and no rebuild/redeploy.
$past = date('Y-m-d H:i:s', strtotime('-1 minute'));
$pdo->prepare('UPDATE blog_posts SET publish_at = :p WHERE id = :id')->execute(['p' => $past, 'id' => $scheduled['id']]);

$anonShowArrived = $anon->get('/api/blog/show.php?id=' . $scheduled['id']);
report($anonShowArrived['status'] === 200, 'post becomes publicly visible once publish_at passes, with no edit made');

$anonIndexArrived = $anon->get('/api/blog/index.php?per_page=100');
$anonSlugsArrived = array_column($anonIndexArrived['json']['data'] ?? [], 'slug');
report(in_array($futureSlug, $anonSlugsArrived, true), 'post now present in public listing once its time arrives');

$row = $pdo->prepare('SELECT published_at FROM blog_posts WHERE id = :id');
$row->execute(['id' => $scheduled['id']]);
$backfilled = $row->fetch()['published_at'] ?? null;
report($backfilled === $past, 'published_at was lazily backfilled to the arrived publish_at, with no explicit edit', (string) $backfilled);

$updatedAtRow = $pdo->prepare('SELECT created_at, updated_at FROM blog_posts WHERE id = :id');
$updatedAtRow->execute(['id' => $scheduled['id']]);
$datesAfterBackfill = $updatedAtRow->fetch();
report(
    $datesAfterBackfill['updated_at'] === $scheduled['updated_at'],
    'updated_at NOT bumped by the system published_at backfill (not an edit)',
    "before={$scheduled['updated_at']} after={$datesAfterBackfill['updated_at']}"
);

echo "\n== 8 & 9. Unpublish, then republish (documented rule: publish_date is not replaced) ==\n";
$unpublishResp = $admin->put('/api/blog/update.php?id=' . $draft['id'], ['status' => 'draft']);
$unpublished = $unpublishResp['json']['data'] ?? [];
report($unpublished['draft'] === true, 'unpublish -> draft again');

$anonAfterUnpublish = $anon->get('/api/blog/show.php?id=' . $draft['id']);
report($anonAfterUnpublish['status'] === 404, 'unpublished post hidden from public again');

sleep(1);
$republishResp = $admin->put('/api/blog/update.php?id=' . $draft['id'], ['status' => 'published']);
$republished = $republishResp['json']['data'] ?? [];
report($republished['draft'] === false, 'republish -> published again');
report($republished['publish_date'] === $firstPublishedAt, 'republish does not replace the original published_at (documented rule)');

$anonAfterRepublish = $anon->get('/api/blog/show.php?id=' . $draft['id']);
report($anonAfterRepublish['status'] === 200, 'republished post visible to public again');

echo "\n== 10. Feature and unfeature ==\n";
$featureResp = $admin->put('/api/blog/update.php?id=' . $draft['id'], ['featured' => true]);
report(($featureResp['json']['data']['featured'] ?? null) === true, 'post can be featured');

$anonFeaturedList = $anon->get('/api/blog/index.php?featured=1&per_page=100');
$featuredSlugs = array_column($anonFeaturedList['json']['data'] ?? [], 'slug');
report(in_array($draftSlug, $featuredSlugs, true), 'featured + published + currently-available post appears in public featured results');

// A featured but unpublished post must NOT appear publicly.
$hideResp = $admin->put('/api/blog/update.php?id=' . $draft['id'], ['status' => 'draft']);
report(($hideResp['json']['data']['featured'] ?? null) === true, 'still featured after unpublishing');
$anonFeaturedAfterUnpublish = $anon->get('/api/blog/index.php?featured=1&per_page=100');
$featuredSlugsAfter = array_column($anonFeaturedAfterUnpublish['json']['data'] ?? [], 'slug');
report(!in_array($draftSlug, $featuredSlugsAfter, true), 'a featured-but-unpublished post does NOT appear in public featured results');

$unfeatureResp = $admin->put('/api/blog/update.php?id=' . $draft['id'], ['status' => 'published', 'featured' => false]);
report(($unfeatureResp['json']['data']['featured'] ?? null) === false, 'post can be unfeatured');

echo "\n== Summary ==\n";
echo "Passed: {$passes}, Failed: {$failures}\n";

exit($failures === 0 ? 0 : 1);
