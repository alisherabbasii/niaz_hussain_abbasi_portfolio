<?php

declare(strict_types=1);

/**
 * Server-side allow-list HTML sanitizer for TipTap-authored blog post
 * content. See docs/BLOG-HTML-SANITIZATION.md for the full contract.
 *
 * This is the single authoritative sanitization point: backend/api/blog/
 * create.php and update.php run every incoming `content` value through
 * blog_sanitize_html() before it reaches the database. Nothing downstream
 * (show.php, index.php, the public frontend) needs to sanitize again to be
 * safe — and re-running an HTML sanitizer on already-sanitized HTML is a
 * no-op here (it parses HTML and re-serializes HTML, it never escapes
 * entities beyond what's structurally required), so doing so anyway
 * wouldn't double-escape stored content.
 *
 * Requires ext-dom (bundled with the vast majority of PHP installs; on
 * Debian/Ubuntu-family hosts it's the separate `php-xml` package).
 *
 * Approach: parse with DOMDocument, then walk the tree and for every
 * element node either:
 *   - keep it, after stripping every attribute not on that tag's
 *     allow-list and validating the survivors (URL schemes, a strict
 *     text-align-only `style` grammar, numeric bounds, enums), or
 *   - drop it together with its entire subtree, for tags whose content
 *     itself is inherently unsafe (script, style, iframe, svg, ...), or
 *   - "unwrap" it — keep its (sanitized) children in its place but
 *     discard the tag — for anything else not on the allow-list, so text
 *     and valid nested formatting inside an unrecognized wrapper (or
 *     malformed/crossed tags the HTML parser had to reshuffle) survives
 *     instead of vanishing along with the tag.
 */

if (!extension_loaded('dom')) {
    throw new RuntimeException(
        'blog_sanitize_html() requires the PHP DOM extension (ext-dom / php-xml), which is not loaded.'
    );
}

/** Tags TipTap can produce, plus a few kept for hand-authored/pasted HTML compatibility (code, pre, s, div, span). */
const BLOG_HTML_ALLOWED_TAGS = [
    'p', 'h2', 'h3', 'h4',
    'strong', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote',
    'a',
    'hr', 'br',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img',
    'code', 'pre',
    'div', 'span',
];

/** Void elements: never recurse into their children (they can't have any meaningful ones). */
const BLOG_HTML_VOID_TAGS = ['br', 'hr', 'img'];

/**
 * Tags whose entire subtree — including any text content — is dropped
 * outright rather than unwrapped. Covers active-content elements (script,
 * style, svg/math which can carry their own event handlers and embedded
 * script-like content), embeds/frames, interactive form controls, and
 * document-metadata tags that have no business appearing in a content
 * fragment at all.
 */
const BLOG_HTML_REMOVE_WITH_CONTENTS = [
    'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'svg', 'math', 'template', 'noscript', 'link', 'meta', 'base',
    'title', 'head', 'html', 'body',
    'select', 'option', 'optgroup', 'textarea', 'applet',
    'audio', 'video', 'source', 'track', 'canvas',
];

/** Per-tag allow-listed attribute names. Any attribute not listed here is dropped for that tag, including every `on*` handler. */
const BLOG_HTML_ALLOWED_ATTRS = [
    'a' => ['href', 'target', 'rel', 'title'],
    'img' => ['src', 'alt', 'title', 'width', 'height'],
    'th' => ['colspan', 'rowspan'],
    'td' => ['colspan', 'rowspan'],
    'p' => ['style', 'class'],
    'h2' => ['style', 'class'],
    'h3' => ['style', 'class'],
    'h4' => ['style', 'class'],
    'div' => ['style', 'class'],
    'span' => ['style', 'class'],
];

const BLOG_HTML_ALLOWED_URL_SCHEMES_HREF = ['http', 'https', 'mailto', 'tel'];
const BLOG_HTML_ALLOWED_URL_SCHEMES_SRC = ['http', 'https'];
const BLOG_HTML_ALLOWED_TARGETS = ['_blank', '_self'];
const BLOG_HTML_ALLOWED_REL_TOKENS = ['noopener', 'noreferrer', 'nofollow', 'ugc', 'sponsor', 'external'];

/**
 * Sanitize a TipTap-authored HTML fragment down to the allow-listed tag/
 * attribute set above. Returns '' for empty/whitespace-only input or input
 * that contains no permitted content at all.
 */
