<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers/Database.php';
require_once __DIR__ . '/helpers/Blog.php';

/**
 * Server-rendered Open Graph/Twitter meta shell for a single blog post,
 * served ONLY to known social/search link-preview crawlers (see the
 * User-Agent-gated rewrite rule in public/.htaccess) requesting
 * /blog/{slug}. Real visitors never hit this script — they get the normal
 * SPA `index.html`, and src/utils/useSEO.js keeps managing meta tags
 * client-side for them exactly as before.
 *
 * Why this exists: the site is a client-only React SPA with no SSR
 * (docs/01-CMS-ARCHITECTURE.md §1.6/§9). Crawlers that don't execute
 * JavaScript — which is most social-share link-preview bots — only ever see
 * whatever is already in the raw HTML response, so useSEO's post-hydration
 * <meta> tags are invisible to them. This fills that gap with the smallest
 * possible fix: read the real post from the DB, inject the correct tags
 * into the same built `index.html` shell (kept byte-identical otherwise,
 * including the <script> that boots React), and serve that. A human
 * clicking the resulting Facebook/WhatsApp/etc. preview link still lands on
 * the exact same fully-interactive SPA.
 *
 * Assumes deployment merges backend/'s contents alongside dist/'s output in
 * the same web root (per backend/README — this is how backend/api/*.php
 * already resolves to /api/*.php today), so __DIR__ here is the site root
 * and index.html sits right next to this file.
 */

function blog_meta_shell_html(): ?string
{
    $shellPath = __DIR__ . '/index.html';
    $shell = is_file($shellPath) ? file_get_contents($shellPath) : false;

    return $shell === false ? null : $shell;
}

function blog_meta_send_shell(): never
{
    $shell = blog_meta_shell_html();

    if ($shell === null) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Site shell not found.';
        exit;
    }

    header('Content-Type: text/html; charset=utf-8');
    echo $shell;
    exit;
}

function blog_meta_esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$slug = isset($_GET['slug']) ? trim((string) $_GET['slug']) : '';

if ($slug === '' || !blog_is_valid_slug($slug)) {
    blog_meta_send_shell();
}

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare(blog_select_base() . ' WHERE bp.slug = :slug LIMIT 1');
    $stmt->execute(['slug' => $slug]);
    $row = $stmt->fetch();

    if ($row === false || !blog_is_visible_to_public($row)) {
        // Unknown/draft/scheduled slug: fall back to the plain shell so a
        // crawler sees the same "nothing here yet" state a real visitor
        // would (BlogPost.jsx's not-found view), rather than a 500.
        blog_meta_send_shell();
    }

    blog_backfill_published_at($pdo, $row);
    $post = blog_format_post($row);
} catch (Throwable $e) {
    error_log('[blog-meta] ' . $e->getMessage());
    blog_meta_send_shell();
}

$shell = blog_meta_shell_html();

if ($shell === null) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Site shell not found.';
    exit;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? '';
$origin = $host !== '' ? "{$scheme}://{$host}" : '';
$canonicalUrl = $origin . '/blog/' . rawurlencode($post['slug']);

$siteName = 'Niaz Hussain Abbasi';
$displayTitle = ($post['seo_title'] ?? '') !== '' ? $post['seo_title'] : $post['title'];
$fullTitle = "{$displayTitle} — {$siteName}";
$description = ($post['seo_description'] ?? '') !== '' ? $post['seo_description'] : ($post['excerpt'] ?? '');
$imageUrl = $post['cover_image'] ? $origin . $post['cover_image'] : null;

$metaTags = [];
$metaTags[] = '<meta property="og:site_name" content="' . blog_meta_esc($siteName) . '">';
$metaTags[] = '<meta property="og:type" content="article">';
$metaTags[] = '<meta property="og:title" content="' . blog_meta_esc($fullTitle) . '">';
$metaTags[] = '<meta property="og:url" content="' . blog_meta_esc($canonicalUrl) . '">';
$metaTags[] = '<link rel="canonical" href="' . blog_meta_esc($canonicalUrl) . '">';

if ($description !== '') {
    $metaTags[] = '<meta name="description" content="' . blog_meta_esc($description) . '">';
    $metaTags[] = '<meta property="og:description" content="' . blog_meta_esc($description) . '">';
    $metaTags[] = '<meta name="twitter:description" content="' . blog_meta_esc($description) . '">';
}

$metaTags[] = '<meta name="twitter:card" content="' . ($imageUrl ? 'summary_large_image' : 'summary') . '">';
$metaTags[] = '<meta name="twitter:title" content="' . blog_meta_esc($fullTitle) . '">';

if ($imageUrl) {
    $metaTags[] = '<meta property="og:image" content="' . blog_meta_esc($imageUrl) . '">';
    $metaTags[] = '<meta name="twitter:image" content="' . blog_meta_esc($imageUrl) . '">';
}

if ($post['publish_date']) {
    $publishedAtom = date(DATE_ATOM, strtotime($post['publish_date']));
    $metaTags[] = '<meta property="article:published_time" content="' . blog_meta_esc($publishedAtom) . '">';
}

if (!empty($post['author'])) {
    $metaTags[] = '<meta property="article:author" content="' . blog_meta_esc($post['author']) . '">';
}

$html = preg_replace('/<title>.*?<\/title>/s', '<title>' . blog_meta_esc($fullTitle) . '</title>', $shell, 1);
$html = str_replace('</head>', implode("\n    ", $metaTags) . "\n  </head>", $html ?? $shell);

header('Content-Type: text/html; charset=utf-8');
echo $html;
