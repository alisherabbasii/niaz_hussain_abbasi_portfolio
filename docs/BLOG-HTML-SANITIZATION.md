# Blog post HTML sanitization

Scope: `backend/helpers/HtmlSanitizer.php`, `backend/api/blog/create.php`,
`backend/api/blog/update.php`. Covers how the rich-text HTML produced by the
admin TipTap editor (`src/components/blog/editor/TiptapEditor.jsx`) is
cleaned before it's ever written to `blog_posts.content`.

## Where sanitization happens

**Server-side, once, immediately before the value reaches the database.**
`blog_sanitize_html()` (`backend/helpers/HtmlSanitizer.php`) runs on
`content`:

- in `backend/api/blog/create.php`, right after the "content is required"
  non-empty check, before the `INSERT`;
- in `backend/api/blog/update.php`, inside the `if (array_key_exists('content',
  $body))` branch, before the `UPDATE` — i.e. only when a request actually
  touches `content`; an update that doesn't include `content` leaves the
  already-sanitized stored value untouched.

In both endpoints, if sanitization strips the input down to nothing (e.g. the
body was only `<script>...</script>`), the request is rejected with `422
{"error": "content contains no permitted HTML after sanitization"}` rather
than silently saving an empty post.

This is the **single authoritative point**. Everything downstream —
`backend/api/blog/show.php`, `backend/api/blog/index.php`, the public
frontend's `HtmlContent.tsx` (`dangerouslySetInnerHTML`) — reads and renders
already-clean HTML. `HtmlContent.tsx` also runs a lightweight deny-list pass
(`sanitizeHtml()` in `src/features/blog/markdown.ts`) before rendering, but
that is defense-in-depth for trusted content, not the security boundary —
per its own docstring, the server sanitizer above is what content provenance
actually depends on. A client can never be trusted to sanitize on the
server's behalf, since any direct API call (not just the admin UI) reaches
the same `create.php`/`update.php` endpoints.

Because sanitization runs exactly once, before storage, re-rendering the
same stored HTML never re-escapes or re-strips it — there's no risk of
double-escaping entities (`&amp;` staying `&amp;`, not becoming `&amp;amp;`)
from running a sanitizer more than once in the pipeline.

## Why a DOM-based allow-list, not a library

This project has no `composer.json` / Composer-managed dependencies (see
`backend/README`) — every backend file is included directly via
`require_once`. Pulling in Composer *only* to install a sanitization library
(e.g. HTML Purifier) would add a whole new dependency-management layer for
one file. Instead, `HtmlSanitizer.php` uses PHP's built-in `ext-dom`
(`DOMDocument`) — present on effectively all PHP hosting, and already a
closer fit for this project's "plain files, standard extensions" shape than
introducing Composer would be.

**Why a real DOM parser instead of regex/string replacement** (the approach
`sanitizeHtml()` in `markdown.ts` takes on the frontend, deliberately, per
its own docstring): regex over raw HTML can't reliably reason about nesting,
malformed/crossed tags, or HTML entity decoding — all things attackers use
to bypass string-based filters (e.g. `&#106;avascript:`, `java&#9;script:`).
A DOM parser normalizes entities and structure first, so validation runs
against the actual decoded meaning of the markup, not its surface text. See
`blog_sanitize_url()`'s docstring for a concrete example (a tab character
embedded mid-scheme).

## Allow-list

### Tags

