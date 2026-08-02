import { describe, expect, it } from 'vitest';
import { normalizeBlogPost, normalizeBlogPosts } from '../schema';
import type { BlogPostFrontmatter } from '../types';

function validFrontmatter(overrides: Partial<BlogPostFrontmatter> = {}): BlogPostFrontmatter {
  return {
    title: 'The Power of Consistency',
    content: 'Body content with enough words to be real.',
    date: '2026-01-01',
    ...overrides,
  };
}

describe('normalizeBlogPost', () => {
  it('normalizes a minimal valid frontmatter object', () => {
    const result = normalizeBlogPost(validFrontmatter());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.data).toMatchObject({
      title: 'The Power of Consistency',
      slug: 'the-power-of-consistency',
      content: 'Body content with enough words to be real.',
      draft: false,
      category: 'Uncategorized',
      tags: [],
      coverImage: null,
    });
  });

  it('derives the slug from the title when no slug is given', () => {
    const result = normalizeBlogPost(validFrontmatter({ title: 'Café Résumé!!' }));
    expect(result.data?.slug).toBe('cafe-resume');
  });

  it('uses an explicit slug when provided', () => {
    const result = normalizeBlogPost(validFrontmatter({ slug: 'custom-slug' }));
    expect(result.data?.slug).toBe('custom-slug');
  });

  it('rejects an explicit slug that is not in canonical form', () => {
    const result = normalizeBlogPost(validFrontmatter({ slug: 'Not A Slug' }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid'))).toBe(true);
  });

  it('reports all missing required fields at once', () => {
    const result = normalizeBlogPost({});
    expect(result.valid).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'title is required',
        'slug is required (and could not be derived from title)',
        'content is required',
        'a valid published date (date/publishedAt) is required',
      ])
    );
  });

  it('rejects an unparseable date', () => {
    const result = normalizeBlogPost(validFrontmatter({ date: 'not-a-date' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('a valid published date (date/publishedAt) is required');
  });

  it('requires cover image alt text when a cover image is set', () => {
    const result = normalizeBlogPost(validFrontmatter({ coverImage: '/img.jpg' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('coverImageAlt is required when coverImage is set');
  });

  it('accepts a cover image paired with alt text', () => {
    const result = normalizeBlogPost(
      validFrontmatter({ coverImage: '/img.jpg', coverImageAlt: 'A descriptive caption' })
    );
    expect(result.valid).toBe(true);
    expect(result.data?.coverImage).toBe('/img.jpg');
  });

  it('generates a description from content when none is given', () => {
    const result = normalizeBlogPost(validFrontmatter());
    expect(result.data?.description).toBe('Body content with enough words to be real.');
  });

  it('falls back to legacy field aliases (body, featuredImage, status)', () => {
    const result = normalizeBlogPost({
      title: 'Legacy Post',
      body: 'Legacy body content.',
      publishedAt: '2026-02-01',
      featuredImage: '/legacy.jpg',
      coverImageAlt: 'legacy alt',
      status: 'draft',
    });
    expect(result.valid).toBe(true);
    expect(result.data?.content).toBe('Legacy body content.');
    expect(result.data?.coverImage).toBe('/legacy.jpg');
    expect(result.data?.draft).toBe(true);
  });

  it('defaults keywords to tags when keywords are not provided', () => {
    const result = normalizeBlogPost(validFrontmatter({ tags: ['grit', 'faith'] }));
    expect(result.data?.keywords).toEqual(['grit', 'faith']);
  });

  it('computes a reading time from content', () => {
    const result = normalizeBlogPost(validFrontmatter());
    expect(result.data?.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe('normalizeBlogPosts', () => {
  it('separates valid posts from invalid ones and reports errors by index', () => {
    const result = normalizeBlogPosts([validFrontmatter({ slug: 'a' }), {}, validFrontmatter({ slug: 'b' })]);
    expect(result.posts.map((p) => p.slug)).toEqual(['a', 'b']);
    expect(Object.keys(result.errorsByIndex)).toEqual(['1']);
  });

  it('detects duplicate slugs among successfully normalized posts', () => {
    const result = normalizeBlogPosts([
      validFrontmatter({ slug: 'same-slug' }),
      validFrontmatter({ slug: 'same-slug' }),
    ]);
    expect(result.duplicateSlugs).toEqual(['same-slug']);
  });
});
