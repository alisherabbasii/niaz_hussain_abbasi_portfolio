import { useEffect, useId, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extension-placeholder';
import { cn } from '../../../utils/cn';
import { isAllowedLinkUrl } from '../../../features/blog/editorContent';
import EditorToolbar from './EditorToolbar';

/**
 * Direct-child/descendant Tailwind selectors (not the `.prose` typography
 * plugin, which isn't installed in this project) mirroring the read-side
 * article styling in HtmlContent, scaled down for the editor's tighter box.
 */
const EDITOR_CONTENT_CLASSES = cn(
  'min-h-[16rem] px-4 py-3 text-sm text-slate-800 focus:outline-none',
  '[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-primary [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:first:mt-0',
  '[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-primary [&>h3]:mt-5 [&>h3]:mb-2.5 [&>h3]:first:mt-0',
  '[&>h4]:text-lg [&>h4]:font-bold [&>h4]:text-primary [&>h4]:mt-4 [&>h4]:mb-2 [&>h4]:first:mt-0',
  '[&>p]:leading-relaxed [&>p]:mb-3',
  '[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-3 [&>ul]:space-y-1',
  '[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-3 [&>ol]:space-y-1',
  '[&>blockquote]:border-l-4 [&>blockquote]:border-accent-strong/30 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-500 [&>blockquote]:my-3',
  '[&>hr]:my-6 [&>hr]:border-slate-200',
  '[&_a]:text-accent-strong [&_a]:underline [&_a]:underline-offset-4',
  '[&_strong]:text-primary [&_strong]:font-bold',
  '[&>table]:w-full [&>table]:my-4 [&>table]:border-collapse',
  '[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold',
  '[&_td]:border [&_td]:border-slate-200 [&_td]:px-2.5 [&_td]:py-1.5',
  '[&_td]:align-top [&_th]:align-top'
);

/**
 * Rich-text replacement for the plain content textarea. Content flows
 * one-way, up: `value` only seeds the editor at mount (see `initialValueRef`
 * below) — it is deliberately never fed back in afterwards, so neither the
 * form's own re-renders nor this component re-rendering ever reset the
 * document or move the cursor while someone is typing. `PostForm` only
 * mounts this component once the initial content (existing post HTML, or
 * '' for a new post) is already known, so "load existing HTML during edit"
 * falls out of that mount timing rather than needing an imperative update.
 */
export default function TiptapEditor({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  disabled = false,
  required = false,
}) {
  const generatedId = useId();
  const editorId = id ?? generatedId;
  const hintId = hint ? `${editorId}-hint` : undefined;
  const errorId = error ? `${editorId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // `content` below is only read on this first construction — the trailing
  // `[]` deps means useEditor never recreates the instance from later
  // `value` prop changes, which is what makes this safe to seed directly
  // from the prop instead of a ref.
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3, 4] },
          // Only the features listed in the toolbar are registered — strike,
          // code and codeBlock are part of StarterKit's defaults but weren't asked for.
          strike: false,
          code: false,
          codeBlock: false,
          link: {
            autolink: true,
            openOnClick: false,
            linkOnPaste: true,
            protocols: [{ scheme: 'tel', optionalSlashes: true }],
            HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
            // Authoritative XSS guard for the Link mark (autolink, paste, and
            // programmatic setLink) — restricts to http/https/mailto/tel
            // regardless of linkifyjs's own defaults.
            isAllowedUri: (url) => isAllowedLinkUrl(url),
          },
        }),
        TextAlign.configure({ types: ['heading', 'paragraph'], defaultAlignment: 'left' }),
        TableKit.configure({ table: { resizable: false } }),
        Placeholder.configure({ placeholder: 'Write the post content…' }),
      ],
      content: value ?? '',
      editable: !disabled,
      editorProps: {
        attributes: {
          id: editorId,
          class: EDITOR_CONTENT_CLASSES,
          'aria-multiline': 'true',
          'aria-label': label,
        },
      },
      onUpdate: ({ editor: instance }) => {
        onChangeRef.current(instance.isEmpty ? '' : instance.getHTML());
      },
    },
    []
  );

  // Editability and a11y attributes are kept in sync reactively via
  // setOptions — this only touches DOM attributes, never document content.
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          id: editorId,
          class: EDITOR_CONTENT_CLASSES,
          'aria-multiline': 'true',
          'aria-label': label,
          'aria-required': required ? 'true' : undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-describedby': describedBy,
        },
      },
    });
  }, [editor, editorId, label, required, error, describedBy]);

  return (
    <div>
      {label && (
        <label htmlFor={editorId} className="field-label">
          {label}
        </label>
      )}
      <div
        className={cn(
          'rounded-xl border border-slate-200 bg-white transition-all duration-200 overflow-hidden',
          'focus-within:border-accent-strong focus-within:ring-2 focus-within:ring-accent-strong/50',
          error && 'border-danger',
          disabled && 'opacity-60'
        )}
      >
        <EditorToolbar editor={editor} disabled={disabled} />
        <EditorContent editor={editor} />
      </div>
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
