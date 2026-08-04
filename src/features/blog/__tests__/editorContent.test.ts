import { describe, expect, it } from 'vitest';
import { isAllowedImageSrc, isAllowedLinkUrl, normalizeLinkUrl } from '../editorContent';

describe('isAllowedLinkUrl', () => {
  it('accepts http, https, mailto, and tel URLs', () => {
    expect(isAllowedLinkUrl('http://example.com')).toBe(true);
    expect(isAllowedLinkUrl('https://example.com/path?q=1')).toBe(true);
    expect(isAllowedLinkUrl('mailto:someone@example.com')).toBe(true);
    expect(isAllowedLinkUrl('tel:+15551234567')).toBe(true);
  });

  it('rejects disallowed or dangerous schemes', () => {
    expect(isAllowedLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedLinkUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isAllowedLinkUrl('ftp://example.com')).toBe(false);
    expect(isAllowedLinkUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects unparseable/relative input', () => {
    expect(isAllowedLinkUrl('not a url')).toBe(false);
    expect(isAllowedLinkUrl('/relative/path')).toBe(false);
    expect(isAllowedLinkUrl('')).toBe(false);
  });
});

describe('normalizeLinkUrl', () => {
  it('passes through explicit allowed schemes unchanged', () => {
    expect(normalizeLinkUrl('https://example.com')).toBe('https://example.com');
    expect(normalizeLinkUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeLinkUrl('mailto:someone@example.com')).toBe('mailto:someone@example.com');
    expect(normalizeLinkUrl('tel:+15551234567')).toBe('tel:+15551234567');
  });

  it('infers mailto: for email-shaped input without a scheme', () => {
    expect(normalizeLinkUrl('someone@example.com')).toBe('mailto:someone@example.com');
  });

  it('infers tel: for phone-shaped input without a scheme', () => {
    expect(normalizeLinkUrl('+1 (555) 123-4567')).toBe('tel:+1 (555) 123-4567');
  });

  it('defaults to https: for bare domains/paths', () => {
    expect(normalizeLinkUrl('example.com')).toBe('https://example.com');
    expect(normalizeLinkUrl('www.example.com/blog')).toBe('https://www.example.com/blog');
  });

  it('rejects explicit disallowed schemes instead of coercing them', () => {
    expect(normalizeLinkUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeLinkUrl('ftp://example.com')).toBeNull();
  });

  it('returns null for empty/whitespace input', () => {
    expect(normalizeLinkUrl('')).toBeNull();
    expect(normalizeLinkUrl('   ')).toBeNull();
  });
});

describe('isAllowedImageSrc', () => {
  it('accepts same-origin relative upload paths', () => {
    expect(isAllowedImageSrc('/uploads/blog/content/abc123.jpg')).toBe(true);
  });

  it('accepts absolute http/https URLs', () => {
    expect(isAllowedImageSrc('https://example.com/image.png')).toBe(true);
    expect(isAllowedImageSrc('http://example.com/image.png')).toBe(true);
  });

  it('rejects data:, blob:, javascript:, and other dangerous schemes', () => {
    expect(isAllowedImageSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
    expect(isAllowedImageSrc('blob:http://example.com/uuid')).toBe(false);
    expect(isAllowedImageSrc('javascript:alert(1)')).toBe(false);
    expect(isAllowedImageSrc('file:///etc/passwd')).toBe(false);
  });

  it('rejects empty/unparseable input', () => {
    expect(isAllowedImageSrc('')).toBe(false);
    expect(isAllowedImageSrc('   ')).toBe(false);
  });
});