| Kept as-is | Purpose |
|---|---|
| `p`, `h2`, `h3`, `h4` | Paragraphs, TipTap's configured heading levels |
| `strong`, `em`, `u`, `s` | Bold, italic, underline, strikethrough |
| `ul`, `ol`, `li` | Lists |
| `blockquote` | Quotes |
| `a` | Links |
| `hr`, `br` | Horizontal rule, line break |
| `table`, `thead`, `tbody`, `tr`, `th`, `td` | Tables (TipTap's `TableKit`) |
| `img` | Images |
| `code`, `pre` | Inline/block code (not currently exposed in the editor toolbar, kept for hand-authored/pasted-HTML compatibility) |
| `div`, `span` | Only useful as generic containers; attributes below restrict them to alignment styling |

`strike`/`code`/`codeBlock` are disabled in the editor's `StarterKit`
config (`TiptapEditor.jsx`) — the editor itself never emits `<s>`, `<code>`,
or `<pre>` today. They're kept in the sanitizer's allow-list anyway (rather
than narrowing it to exactly what the editor currently emits) since the
sanitizer's job is to define what's *safe to store and render*, not to mirror
the editor's current feature set — pasted rich text or a future editor change
can legitimately produce them without needing this file touched again.

Any tag not on this list is **unwrapped**: the tag itself is discarded but
its (recursively sanitized) children are kept in its place. This is what
handles malformed/nested HTML gracefully — text and valid formatting nested
inside a stray or unrecognized wrapper tag survives; only the wrapper does
not.

### Removed wholesale (tag *and* contents)

`script`, `style`, `iframe`, `object`, `embed`, `form`, `input`, `button`,
`svg`, `math`, `template`, `noscript`, `link`, `meta`, `base`, `title`,
`head`, `html`, `body`, `select`, `option`, `optgroup`, `textarea`, `applet`,
`audio`, `video`, `source`, `track`, `canvas`.

These are dropped entirely — including their text content — rather than
unwrapped, because for several of them (`script`, `style`) the *content* is
the payload, and for the rest they have no legitimate place in a blog post
body. `iframe` is on this list because it isn't in the supported-tag set
above; if embeds are ever explicitly supported, that's a deliberate,
separate change to both the allow-list and its attribute validation (an
allow-listed `src` host set, not just a scheme check), not something to add
unnoticed.

### Attributes

Every attribute not listed for a given tag is dropped — this is a default-
deny per element, so `onerror`, `onclick`, and every other `on*` event
handler are removed automatically (they're never on any tag's list) rather
than needing to be individually blocked.

| Tag | Allowed attributes | Notes |
|---|---|---|
| `a` | `href`, `target`, `rel`, `title` | See below |
| `img` | `src`, `alt`, `title`, `width`, `height` | See below |
| `th`, `td` | `colspan`, `rowspan` | Positive integer, 1–1000 |
| `p`, `h2`, `h3`, `h4`, `div`, `span` | `style`, `class` | See below |

**`href`** (on `a`): scheme allow-list `http`, `https`, `mailto`, `tel`
(matching the editor's own `isAllowedLinkUrl` in
`src/features/blog/editorContent.ts`). A value with no scheme at all
(relative path, `#fragment`, `?query`, protocol-relative `//host/...`) is
always allowed through — only a recognized-but-disallowed scheme
(`javascript:`, `data:`, `vbscript:`, ...) is rejected. If `href` ends up
empty/invalid, the `<a>` is unwrapped (kept as plain text) rather than left
as a dead, non-functional link.

**`src`** (on `img`): scheme allow-list `http`, `https` only — no `data:`
scheme at all, matching the editor's `isAllowedImageSrc` and the image
extension's `allowBase64: false` (`imageExtension.js`): uploaded images are
always served from a real URL (`/uploads/...` or absolute), never inlined as
base64. If `src` ends up empty/invalid, the whole `<img>` is dropped (an
`<img>` with no source is not meaningful markup).

**`target`**: only `_blank` or `_self`; anything else is dropped.

**`rel`**: filtered to a small safe-token allow-list (`noopener`,
`noreferrer`, `nofollow`, `ugc`, `sponsor`, `external`); unrecognized tokens
are removed. Independently of whatever `rel` was supplied, **any link with
`target="_blank"` always gets `noopener noreferrer` merged in** — this closes
the "reverse tabnabbing" hole (a `target="_blank"` page can otherwise reach
back into `window.opener`) even if the stored content never had a safe `rel`
to begin with.

**`width` / `height`** (on `img`): digits only, optionally followed by `%`
(e.g. `200`, `50%`); anything else is dropped ("if controlled", per the
allow-list this doc's task described — no `calc()`, no units besides an
implicit pixel value or `%`).

**`style`**: reduced to *exactly one* possible declaration —
`text-align: left|right|center|justify` — matching what TipTap's
`TextAlign` extension actually emits on paragraphs/headings. Any other CSS
(anything with `url(`, `expression(`, `position`, `behavior`, or simply any
property other than `text-align`) fails the match and the entire attribute
is dropped — there's no attempt to selectively strip dangerous parts out of
an otherwise-freeform `style` value, since that's exactly the kind of
partial-filtering logic CSS-based XSS bypasses tend to exploit.

**`class`**: kept only where every whitespace-separated token matches
`^[A-Za-z0-9_-]+$`; anything else (quotes, `<`, `>`, `;`, parens) is dropped
token-by-token. A `class` value can't execute anything by itself (there's no
`<style>` tag left in the document to give it meaning, since `style` tags are
removed wholesale above), but it's still restricted to safe identifier
characters as a hygiene measure.

## Test payloads

`backend/tests/html_sanitizer_test.php` is a standalone unit test — no
database, no running server, just direct calls into `blog_sanitize_html()` —
covering:

- `<script>` tag (removed, siblings survive)
- `<img onerror=...>` (handler stripped, image kept)
- `javascript:` link (href removed, anchor unwrapped to plain text)
- malicious `<svg>` with an inline `<script>` and an `onerror`-bearing
  `<image>` (removed wholesale)
- `<iframe>` (removed wholesale, siblings survive)
- malformed/crossed nested tags (`<p><strong><em>...</p></strong></em>`) —
  parser-corrected structure, no content lost
- a well-formed table (round-trips unchanged)
- a well-formed image with `src`/`alt`/`title`/`width`/`height`
  (round-trips unchanged)
- a well-formed link with `target="_blank"` (round-trips, gains
  `noopener`/`noreferrer`)
- text-alignment `style` on a paragraph and a heading (round-trips,
  normalized)

Plus additional hardening cases: `data:` URI images, CSS-smuggled
`javascript:` inside `style`, `on*` handlers on an otherwise-plain tag,
`object`/`embed`/`form`/`input`/`button`, unknown wrapper tags
(`<marquee>`/`<blink>`) being unwrapped rather than silently eating their
content, HTML-entity-encoded (`&#0058;`) and control-character-split
(`java\tscript:`) attempts to smuggle a `javascript:` scheme past validation,
`&amp;` round-tripping without double-escaping, and `u`/`s`/`code`/`pre`
surviving.

Run it with:

```
php backend/tests/html_sanitizer_test.php
```

## Frontend editor: unchanged

No changes were made to the TipTap editor or its extensions
(`TiptapEditor.jsx`, `imageExtension.js`, `EditorToolbar.jsx`,
`editorContent.ts`). The allow-list above was derived from what those
extensions actually produce (confirmed by inspecting each extension's
`renderHTML`/`addAttributes`, not just the toolbar UI), so normal editor
output round-trips through `blog_sanitize_html()` unchanged. The frontend's
own link/image URL validation (`isAllowedLinkUrl`, `isAllowedImageSrc` in
`editorContent.ts`) remains useful as an editing-time UX guard — it stops an
admin from typing an unsafe URL into the link/image dialogs in the first
place — but is not what makes storage safe; the server-side sanitizer above
is.