function blog_sanitize_html(string $html): string
{
    $trimmed = trim($html);
    if ($trimmed === '') {
        return '';
    }

    $dom = new DOMDocument();
    $priorSetting = libxml_use_internal_errors(true);

    // The leading XML encoding processing instruction prepended below is
    // how a fragment's UTF-8 bytes survive DOMDocument::loadHTML() without
    // it guessing (and mangling) the encoding — it's stripped back out
    // below by only serializing $dom->documentElement's *children*, never
    // the PI or the wrapper <div> itself. NOIMPLIED/NODEFDTD stop libxml
    // from adding an implied <html><body> and doctype around the fragment,
    // so the wrapper <div> ends up as $dom->documentElement directly.
    // (Note: this comment deliberately doesn't spell out the PI's literal
    // text — a one-line PHP comment containing the PHP closing-tag
    // sequence closes the tag early and truncates the rest of the file,
    // which is exactly the bug this note replaced.)
    $loaded = $dom->loadHTML(
        '<?xml encoding="utf-8" ?><div>' . $trimmed . '</div>',
        LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
    );
    libxml_clear_errors();
    libxml_use_internal_errors($priorSetting);

    if (!$loaded || $dom->documentElement === null) {
        return '';
    }

    blog_sanitize_children($dom, $dom->documentElement);

    $out = '';
    foreach (iterator_to_array($dom->documentElement->childNodes) as $child) {
        $out .= $dom->saveHTML($child);
    }

    return trim($out);
}

/** Sanitizes every child of $parent in place: mutates the DOM tree, keeping/unwrapping/removing each one. */
function blog_sanitize_children(DOMDocument $dom, DOMNode $parent): void
{
    foreach (iterator_to_array($parent->childNodes) as $child) {
        blog_sanitize_node($dom, $parent, $child);
    }
}

/** Applies the keep/unwrap/remove decision for a single child node of $parent. */
function blog_sanitize_node(DOMDocument $dom, DOMNode $parent, DOMNode $child): void
{
    if ($child instanceof DOMText) {
        return;
    }

    // Comments, processing instructions, CDATA, doctypes, etc. — none of
    // this belongs in stored post content.
    if (!($child instanceof DOMElement)) {
        $parent->removeChild($child);
        return;
    }

    $tag = strtolower($child->nodeName);

    if (in_array($tag, BLOG_HTML_REMOVE_WITH_CONTENTS, true)) {
        $parent->removeChild($child);
        return;
    }

    if (!in_array($tag, BLOG_HTML_ALLOWED_TAGS, true)) {
        blog_unwrap($dom, $parent, $child);
        return;
    }

    blog_sanitize_attributes($child, $tag);

    // An <img> with no (valid) src is dead weight; an <a> with no (valid)
    // href isn't a link at all — drop the former, unwrap the latter down to
    // its text/inline content, same as any other disallowed wrapper.
    if ($tag === 'img' && !$child->hasAttribute('src')) {
        $parent->removeChild($child);
        return;
    }

    if ($tag === 'a' && !$child->hasAttribute('href')) {
        blog_unwrap($dom, $parent, $child);
        return;
    }

    if (!in_array($tag, BLOG_HTML_VOID_TAGS, true)) {
        blog_sanitize_children($dom, $child);
    }
}

/** Replaces $child with its own (sanitized) children in $parent, discarding the tag itself. */
function blog_unwrap(DOMDocument $dom, DOMNode $parent, DOMElement $child): void
{
    blog_sanitize_children($dom, $child);

    foreach (iterator_to_array($child->childNodes) as $grandchild) {
        $parent->insertBefore($grandchild, $child);
    }

    $parent->removeChild($child);
}

/**
 * Rebuilds $element's attribute set from scratch: keeps only names on
 * $tag's allow-list, and only after blog_sanitize_attribute_value()
 * validates/normalizes each surviving value.
 */
function blog_sanitize_attributes(DOMElement $element, string $tag): void
{
    $allowed = BLOG_HTML_ALLOWED_ATTRS[$tag] ?? [];

    $original = [];
    foreach ($element->attributes as $attr) {
        $original[strtolower($attr->nodeName)] = $attr->nodeValue;
    }

    foreach (array_keys($original) as $name) {
        $element->removeAttribute($name);
    }

    foreach ($original as $name => $value) {
        if (!in_array($name, $allowed, true)) {
            continue;
        }

        $clean = blog_sanitize_attribute_value($name, $value);
        if ($clean !== null) {
            $element->setAttribute($name, $clean);
        }
    }

    if ($tag === 'a') {
        blog_finalize_link_attributes($element);
    }
}

