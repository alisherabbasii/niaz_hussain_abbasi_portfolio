import { describe, expect, it } from 'vitest';
import {
  calculateReadingTimeMinutes,
  filterByCategory,
  filterByTag,
  filterFeaturedPosts,
  filterPublishedPosts,
  findDuplicateSlugs,
  formatDate,
  formatReadingTime,
  generateExcerpt,
  generateSlug,
  isValidSlug,
  normalizeDate,
  sortPostsByDate,
} from '../utils';
import type { BlogPost } from '../types';

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    title: 'Untitled',
    slug: 'untitled',
    description: '',
    content: 'Body content.',
    publishedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
    author: 'Author',
    category: 'Community',
    tags: [],
    coverImage: null,
    coverImageAlt: '',
    featured: false,
    draft: false,
    keywords: [],
    readingTimeMinutes: 1,
    ...overrides,
  };
}

describe('generateSlug', () => {
  it('is deterministic for the same input', () => {
    expect(generateSlug('The Power of Consistency')).toBe(generateSlug('The Power of Consistency'));
  });

  it('lowercases and hyphenates', () => {
    expect(generateSlug('The Power of Consistency')).toBe('the-power-of-consistency');
  });

  it('strips diacritics', () => {
    expect(generateSlug('Café Résumé')).toBe('cafe-resume');
  });

  it('collapses punctuation runs and trims leading/trailing hyphens', () => {
    expect(generateSlug('  --Hello, World!!--  ')).toBe('hello-world');
  });
});

describe('isValidSlug', () => {
  it('accepts lowercase hyphenated slugs', () => {
    expect(isValidSlug('my-post-title')).toBe(true);
    expect(isValidSlug('post')).toBe(true);
  });

  it('rejects uppercase, spaces, leading/trailing hyphens, and double hyphens', () => {
    expect(isValidSlug('My-Post')).toBe(false);
    expect(isValidSlug('my post')).toBe(false);
    expect(isValidSlug('-my-post')).toBe(false);
    expect(isValidSlug('my-post-')).toBe(false);
    expect(isValidSlug('my--post')).toBe(false);
  });
});

describe('findDuplicateSlugs', () => {
  it('returns slugs that appear more than once', () => {
    const posts = [{ slug: 'a' }, { slug: 'b' }, { slug: 'a' }, { slug: 'c' }, { slug: 'b' }];
    expect(findDuplicateSlugs(posts).sort()).toEqual(['a', 'b']);
  });

  it('returns an empty array when all slugs are unique', () => {
    expect(findDuplicateSlugs([{ slug: 'a' }, { slug: 'b' }])).toEqual([]);
  });
});

describe('normalizeDate', () => {
  it('normalizes a valid date string to ISO 8601', () => {
    expect(normalizeDate('2026-08-02')).toBe(new Date('2026-08-02').toISOString());
  });

  it('returns null for unparseable input', () => {
    expect(normalizeDate('not a date')).toBeNull();
    expect(normalizeDate(undefined)).toBeNull();
    expect(normalizeDate('')).toBeNull();
  });
});

describe('formatDate', () => {
  it('formats an ISO date for display', () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' } as const;
    expect(formatDate('2026-08-02T00:00:00.000Z', options)).toBe('August 2, 2026');
  });

  it('returns an empty string for an invalid ISO date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('calculateReadingTimeMinutes', () => {
  it('rounds up to the nearest whole minute', () => {
    const words = new Array(201).fill('word').join(' ');
    expect(calculateReadingTimeMinutes(words, 200)).toBe(2);
  });

  it('returns a minimum of 1 minute for short or empty content', () => {
    expect(calculateReadingTimeMinutes('short')).toBe(1);
    expect(calculateReadingTimeMinutes('')).toBe(1);
  });

  it('strips HTML tags before counting words', () => {
    expect(calculateReadingTimeMinutes('<p>one two three</p>')).toBe(1);
  });
});

describe('formatReadingTime', () => {
  it('formats minutes as a "min read" label', () => {
    expect(formatReadingTime(4)).toBe('4 min read');
  });
});

describe('generateExcerpt', () => {
  it('returns short content unchanged', () => {
    expect(generateExcerpt('Short text.', 160)).toBe('Short text.');
  });

  it('truncates long content at a word boundary with an ellipsis', () => {
    const text = 'word '.repeat(60).trim();
    const excerpt = generateExcerpt(text, 20);
    expect(excerpt.length).toBeLessThanOrEqual(21);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.endsWith(' …')).toBe(false);
  });

  it('strips HTML tags', () => {
    expect(generateExcerpt('<p>Hello <strong>world</strong></p>', 160)).toBe('Hello world');
  });
});

describe('sortPostsByDate', () => {
  const older = makePost({ slug: 'older', publishedAt: '2026-01-01T00:00:00.000Z' });
  const newer = makePost({ slug: 'newer', publishedAt: '2026-06-01T00:00:00.000Z' });

  it('sorts descending by default (newest first)', () => {
    expect(sortPostsByDate([older, newer]).map((p) => p.slug)).toEqual(['newer', 'older']);
  });

  it('sorts ascending when requested', () => {
    expect(sortPostsByDate([newer, older], 'asc').map((p) => p.slug)).toEqual(['older', 'newer']);
  });

  it('does not mutate the input array', () => {
    const input = [older, newer];
    const copy = [...input];
    sortPostsByDate(input);
    expect(input).toEqual(copy);
  });
});

describe('filterPublishedPosts / filterFeaturedPosts', () => {
  const published = makePost({ slug: 'published', draft: false, featured: true });
  const draft = makePost({ slug: 'draft', draft: true, featured: true });

  it('excludes drafts', () => {
    expect(filterPublishedPosts([published, draft]).map((p) => p.slug)).toEqual(['published']);
  });

  it('excludes drafts even when featured, and respects the limit', () => {
    const another = makePost({ slug: 'another', draft: false, featured: true });
    const result = filterFeaturedPosts([published, draft, another], 1);
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('published');
  });
});

describe('filterByCategory / filterByTag', () => {
  const a = makePost({ slug: 'a', category: 'Leadership', tags: ['grit'] });
  const b = makePost({ slug: 'b', category: 'Community', tags: ['grit', 'faith'] });

  it('filters by exact category match', () => {
    expect(filterByCategory([a, b], 'Leadership').map((p) => p.slug)).toEqual(['a']);
  });

  it('filters by tag membership', () => {
    expect(filterByTag([a, b], 'faith').map((p) => p.slug)).toEqual(['b']);
    expect(filterByTag([a, b], 'grit').map((p) => p.slug).sort()).toEqual(['a', 'b']);
  });
});
