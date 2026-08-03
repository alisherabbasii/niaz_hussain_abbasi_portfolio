import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR } from './constants.mjs';
import { parseFrontmatter } from './frontmatter.mjs';

export function listContentFiles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort();
}

export function loadPost(filename) {
  const filePath = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, content } = parseFrontmatter(raw);
  return { filename, filePath, frontmatter, content };
}

/** Every `content/blog/*.md` file, parsed but not validated. */
export function loadAllPosts() {
  return listContentFiles().map(loadPost);
}
