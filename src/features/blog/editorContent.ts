/**
 * Framework-neutral helpers for the TipTap content editor: link URL
 * validation (shared between the Link mark's `isAllowedUri` and the link
 * insertion dialog) and empty-content detection.
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
