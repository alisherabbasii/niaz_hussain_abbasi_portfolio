import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const CONTENT_DIR = path.join(REPO_ROOT, 'content', 'blog');
export const PUBLIC_BLOG_IMAGES_DIR = path.join(REPO_ROOT, 'public', 'blog-images');

/** Must stay in sync with `src/features/blog/constants.ts` — not imported directly
 * because these scripts run under plain `node`, which can't load a `.ts` file. */
export const KNOWN_BLOG_CATEGORIES = ['Survey Engineering', 'Document Control', 'Site Safety', 'Leadership'];

export const DEFAULT_AUTHOR = 'Niaz Hussain Abbasi';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 300;
