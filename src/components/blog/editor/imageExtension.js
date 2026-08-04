import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { isAllowedImageSrc } from '../../../features/blog/editorContent';
import EditorImageNodeView from './EditorImageNodeView';

/**
 * Extends the base Image node with an `align` attribute and a React node
 * view carrying alt-text/alignment/remove controls (see
 * EditorImageNodeView). Resizing is deliberately not enabled — only the
 * controls listed above are exposed.
 *
 * Security: `allowBase64: false` keeps `data:` URIs out of the parser's tag
 * selector entirely (so no base64 image can ever end up in stored HTML, per
 * upload/editor.php's contract of always returning a real uploaded URL).
 * `parseHTML` below adds a second, independent check — `isAllowedImageSrc`
 * — that also rejects `blob:`, `javascript:`, and any other non-http(s)
 * scheme, covering any `<img>` markup that arrives via pasted rich HTML
 * rather than through this editor's own upload flow.
 */
const ContentImage = Image.extend({
  name: 'image',

  addOptions() {
    return {
      ...this.parent?.(),
      allowBase64: false,
      HTMLAttributes: { loading: 'lazy' },
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-align') || 'left',
        renderHTML: (attributes) => ({ 'data-align': attributes.align }),
      },
    };
  },

  parseHTML() {
    return this.parent().map((rule) => ({
      ...rule,
      getAttrs: (element) => {
        if (!isAllowedImageSrc(element.getAttribute('src'))) return false;
        return typeof rule.getAttrs === 'function' ? rule.getAttrs(element) : null;
      },
    }));
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorImageNodeView);
  },
});

export default ContentImage;
