#!/usr/bin/env node
/**
 * npm run blog:list [-- --draft | --published] [-- --category="Site Safety"]
 *
 * Lists every post in content/blog/, newest first, with its publish status.
 */
import { loadAllPosts } from './lib/posts.mjs';

function parseArgs(argv) {
  const flags = { draft: false, published: false, category: null };
  for (const arg of argv) {
    if (arg === '--draft') flags.draft = true;
    else if (arg === '--published') flags.published = true;
    else if (arg.startsWith('--category=')) flags.category = arg.slice('--category='.length);
  }
  return flags;
}

function pad(value, width) {
  const str = String(value);
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}

function main() {
  const flags = parseArgs(process.argv.slice(2));
  let posts = loadAllPosts().map((post) => ({
    slug: typeof post.frontmatter.slug === 'string' ? post.frontmatter.slug : post.filename.replace(/\.md$/, ''),
    title: typeof post.frontmatter.title === 'string' ? post.frontmatter.title : '(untitled)',
    date: typeof post.frontmatter.date === 'string' ? post.frontmatter.date : '(no date)',
    category: typeof post.frontmatter.category === 'string' ? post.frontmatter.category : '',
    draft: post.frontmatter.draft !== false,
    featured: post.frontmatter.featured === true,
    filename: post.filename,
  }));

  if (flags.draft) posts = posts.filter((post) => post.draft);
  if (flags.published) posts = posts.filter((post) => !post.draft);
  if (flags.category) posts = posts.filter((post) => post.category === flags.category);

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (posts.length === 0) {
    console.log('No posts match.');
    return;
  }

  const statusWidth = 10;
  const dateWidth = 12;
  const slugWidth = Math.max(...posts.map((post) => post.slug.length), 4) + 2;

  console.log(pad('STATUS', statusWidth) + pad('DATE', dateWidth) + pad('SLUG', slugWidth) + 'TITLE');
  for (const post of posts) {
    const status = post.draft ? 'draft' : 'published';
    const marker = post.featured ? '★' : '';
    console.log(
      pad(status, statusWidth) + pad(post.date, dateWidth) + pad(post.slug, slugWidth) + `${post.title} ${marker}`.trim()
    );
  }
  console.log('');
  console.log(`${posts.length} post(s).`);
}

main();
