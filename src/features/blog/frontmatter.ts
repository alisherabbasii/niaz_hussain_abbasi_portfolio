/**
 * Minimal YAML-flow-subset frontmatter parser for hand-authored `.md` files
 * under `content/blog/`. Each scalar value is parsed with `JSON.parse` first
 * (so `"quoted strings"`, `["array", "values"]`, and bare `true`/`false` all
 * work), falling back to the raw trimmed text when that throws (unquoted
 * dates, slugs, categories, etc). This mirrors the same JSON-as-YAML-scalar
 * trick already used for output in `src/pages/admin/AdminDashboard.jsx`.
 *
 * Kept dependency-free (no gray-matter/js-yaml) to match this project's
 * existing hand-rolled parsing in `markdown.ts`. `scripts/blog/lib/frontmatter.mjs`
 * duplicates this logic in plain JS so the CLI scripts can run under plain
 * `node` without a TypeScript loader — keep the two in sync if either changes.
 */

const DELIMITER = '---';

export interface ParsedMarkdownFile {
  frontmatter: Record<string, unknown>;
  content: string;
}

function parseScalar(raw: string): unknown {
  if (raw === '') return '';
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Splits a raw `.md` file into its frontmatter object and Markdown body. */
export function parseFrontmatter(raw: string): ParsedMarkdownFile {
  const normalized = raw.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0]?.trim() !== DELIMITER) {
    return { frontmatter: {}, content: normalized.trim() };
  }

  const endIndex = lines.findIndex((line, i) => i > 0 && line.trim() === DELIMITER);
  if (endIndex === -1) {
    return { frontmatter: {}, content: normalized.trim() };
  }

  const frontmatter: Record<string, unknown> = {};
  for (const line of lines.slice(1, endIndex)) {
    if (!line.trim()) continue;
    const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1] ?? '';
    const rawValue = match[2] ?? '';
    frontmatter[key] = parseScalar(rawValue.trim());
  }

  const content = lines.slice(endIndex + 1).join('\n').trim();
  return { frontmatter, content };
}

/** Builds a `---`-delimited frontmatter block (no trailing body) from field values. */
export function stringifyFrontmatter(fields: Record<string, unknown>): string {
  const lines = [DELIMITER];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push(DELIMITER);
  return lines.join('\n');
}
