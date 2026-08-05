<?php

declare(strict_types=1);

/**
 * Manual, self-contained unit test for backend/helpers/HtmlSanitizer.php
 * (see docs/BLOG-HTML-SANITIZATION.md). Unlike the other files in this
 * directory, this needs no database and no running PHP server —
 * blog_sanitize_html() is a pure function, so this just calls it directly
 * and asserts on its output.
 *
 * Usage:
 *   php backend/tests/html_sanitizer_test.php
 *
 * Exits 0 if every assertion passed, 1 otherwise.
 */

require_once __DIR__ . '/../helpers/HtmlSanitizer.php';

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

/** Asserts blog_sanitize_html($input) === $expected exactly. */
function assertSanitizesTo(string $label, string $input, string $expected): void
{
    $actual = blog_sanitize_html($input);
    report($actual === $expected, $label, "expected [{$expected}] got [{$actual}]");
}

/** Asserts the sanitized output does NOT contain any of $forbidden (case-insensitive substrings). */
function assertStrips(string $label, string $input, array $forbidden): void
{
    $actual = blog_sanitize_html($input);
    $found = null;
    foreach ($forbidden as $needle) {
        if (stripos($actual, $needle) !== false) {
            $found = $needle;
            break;
        }
    }
    report($found === null, $label, $found !== null ? "found [{$found}] in [{$actual}]" : '');
}

/** Asserts the sanitized output DOES contain every string in $expected. */
function assertContainsAll(string $label, string $input, array $expected): void
{
    $actual = blog_sanitize_html($input);
    $missing = null;
    foreach ($expected as $needle) {
        if (stripos($actual, $needle) === false) {
            $missing = $needle;
            break;
        }
    }
    report($missing === null, $label, $missing !== null ? "missing [{$missing}] in [{$actual}]" : '');
}

echo "\n== Required malicious payloads ==\n";

assertStrips(
    'script tag is removed with its contents',
    '<p>before</p><script>alert(document.cookie)</script><p>after</p>',
    ['<script', 'alert(document.cookie)']
);
assertSanitizesTo(
    'script tag: surrounding safe content survives',
    '<p>before</p><script>alert(document.cookie)</script><p>after</p>',
    '<p>before</p><p>after</p>'
);

assertStrips(
    'img onerror handler is stripped, image kept',
    '<img src="/uploads/blog/content/x.png" onerror="alert(1)" alt="pic">',
    ['onerror', 'alert(1)']
);
assertContainsAll(
    'img onerror: src/alt survive',
    '<img src="/uploads/blog/content/x.png" onerror="alert(1)" alt="pic">',
    ['src="/uploads/blog/content/x.png"', 'alt="pic"']
);

assertStrips(
    'javascript: link has its href removed (not just re-encoded)',
    '<a href="javascript:alert(1)">click me</a>',
    ['javascript:', 'href']
);
assertContainsAll(
    'javascript: link: anchor is unwrapped, text survives',
    '<a href="javascript:alert(1)">click me</a>',
    ['click me']
);

assertStrips(
    'malicious SVG (script + event handler) removed wholesale',
    '<svg onload="alert(1)"><script>alert(2)</script><image href="x" onerror="alert(3)"/></svg><p>text</p>',
    ['<svg', 'onload', 'onerror', 'alert']
);
assertSanitizesTo(
    'malicious SVG: sibling safe content survives',
    '<svg onload="alert(1)"><script>alert(2)</script></svg><p>text</p>',
    '<p>text</p>'
);

assertStrips(
    'iframe is removed with its contents',
    '<iframe src="https://evil.example/phish"></iframe><p>after</p>',
    ['<iframe', 'evil.example']
);
assertSanitizesTo(
    'iframe: sibling safe content survives',
    '<iframe src="https://evil.example"></iframe><p>after</p>',
    '<p>after</p>'
);

assertSanitizesTo(
    'malformed nested HTML: parser-corrected structure, no data loss',
    '<p>Hello <strong>bold <em>and italic</p></strong></em><div>trailing',
    '<p>Hello <strong>bold <em>and italic</em></strong></p><div>trailing</div>'
);

