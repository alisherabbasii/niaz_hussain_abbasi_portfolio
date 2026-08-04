<?php

declare(strict_types=1);

/**
 * Manual, self-contained integration test for backend/api/blog/related.php.
 *
 * There is no PHPUnit/Pest in this repo (no composer.json), so this is a
 * plain CLI script that drives the real HTTP endpoint with a stream-wrapper
 * HTTP client, same shape as blog_crud_test.php.
 *
 * Usage:
 *   php -S 127.0.0.1:8987 -t backend &
 *   php backend/tests/blog_related_test.php
 *   (BASE_URL env var overrides the default http://127.0.0.1:8987)
 *
 * Exits 0 if every assertion passed, 1 otherwise. Cleans up every blog post
 * (and their category/tag rows) it creates.
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

/** Same stream-wrapper HTTP client as blog_crud_test.php. */
final class TestClient
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

    public function login(string $email, string $password): array
    {
        return $this->post('/api/auth/login.php', ['email' => $email, 'password' => $password]);
    }
}

$superAdminEmail = env_get('INSTALL_ADMIN_EMAIL', required: true);
$superAdminPassword = env_get('INSTALL_ADMIN_PASSWORD', required: true);

$pdo = Database::getConnection();

$createdPostIds = [];

register_shutdown_function(function () use (&$createdPostIds, $pdo): void {
    foreach ($createdPostIds as $id) {
        $pdo->prepare('DELETE FROM blog_posts WHERE id = :id')->execute(['id' => $id]);
    }
});

echo "== Setup ==\n";

$super = new TestClient($baseUrl);
$super->get('/api/auth/me.php'); // seed CSRF cookie
$loginResp = $super->login($superAdminEmail, $superAdminPassword);
report($loginResp['status'] === 200, 'super_admin login', (string) $loginResp['status']);
if ($loginResp['status'] !== 200) {
    fwrite(STDERR, "Cannot continue without a working super_admin login. Response: {$loginResp['raw']}\n");
    exit(1);
}

$anon = new TestClient($baseUrl);
$anon->get('/api/auth/me.php');

$suffix = bin2hex(random_bytes(4));

/** Create a post and return its decoded response data, failing loudly on a non-201. */
function createPost(TestClient $client, array &$createdPostIds, array $overrides): array
{
    $resp = $client->post('/api/blog/create.php', $overrides);
    if ($resp['status'] !== 201) {
        fwrite(STDERR, "Failed to create fixture post: {$resp['raw']}\n");
        exit(1);
    }
    $data = $resp['json']['data'];
    $createdPostIds[] = $data['id'];
    return $data;
}

// Publication order (oldest -> newest):
//   oldest -> A (Leadership, tags: grit)
//             B (Community,  tags: grit, faith)   <- shares tag with A
//             C (Leadership, tags: none)           <- shares category with A/B's category set
//             D (Solo,       tags: none)           <- shares nothing with anyone (isolated)
//   newest -> E (Community,  tags: faith)          <- shares tag with B
//
// D is the "no relationships" case: distinct category, no tags, and no
// other post shares its category, so related must come back empty for it.
//
// Each fixture gets an explicit, far-past `publish_at` (rather than relying
// on wall-clock "now") so ordering is deterministic and A is unambiguously
// the oldest public post *in the whole table*, not just among the fixtures
// — this repo's dev database already has unrelated posts in it, so "first
// post has no previous" only holds if A is actually older than everything
// else, real data included.
$basePublishAt = strtotime('2000-01-01 00:00:00');
function fixtureTimestamp(int $base, int $offsetSeconds): string
{
    return date('Y-m-d H:i:s', $base + $offsetSeconds);
}

$categoryLeadership = "Related Test Leadership {$suffix}";
$categoryCommunity = "Related Test Community {$suffix}";
$categorySolo = "Related Test Solo {$suffix}";

echo "\n== Fixtures ==\n";

$postA = createPost($super, $createdPostIds, [
    'title' => "Related Test A {$suffix}",
    'slug' => "related-test-a-{$suffix}",
    'content' => '<p>A</p>',
    'status' => 'published',
    'publish_at' => fixtureTimestamp($basePublishAt, 0),
    'category' => $categoryLeadership,
    'tags' => ['grit'],
]);

