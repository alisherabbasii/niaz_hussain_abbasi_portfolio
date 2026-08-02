import { parseMarkdownBlocks } from '../../features/blog/markdown';
import type { InlineToken, MarkdownBlock } from '../../features/blog/markdown';

function renderInline(tokens: InlineToken[]) {
  return tokens.map((token, index) =>
    token.type === 'bold' ? <strong key={index}>{token.value}</strong> : <span key={index}>{token.value}</span>
  );
}

function renderBlock(block: MarkdownBlock, index: number) {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? <h2 key={index}>{block.text}</h2> : <h3 key={index}>{block.text}</h3>;
    case 'paragraph':
      return <p key={index}>{renderInline(block.inline)}</p>;
    case 'emphasisParagraph':
      return (
        <p key={index} className="italic">
          {block.text}
        </p>
      );
    case 'list':
      return block.ordered ? (
        <ol key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

/**
 * Renders a post's Markdown body as JSX via `parseMarkdownBlocks`, wrapped
 * in a `.prose`-classed container — `TableOfContents` depends on that class
 * being present on an ancestor to find `h2`/`h3` targets.
 */
export default function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const blocks = parseMarkdownBlocks(content);
  const classes = ['prose', className].filter(Boolean).join(' ');

  return <div className={classes}>{blocks.map(renderBlock)}</div>;
}