/** Validates/normalizes one attribute value; returns null to drop the attribute entirely. */
function blog_sanitize_attribute_value(string $attr, string $value): ?string
{
    switch ($attr) {
        case 'href':
            return blog_sanitize_url($value, BLOG_HTML_ALLOWED_URL_SCHEMES_HREF);
        case 'src':
            return blog_sanitize_url($value, BLOG_HTML_ALLOWED_URL_SCHEMES_SRC);
        case 'target':
            $normalized = strtolower(trim($value));
            return in_array($normalized, BLOG_HTML_ALLOWED_TARGETS, true) ? $normalized : null;
        case 'rel':
            return blog_sanitize_rel($value);
        case 'title':
        case 'alt':
            return blog_clean_text_attribute($value);
        case 'width':
        case 'height':
            $trimmedValue = trim($value);
            return preg_match('/^\d{1,4}%?$/', $trimmedValue) === 1 ? $trimmedValue : null;
        case 'colspan':
        case 'rowspan':
            return blog_sanitize_span_count($value);
        case 'style':
            return blog_sanitize_style($value);
        case 'class':
            return blog_sanitize_class($value);
        default:
            return null;
    }
}

/**
 * Validates a URL attribute value against an allow-listed scheme set.
 * Values with no scheme (relative paths, `#fragment`s, `?query`s,
 * protocol-relative `//host/path`) are always allowed through — only a
 * recognized-but-disallowed scheme (`javascript:`, `data:`, `vbscript:`,
 * etc.) causes rejection. Strips embedded ASCII control characters first
 * (mirroring the URL-parsing behavior browsers apply, e.g. `java\tscript:`)
 * so that trick can't be used to smuggle a scheme past the check.
 */
function blog_sanitize_url(string $value, array $allowedSchemes): ?string
{
    $clean = preg_replace('/[\x00-\x1F]+/', '', $value) ?? '';
    $clean = trim($clean);

    if ($clean === '') {
        return null;
    }

    if (preg_match('/^([a-zA-Z][a-zA-Z0-9+.\-]*):/', $clean, $matches) === 1) {
        $scheme = strtolower($matches[1]);
        if (!in_array($scheme, $allowedSchemes, true)) {
            return null;
        }
    }

    return $clean;
}

/** Keeps only recognized rel tokens (case-insensitive); returns null if none survive. */
function blog_sanitize_rel(string $value): ?string
{
    $tokens = preg_split('/\s+/', trim($value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $kept = array_values(array_unique(array_intersect(
        array_map('strtolower', $tokens),
        BLOG_HTML_ALLOWED_REL_TOKENS
    )));

    return $kept === [] ? null : implode(' ', $kept);
}

/**
 * `target="_blank"` without `rel="noopener"` lets the opened page's script
 * reach back into `window.opener` (reverse tabnabbing) — enforced here
 * regardless of what `rel` the content did or didn't already carry, so it
 * can't be bypassed by simply omitting `rel`.
 */
function blog_finalize_link_attributes(DOMElement $a): void
{
    if ($a->getAttribute('target') !== '_blank') {
        return;
    }

    $existing = $a->hasAttribute('rel')
        ? preg_split('/\s+/', $a->getAttribute('rel'), -1, PREG_SPLIT_NO_EMPTY)
        : [];
    $rel = array_unique(array_merge($existing ?: [], ['noopener', 'noreferrer']));

    $a->setAttribute('rel', implode(' ', $rel));
}

/** Free-text attribute (alt/title): strips control characters, otherwise passed through as-is (DOM serialization escapes it safely). */
function blog_clean_text_attribute(string $value): string
{
    $clean = preg_replace('/[\x00-\x1F]+/', ' ', $value) ?? '';

    return trim($clean);
}

/** colspan/rowspan: a positive integer, capped at a sane bound (HTML itself caps these at 1000). */
function blog_sanitize_span_count(string $value): ?string
{
    $trimmedValue = trim($value);
    if (preg_match('/^\d{1,4}$/', $trimmedValue) !== 1) {
        return null;
    }

    $count = (int) $trimmedValue;

    return ($count >= 1 && $count <= 1000) ? (string) $count : null;
}

/**
 * `style` is reduced to exactly one allowed declaration — text-align — and
 * normalized to a canonical form. Anything else (url(), expression(),
 * position/behavior tricks, arbitrary CSS in general) is rejected outright
 * by not matching this pattern, rather than attempting to selectively
 * strip dangerous CSS out of an otherwise-freeform value.
 */
function blog_sanitize_style(string $value): ?string
{
    if (preg_match('/^\s*text-align\s*:\s*(left|right|center|justify)\s*;?\s*$/i', $value, $matches) !== 1) {
        return null;
    }

    return 'text-align: ' . strtolower($matches[1]);
}

/** `class`: keeps only whitespace-separated tokens made of safe identifier characters. */
function blog_sanitize_class(string $value): ?string
{
    $tokens = preg_split('/\s+/', trim($value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $kept = array_values(array_filter(
        $tokens,
        static fn (string $token): bool => preg_match('/^[A-Za-z0-9_-]+$/', $token) === 1
    ));

    return $kept === [] ? null : implode(' ', $kept);
}
