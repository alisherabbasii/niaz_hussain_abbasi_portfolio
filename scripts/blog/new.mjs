#!/usr/bin/env node
/**
 * npm run blog:new [-- --title="My Post" --category="Site Safety" --tags="Tag One,Tag Two" --assets]
 *
 * Creates a new draft post: content/blog/<slug>.md with frontmatter and a
 * placeholder body. Never overwrites an existing file. Optionally scaffolds
 * public/blog-images/<slug>/ for a cover image.
 *
 * Any field not passed as a flag is asked for interactively when running in
 * a real terminal; non-interactive runs (no TTY) require at least --title.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { CONTENT_DIR, PUBLIC_BLOG_IMAGES_DIR, DEFAULT_AUTHOR, KNOWN_BLOG_CATEGORIES } from './lib/constants.mjs';
import { generateSlug, isValidSlug } from './lib/slug.mjs';
import { stringifyFrontmatter } from './lib/frontmatter.mjs';
import { todayIso } from './lib/date.mjs';

function parseArgs(argv) {
  const flags = {};
  for (const arg of argv) {
    const match = /^--([a-zA-Z-]+)(?:=(.*))?$/.exec(arg);
    if (!match) continue;
    const key = (match[1] ?? '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    flags[key] = match[2] ?? true;
  }
  return flags;
}

async function prompt(rl, question, fallback = '') {
  const answer = (await rl.question(question)).trim();
  return answer || fallback;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const interactive = stdin.isTTY && stdout.isTTY;
  const rl = interactive ? readline.createInterface({ input: stdin, output: stdout }) : null;

  let title = typeof flags.title === 'string' ? flags.title.trim() : '';
  if (!title && rl) title = await prompt(rl, 'Post title: ');
  if (!title) {
    console.error('A title is required. Pass --title="..." or run this in an interactive terminal.');
    process.exitCode = 1;
    rl?.close();
    return;
  }

  let slug = typeof flags.slug === 'string' ? flags.slug.trim() : '';
  const suggestedSlug = generateSlug(title);
  if (!slug && rl) {
    slug = await prompt(rl, `URL slug [${suggestedSlug}]: `, suggestedSlug);
  } else if (!slug) {
    slug = suggestedSlug;
  }
  if (!isValidSlug(slug)) {
    console.error(`Slug "${slug}" is invalid — expected lowercase alphanumeric segments separated by hyphens (e.g. "my-post-title").`);
    process.exitCode = 1;
    rl?.close();
    return;
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (fs.existsSync(filePath)) {
    console.error(`content/blog/${slug}.md already exists — refusing to overwrite it. Choose a different title/slug, or edit that file directly.`);
    process.exitCode = 1;
    rl?.close();
    return;
  }

  let description = typeof flags.description === 'string' ? flags.description.trim() : '';
  if (!description && rl) {
    description = await prompt(rl, 'Description / excerpt (optional, press Enter to skip): ');
  }

  let category = typeof flags.category === 'string' ? flags.category.trim() : '';
  if (!category && rl) {
    category = await prompt(rl, `Category (optional, e.g. ${KNOWN_BLOG_CATEGORIES.join(' / ')}): `);
  }

  let tagsInput = typeof flags.tags === 'string' ? flags.tags : '';
  if (!tagsInput && rl) {
    tagsInput = await prompt(rl, 'Tags, comma separated (optional): ');
  }
  const tags = tagsInput
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const author = typeof flags.author === 'string' ? flags.author.trim() : DEFAULT_AUTHOR;
  const date = typeof flags.date === 'string' ? flags.date.trim() : todayIso();
  const featured = flags.featured === true;

  let createAssets = flags.assets === true;
  if (!createAssets && flags.noAssets !== true && rl) {
    const answer = await prompt(rl, 'Create an asset folder for this post\'s images? (y/N): ');
    createAssets = /^y(es)?$/i.test(answer);
  }

  rl?.close();

  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const frontmatter = {
    title,
    slug,
    description,
    date,
    author,
    category,
    tags,
    featured,
    draft: true,
  };

  const body = `Start writing here. This file is Markdown — see docs/BLOG-PUBLISHING-WORKFLOW.md for headings, lists, and emphasis supported by the site.\n`;
  fs.writeFileSync(filePath, `${stringifyFrontmatter(frontmatter)}\n\n${body}`, 'utf8');

  console.log(`\nCreated content/blog/${slug}.md (draft: true)\n`);

  let assetDir = null;
  if (createAssets) {
    assetDir = path.join(PUBLIC_BLOG_IMAGES_DIR, slug);
    fs.mkdirSync(assetDir, { recursive: true });
    fs.writeFileSync(path.join(assetDir, '.gitkeep'), '');
    console.log(`Created public/blog-images/${slug}/ for this post's images.\n`);
  }

  console.log('Next steps:');
  console.log(`  1. ${createAssets ? `Add a cover image to public/blog-images/${slug}/` : `(Optional) Add a cover image to public/blog-images/${slug}/ (create the folder yourself, or rerun with --assets)`}, then set`);
  console.log(`     coverImage: "/blog-images/${slug}/<filename>" and coverImageAlt: "..." in the frontmatter.`);
  console.log(`  2. Write the post body in content/blog/${slug}.md.`);
  console.log(`  3. Preview it locally: \`npm run dev\`, then open /blog/${slug} — draft posts render there in dev mode only (hidden from the public /blog list, and never shipped in a production build).`);
  console.log('  4. Run `npm run blog:validate` and fix anything it flags.');
  console.log(`  5. When ready to publish, change \`draft: true\` to \`draft: false\` in content/blog/${slug}.md.`);
  console.log('  6. `npm run build` and deploy `dist/` — see docs/BLOG-PUBLISHING-WORKFLOW.md.');
}

main();
