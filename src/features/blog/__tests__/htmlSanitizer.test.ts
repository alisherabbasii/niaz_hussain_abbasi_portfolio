import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../htmlSanitizer';

describe('sanitizeHtml', () => {
  it('removes script tags and their contents', () => {
    const out = sanitizeHtml('<p>Safe</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('<p>Safe</p>');
  });

  it('removes iframe/object/embed tags', () => {
    const out = sanitizeHtml('<iframe src="evil"></iframe><object data="evil"></object><embed src="evil" />');
    expect(out).not.toMatch(/<iframe|<object|<embed/);
  });

  it('strips inline event handler attributes', () => {
    const out = sanitizeHtml('<img src="x.jpg" onerror="alert(1)" alt="x">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('<img');
  });

  it('neutralizes javascript: URLs in href/src', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript:');
  });

  it('leaves ordinary safe markup untouched', () => {
    const input = '<p>Hello <strong>world</strong>, visit <a href="https://example.com">example</a>.</p>';
    expect(sanitizeHtml(input)).toBe(input);
  });
});
