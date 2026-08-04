import { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { resolveUploadUrl } from '../../../api/uploadService';

const WRAPPER_ALIGN_CLASSES = {
  left: 'items-start',
  center: 'items-center',
  right: 'items-end',
};

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Align left', Icon: AlignLeft },
  { value: 'center', label: 'Align center', Icon: AlignCenter },
  { value: 'right', label: 'Align right', Icon: AlignRight },
];

/**
 * Node view for the editor's `image` node: renders the image plus (only
 * while selected and editable) a small controls bar for alt text,
 * alignment, and removal. The image itself always shows — controls appear
 * on demand so a content-heavy post doesn't turn into a wall of toolbars,
 * and "tap image to select" works the same on touch as it does on desktop.
 */
export default function EditorImageNodeView({ node, updateAttributes, deleteNode, selected, editor }) {
  const { src, alt, align } = node.attrs;

  // Local draft so typing doesn't dispatch a transaction on every keystroke
  // (committed onBlur instead) — resynced from the node's actual `alt`
  // whenever it changes from outside this input (e.g. undo/redo), following
  // the same "adjust state during render" pattern LinkDialog uses rather
  // than a useEffect, since this only needs to run before paint.
  const [altDraft, setAltDraft] = useState(alt ?? '');
  const [syncedAlt, setSyncedAlt] = useState(alt ?? '');
  if ((alt ?? '') !== syncedAlt) {
    setSyncedAlt(alt ?? '');
    setAltDraft(alt ?? '');
  }

  const editable = editor.isEditable;
  // `resolveUploadUrl` only makes sense for our own relative `/uploads/...`
  // paths; an absolute (e.g. externally pasted) src is used as-is.
  const displaySrc = src && src.startsWith('/') ? resolveUploadUrl(src) : src;

  return (
    <NodeViewWrapper className={cn('flex flex-col my-2', WRAPPER_ALIGN_CLASSES[align] ?? WRAPPER_ALIGN_CLASSES.left)}>
      <img
        src={displaySrc}
        alt={alt ?? ''}
        loading="lazy"
        className={cn(
          'max-w-full h-auto rounded-lg transition-shadow',
          selected && 'ring-2 ring-accent-strong ring-offset-2'
        )}
        data-drag-handle
      />
      {editable && selected && (
        <div
          className="flex flex-wrap items-center gap-1.5 mt-2 p-1.5 rounded-lg border border-slate-200 bg-white shadow-md max-w-full"
          contentEditable={false}
        >
          <input
            type="text"
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            onBlur={() => {
              if (altDraft !== (alt ?? '')) updateAttributes({ alt: altDraft });
            }}
            placeholder="Describe this image (alt text)"
            aria-label="Image alt text"
            className="flex-1 min-w-[8rem] text-xs px-2 py-1.5 rounded-md border border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-strong/50"
          />
          {ALIGN_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              title={label}
              aria-pressed={align === value}
              onClick={() => updateAttributes({ align: value })}
              className={cn(
                'inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary',
                align === value && 'bg-accent-strong/10 text-accent-strong'
              )}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            aria-label="Remove image"
            title="Remove image"
            onClick={() => deleteNode()}
            className="inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-md text-slate-500 transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