$postB = createPost($super, $createdPostIds, [
    'title' => "Related Test B {$suffix}",
    'slug' => "related-test-b-{$suffix}",
    'content' => '<p>B</p>',
    'status' => 'published',
    'publish_at' => fixtureTimestamp($basePublishAt, 10),
    'category' => $categoryCommunity,
    'tags' => ['grit', 'faith'],
]);

$postC = createPost($super, $createdPostIds, [
    'title' => "Related Test C {$suffix}",
    'slug' => "related-test-c-{$suffix}",
    'content' => '<p>C</p>',
    'status' => 'published',
    'publish_at' => fixtureTimestamp($basePublishAt, 20),
    'category' => $categoryLeadership,
    'tags' => [],
]);

$postD = createPost($super, $createdPostIds, [
    'title' => "Related Test D {$suffix}",
    'slug' => "related-test-d-{$suffix}",
    'content' => '<p>D</p>',
    'status' => 'published',
    'publish_at' => fixtureTimestamp($basePublishAt, 30),
    'category' => $categorySolo,
    'tags' => [],
]);

$postE = createPost($super, $createdPostIds, [
    'title' => "Related Test E {$suffix}",
    'slug' => "related-test-e-{$suffix}",
    'content' => '<p>E</p>',
    'status' => 'published',
    'publish_at' => fixtureTimestamp($basePublishAt, 40),
    'category' => $categoryCommunity,
    'tags' => ['faith'],
]);

$draftPost = createPost($super, $createdPostIds, [
    'title' => "Related Test Draft {$suffix}",
    'slug' => "related-test-draft-{$suffix}",
    'content' => '<p>Draft</p>',
    'status' => 'draft',
    'category' => $categoryLeadership,
    'tags' => ['grit'],
]);

$futureDate = date('Y-m-d H:i:s', strtotime('+1 year'));
$futurePost = createPost($super, $createdPostIds, [
    'title' => "Related Test Future {$suffix}",
    'slug' => "related-test-future-{$suffix}",
    'content' => '<p>Future</p>',
    'status' => 'published',
    'publish_at' => $futureDate,
    'category' => $categoryLeadership,
    'tags' => ['grit'],
]);

// A deliberately unrelated post published at "now" (no explicit publish_at
// override), created last so it's virtually guaranteed to be the
// most-recently-published *visible* post in the whole table at the moment
// this test runs — visibility requires publish_at <= NOW(), so nothing can
// legitimately be newer. Used only to test "the last post has no next";
// A/B/C/D/E are deliberately clustered in the distant past (year 2000) so
// they stay ordered relative to *each other* regardless of whatever
// unrelated real posts already exist in this dev database, which rules
// them out as the "last post" case.
$lastPost = createPost($super, $createdPostIds, [
    'title' => "Related Test Last {$suffix}",
    'slug' => "related-test-last-{$suffix}",
    'content' => '<p>Last</p>',
    'status' => 'published',
    'category' => "Related Test Lonely {$suffix}",
    'tags' => [],
]);

echo "\n== Same category ==\n";

$relA = $anon->get('/api/blog/related.php?id=' . $postA['id']);
report($relA['status'] === 200, 'GET related.php?id=A -> 200', (string) $relA['status']);
$relASlugs = array_column($relA['json']['data']['related'] ?? [], 'slug');
report(in_array($postC['slug'], $relASlugs, true), 'A relates to C via shared category (Leadership)');
report(in_array($postB['slug'], $relASlugs, true), 'A relates to B via shared tag (grit)');
report(!in_array($postA['slug'], $relASlugs, true), 'related list excludes the source post itself');
report(!in_array($draftPost['slug'], $relASlugs, true), 'related list excludes a draft even though it matches category+tag');
report(!in_array($futurePost['slug'], $relASlugs, true), 'related list excludes a future-scheduled post even though it matches category+tag');

$relAIds = array_column($relA['json']['data']['related'] ?? [], 'id');
report(count($relAIds) === count(array_unique($relAIds)), 'related list has no duplicate posts');
report(count($relAIds) <= 3, 'related list respects the small fixed limit (<= 3)', (string) count($relAIds));