assertSanitizesTo(
    'safe table round-trips unchanged (well-formed input)',
    '<table><tbody><tr><th>H1</th><th>H2</th></tr><tr><td colspan="2">D1</td></tr></tbody></table>',
    '<table><tbody><tr><th>H1</th><th>H2</th></tr><tr><td colspan="2">D1</td></tr></tbody></table>'
);

assertSanitizesTo(
    'safe image round-trips unchanged (well-formed input)',
    '<img src="/uploads/blog/content/x.png" alt="desc" title="t" width="200" height="100">',
    '<img src="/uploads/blog/content/x.png" alt="desc" title="t" width="200" height="100">'
);

assertContainsAll(
    'safe https link keeps href/text, gets tabnabbing-safe rel added',
    '<a href="https://example.com/page" target="_blank" rel="nofollow">go</a>',
    ['href="https://example.com/page"', 'target="_blank"', 'nofollow', 'noopener', 'noreferrer', '>go<']
);

assertSanitizesTo(
    'safe text-align styling round-trips, normalized',
    '<p style="text-align: center">centered</p><h2 style="text-align:right">right heading</h2>',
    '<p style="text-align: center">centered</p><h2 style="text-align: right">right heading</h2>'
);

echo "\n== Additional hardening cases ==\n";

assertSanitizesTo('data: URI images are rejected (img dropped, no bare src)', '<img src="data:text/html;base64,PHNjcmlwdD4=">', '');
assertSanitizesTo('data: image URIs are rejected too (uploads-only policy)', '<img src="data:image/png;base64,iVBORw0KGgo=">', '');

assertStrips(
    'unsafe CSS in style is rejected wholesale, not partially cleaned',
    '<p style="background: url(javascript:alert(1)); text-align: center">x</p>',
    ['style=', 'javascript:', 'url(']
);

assertStrips('every on* handler is stripped regardless of tag', '<p onclick="alert(1)" onmouseover="alert(2)">hover</p>', ['onclick', 'onmouseover']);

assertSanitizesTo('object/embed/form/input removed wholesale', '<object data="evil.swf"></object><embed src="evil.swf"><form action="x"><input type="text"></form>', '');
assertSanitizesTo('button removed wholesale', '<button onclick="alert(1)">click</button>', '');

assertContainsAll('mailto/tel schemes are allowed on links', '<a href="mailto:a@b.com">mail</a> <a href="tel:+1234567">tel</a>', ['mailto:a@b.com', 'tel:+1234567']);

assertSanitizesTo('class attribute keeps only safe tokens', '<div class="valid-class \'; alert(1); //">x</div>', '<div class="valid-class">x</div>');

assertSanitizesTo('unknown/unsafe wrapper tags are unwrapped, not dropped', '<marquee><blink><p>content</p></blink></marquee>', '<p>content</p>');

assertContainsAll('target=_blank always gets noopener+noreferrer even with no input rel', '<a href="https://x.com" target="_blank">x</a>', ['noopener', 'noreferrer']);

report(blog_sanitize_html('') === '', 'empty input sanitizes to empty string');
report(blog_sanitize_html('   ') === '', 'whitespace-only input sanitizes to empty string');

assertStrips('HTML-entity-encoded javascript: scheme is still caught', '<a href="java&#0058;script:alert(1)">x</a>', ['javascript:', 'href']);
assertStrips('embedded control character cannot smuggle a scheme past validation', "<a href=\"java\tscript:alert(1)\">x</a>", ['javascript:', 'href']);

assertSanitizesTo('&amp; is preserved, not double-escaped', '<p>Ben &amp; Jerry</p>', '<p>Ben &amp; Jerry</p>');
assertSanitizesTo('literal & becomes &amp; (single-pass escaping, no double-encoding)', '<p>Ben & Jerry</p>', '<p>Ben &amp; Jerry</p>');

assertSanitizesTo('u and s marks survive', '<p><u>underline</u> and <s>strike</s></p>', '<p><u>underline</u> and <s>strike</s></p>');
assertSanitizesTo('code/pre survive', '<pre><code>const x = 1;</code></pre>', '<pre><code>const x = 1;</code></pre>');

echo "\n== Summary ==\n";
echo "Passed: {$passes}, Failed: {$failures}\n";

exit($failures === 0 ? 0 : 1);
