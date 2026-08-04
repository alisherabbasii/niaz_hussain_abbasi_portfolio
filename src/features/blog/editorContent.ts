/**
 * Framework-neutral helpers for the TipTap content editor: link URL
 * validation (shared between the Link mark's `isAllowedUri` and the link
 * insertion dialog), image URL validation (shared between the Image node's
 * parsing and the upload/insert flow), and empty-content detection.
 */

/** The only schemes the editor's Link mark and link dialog accept. */
export const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Loose "looks like a phone number" check: digits plus common separators, at least 7 digits. */
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/;
const HAS_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

/** True if `url` parses and its scheme is in `ALLOWED_LINK_PROTOCOLS`. */
export function isAllowedLinkUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_LINK_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Turns raw user input from the link dialog into an absolute URL restricted
 * to `ALLOWED_LINK_PROTOCOLS`, inferring a scheme when one wasn't typed
 * (email-shaped input -> mailto:, phone-shaped input -> tel:, otherwise
 * https:). Returns null when the input is empty or resolves to a
 * disallowed/unparseable URL.
 */
export function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!HAS_SCHEME_PATTERN.test(trimmed)) {
    if (EMAIL_PATTERN.test(trimmed)) {
      candidate = `mailto:${trimmed}`;
    } else if (PHONE_PATTERN.test(trimmed)) {
      candidate = `tel:${trimmed}`;
    } else {
      candidate = `https://${trimmed}`;
    }
  }

  return isAllowedLinkUrl(candidate) ? candidate : null;
}

/**
 * True if `src` is safe to render as an `<img>` source: resolves (relative
 * to the current origin, so `/uploads/...` — what `upload/editor.php`
 * returns — passes) to an http/https URL. Unlike `isAllowedLinkUrl`, a
 * relative path is expected and allowed here since uploaded images are
 * stored/served same-origin. Rejects `javascript:`, `data:` (base64 images
 * must never be persisted in stored HTML), `blob:` (local-only, meaningless
 * once saved), and any other non-http(s) scheme.
 */
export function isAllowedImageSrc(src: string): boolean {
  if (typeof src !== 'string' || src.trim() === '') return false;
  try {
    // The base is an arbitrary same-scheme placeholder used only so a
    // relative path (e.g. `/uploads/...`) parses — an absolute URL in `src`
    // ignores it entirely and resolves to its own scheme.
    const parsed = new URL(src, 'http://localhost');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
