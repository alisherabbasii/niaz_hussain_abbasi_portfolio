/** Mirrors `src/features/blog/frontmatter.ts` — duplicated in plain JS because
 * these scripts run under plain `node`, which can't load a `.ts` file directly.
 * Keep the two in sync. */

const DELIMITER = '---';

function parseScalar(raw) {
  if (raw === '') return '';
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Splits a raw `.md` file into its frontmatter object and Markdown body. */
export function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0]?.trim() !== DELIMITER) {
    return { frontmatter: {}, content: normalized.trim() };
  }

  const endIndex = lines.findIndex((line, i) => i > 0 && line.trim() === DELIMITER);
  if (endIndex === -1) {
    return { frontmatter: {}, content: normalized.trim() };
  }

  const frontmatter = {};
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
export function stringifyFrontmatter(fields) {
  const lines = [DELIMITER];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push(DELIMITER);
  return lines.join('\n');
}
