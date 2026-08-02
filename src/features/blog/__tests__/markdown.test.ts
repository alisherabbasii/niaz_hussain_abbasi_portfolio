import { describe, expect, it } from 'vitest';
import { parseInlineTokens, parseMarkdownBlocks, sanitizeHtml } from '../markdown';

describe('parseInlineTokens', () => {
  it('splits plain text and bold segments', () => {
    expect(parseInlineTokens('Hello **world**, it is **me**.')).toEqual([
      { type: 'text', value: 'Hello ' },
      { type: 'bold', value: 'world' },
      { type: 'text', value: ', it is ' },
      { type: 'bold', value: 'me' },
      { type: 'text', value: '.' },
    ]);
  });

  it('returns a single text token when there is no bold', () => {
    expect(parseInlineTokens('Plain text')).toEqual([{ type: 'text', value: 'Plain text' }]);
  });
});

describe('parseMarkdownBlocks', () => {
  it('parses headings', () => {
    expect(parseMarkdownBlocks('## Heading Two\n### Heading Three')).toEqual([
      { type: 'heading', level: 2, text: 'Heading Two' },
      { type: 'heading', level: 3, text: 'Heading Three' },
    ]);
  });

  it('parses an unordered list', () => {
    const blocks = parseMarkdownBlocks('- one\n- two\n* three');
    expect(blocks).toEqual([{ type: 'list', ordered: false, items: ['one', 'two', 'three'] }]);
  });

  it('parses an ordered list', () => {
    const blocks = parseMarkdownBlocks('1. one\n2. two');
    expect(blocks).toEqual([{ type: 'list', ordered: true, items: ['one', 'two'] }]);
  });

  it('splits into separate lists when the marker type changes', () => {
    const blocks = parseMarkdownBlocks('1. one\n- two');
    expect(blocks).toEqual([
      { type: 'list', ordered: true, items: ['one'] },
      { type: 'list', ordered: false, items: ['two'] },
    ]);
  });

  it('parses an emphasis paragraph wrapped in single asterisks', () => {
    expect(parseMarkdownBlocks('*A quiet aside.*')).toEqual([
      { type: 'emphasisParagraph', text: 'A quiet aside.' },
    ]);
  });

  it('parses a regular paragraph with inline bold', () => {
    expect(parseMarkdownBlocks('Some **bold** text.')).toEqual([
      {
        type: 'paragraph',
        inline: [
          { type: 'text', value: 'Some ' },
          { type: 'bold', value: 'bold' },
          { type: 'text', value: ' text.' },
        ],
      },
    ]);
  });

  it('flushes an in-progress list at a blank line', () => {
    const blocks = parseMarkdownBlocks('- one\n- two\n\nAfter the list.');
    expect(blocks).toEqual([
      { type: 'list', ordered: false, items: ['one', 'two'] },
      { type: 'paragraph', inline: [{ type: 'text', value: 'After the list.' }] },
    ]);
  });
});

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