// C matches A purely by category (no tags); confirm the category-match path
// independently of B's tag overlap.
$categoryMatchOnly = null;
foreach ($relA['json']['data']['related'] ?? [] as $candidate) {
    if ($candidate['slug'] === $postC['slug']) {
        $categoryMatchOnly = $candidate;
    }
}
report($categoryMatchOnly !== null, 'category-only match (C, no shared tags with A) is present in A\'s related list');

echo "\n== Shared tags ==\n";

$relB = $anon->get('/api/blog/related.php?id=' . $postB['id']);
$relBSlugs = array_column($relB['json']['data']['related'] ?? [], 'slug');
report(in_array($postA['slug'], $relBSlugs, true), 'B relates to A via shared tag (grit)');
report(in_array($postE['slug'], $relBSlugs, true), 'B relates to E via shared tag (faith) and shared category (Community)');
report(!in_array($postC['slug'], $relBSlugs, true), 'B does not relate to C (different category, no shared tags)');

echo "\n== No relationships ==\n";

$relD = $anon->get('/api/blog/related.php?id=' . $postD['id']);
report($relD['status'] === 200, 'GET related.php?id=D -> 200', (string) $relD['status']);
report(($relD['json']['data']['related'] ?? null) === [], 'post with no shared category/tags gets a graceful empty related list, not unrelated filler');

echo "\n== Previous / next: first and last post ==\n";

$relA = $anon->get('/api/blog/related.php?id=' . $postA['id']); // A is year-2000, older than every other post in the table
// Note: array_key_exists (not ??) — `??` treats a legitimately-null value
// the same as a missing key, which would make this assertion pass for the
// wrong reason (or mask a missing `previous` key entirely).
report(
    array_key_exists('previous', $relA['json']['data'] ?? []) && $relA['json']['data']['previous'] === null,
    'the very first post has no "previous" (cleanly null)'
);
report(($relA['json']['data']['next']['slug'] ?? null) === $postB['slug'], 'first post\'s "next" is the next-newer post (B)');

$relLast = $anon->get('/api/blog/related.php?id=' . $lastPost['id']); // published at "now", so nothing can legitimately be newer
report(
    array_key_exists('next', $relLast['json']['data'] ?? []) && $relLast['json']['data']['next'] === null,
    'the most recently published post has no "next" (cleanly null)'
);

echo "\n== Previous / next: draft and future-post exclusion ==\n";

$relD = $anon->get('/api/blog/related.php?id=' . $postD['id']);
report(
    ($relD['json']['data']['previous']['slug'] ?? null) === $postC['slug'],
    'D\'s "previous" skips over nothing unexpected and lands on C (the nearest older PUBLIC post)'
);
report(
    ($relD['json']['data']['next']['slug'] ?? null) === $postE['slug'],
    'D\'s "next" is E, not the draft or the future-scheduled post that were created around the same time'
);

$relDSlugsAll = array_merge(
    [$relD['json']['data']['previous']['slug'] ?? null, $relD['json']['data']['next']['slug'] ?? null]
);
report(!in_array($draftPost['slug'], $relDSlugsAll, true), 'draft post never appears as a previous/next neighbor');
report(!in_array($futurePost['slug'], $relDSlugsAll, true), 'future-scheduled post never appears as a previous/next neighbor');

echo "\n== Draft/future as the current article (admin preview) ==\n";

$adminShowDraft = $super->get('/api/blog/related.php?id=' . $draftPost['id']);
report($adminShowDraft['status'] === 200, 'admin can fetch related/adjacent context for their own draft', (string) $adminShowDraft['status']);

$anonShowDraft = $anon->get('/api/blog/related.php?id=' . $draftPost['id']);
report($anonShowDraft['status'] === 404, 'anonymous caller cannot fetch related/adjacent context for a draft (404)', (string) $anonShowDraft['status']);

echo "\n== Input validation ==\n";

$missingParam = $anon->get('/api/blog/related.php');
report($missingParam['status'] === 422, 'missing id/slug -> 422', (string) $missingParam['status']);

$notFound = $anon->get('/api/blog/related.php?slug=does-not-exist-' . $suffix);
report($notFound['status'] === 404, 'unknown slug -> 404', (string) $notFound['status']);

echo "\n== Summary ==\n";
echo "Passed: {$passes}, Failed: {$failures}\n";

exit($failures === 0 ? 0 : 1);
