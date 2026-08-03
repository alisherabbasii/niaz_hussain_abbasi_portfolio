#!/usr/bin/env node
/**
 * npm run blog:validate [-- --strict]
 *
 * Validates every `content/blog/*.md` file's frontmatter and body. Exits
 * non-zero if any file has an error (or, with `--strict`, a warning).
 * This is the same check a human should run before flipping `draft` to
 * `false` and rebuilding — see docs/BLOG-PUBLISHING-WORKFLOW.md.
 */
import { loadAllPosts } from './lib/posts.mjs';
import { isValidSlug } from './lib/slug.mjs';
import { isValidCalendarDate, isFutureDate } from './lib/date.mjs';
import { KNOWN_BLOG_CATEGORIES, TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from './lib/constants.mjs';

const strict = process.argv.includes('--strict');

function extractLocalBlogLinks(content) {
  const links = [];
  const pattern = /\]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(content))) {
    const url = match[1]?.trim() ?? '';
    if (url.startsWith('/blog/')) {
      const slug = url.slice('/blog/'.length).split(/[/?#]/)[0];
      if (slug) links.push(slug);
    }
  }
  return links;
}

function validatePost(post, allSlugs) {
  const errors = [];
  const warnings = [];
  const fm = post.frontmatter;

  const title = typeof fm.title === 'string' ? fm.title.trim() : '';
  if (!title) errors.push('missing required field: title');
  else if (title.length > TITLE_MAX_LENGTH) {
    errors.push(`title is ${title.length} characters, exceeds the ${TITLE_MAX_LENGTH}-character limit`);
  }

  const slug = typeof fm.slug === 'string' ? fm.slug.trim() : '';
  if (!slug) errors.push('missing required field: slug');
  else if (!isValidSlug(slug)) {
    errors.push(`slug "${slug}" is invalid — expected lowercase alphanumeric segments separated by hyphens`);
  }
  const expectedFilename = `${slug}.md`;
  if (slug && post.filename !== expectedFilename) {
    errors.push(`filename "${post.filename}" doesn't match slug "${slug}" (expected "${expectedFilename}")`);
  }

  if (!post.content || !post.content.trim()) {
    errors.push('missing required field: content (body is empty)');
  }

  const date = fm.date;
  if (date === undefined || date === '') {
    errors.push('missing required field: date');
  } else if (!isValidCalendarDate(date)) {
    errors.push(`date "${date}" is invalid — expected "YYYY-MM-DD"`);
  } else if (isFutureDate(date)) {
    if (fm.draft === false) {
      errors.push(`date "${date}" is in the future for a post with draft: false`);
    } else {
      warnings.push(`date "${date}" is in the future (fine if this post is scheduled ahead of time)`);
    }
  }

  if (fm.draft !== undefined && typeof fm.draft !== 'boolean') {
    errors.push('"draft" must be true or false');
  }
  if (fm.featured !== undefined && typeof fm.featured !== 'boolean') {
    errors.push('"featured" must be true or false');
  }

  const coverImage = typeof fm.coverImage === 'string' ? fm.coverImage.trim() : '';
  const coverImageAlt = typeof fm.coverImageAlt === 'string' ? fm.coverImageAlt.trim() : '';
  if (coverImage && !coverImageAlt) {
    errors.push('"coverImageAlt" is required when "coverImage" is set');
  }
  if (!coverImage) {
    warnings.push('no cover image set');
  }

  const category = typeof fm.category === 'string' ? fm.category.trim() : '';
  if (category && !KNOWN_BLOG_CATEGORIES.includes(category)) {
    warnings.push(`category "${category}" isn't in the known list (${KNOWN_BLOG_CATEGORIES.join(', ')}) — fine if intentional`);
  }

  if (fm.tags !== undefined) {
    if (!Array.isArray(fm.tags) || fm.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
      errors.push('"tags" must be an array of non-empty strings');
    } else {
      const seen = new Set();
      for (const tag of fm.tags) {
        if (seen.has(tag)) errors.push(`duplicate tag "${tag}"`);
        seen.add(tag);
      }
    }
  }

  const description = typeof fm.description === 'string' ? fm.description.trim() : '';
  if (!description) {
    warnings.push('empty description (an excerpt will be auto-generated from the content, but a hand-written one is better for SEO)');
  } else if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`description is ${description.length} characters, exceeds the ${DESCRIPTION_MAX_LENGTH}-character limit`);
  }

  for (const linkedSlug of extractLocalBlogLinks(post.content)) {
    if (linkedSlug !== slug && !allSlugs.has(linkedSlug)) {
      errors.push(`broken local link: /blog/${linkedSlug} doesn't match any post's slug`);
    }
  }

  return { errors, warnings };
}

function main() {
  const posts = loadAllPosts();

  if (posts.length === 0) {
    console.log('No posts found in content/blog/.');
    return;
  }

  const slugCounts = new Map();
  for (const post of posts) {
    const slug = typeof post.frontmatter.slug === 'string' ? post.frontmatter.slug.trim() : '';
    if (slug) slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }
  const allSlugs = new Set(slugCounts.keys());
  const duplicateSlugs = new Set([...slugCounts].filter(([, count]) => count > 1).map(([slug]) => slug));

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const post of posts) {
    const { errors, warnings } = validatePost(post, allSlugs);
    const slug = typeof post.frontmatter.slug === 'string' ? post.frontmatter.slug.trim() : '';
    if (slug && duplicateSlugs.has(slug)) {
      errors.push(`duplicate slug "${slug}" — used by ${slugCounts.get(slug)} posts`);
    }

    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`✓ ${post.filename}`);
      continue;
    }
    console.log(`${errors.length > 0 ? '✗' : '⚠'} ${post.filename}`);
    for (const error of errors) console.log(`    error:   ${error}`);
    for (const warning of warnings) console.log(`    warning: ${warning}`);
  }

  console.log('');
  console.log(`${posts.length} post(s) checked — ${totalErrors} error(s), ${totalWarnings} warning(s).`);

  if (totalErrors > 0 || (strict && totalWarnings > 0)) {
    process.exitCode = 1;
  }
}

main();
