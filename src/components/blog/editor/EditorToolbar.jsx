import { useState } from 'react';
import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Columns3,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Rows3,
  Table2,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import LinkDialog from './LinkDialog';

const ToolbarButton = ({ label, icon: Icon, active, disabled, onClick }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={cn(
      'inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 transition-colors',
      'hover:bg-slate-100 hover:text-primary disabled:opacity-40 disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong/50',
      active && 'bg-accent-strong/10 text-accent-strong'
    )}
  >
    <Icon size={16} aria-hidden="true" />
  </button>
);

const ToolbarPillButton = ({ label, icon: Icon, text, disabled, onClick }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium text-slate-500 transition-colors',
      'hover:bg-slate-100 hover:text-primary disabled:opacity-40 disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong/50'
    )}
  >
    <Icon size={13} aria-hidden="true" />
    {text}
  </button>
);

const Divider = () => <span className="w-px h-6 bg-slate-200 mx-0.5 shrink-0" aria-hidden="true" />;

/** Toolbar for TiptapEditor — flex-wraps for mobile rather than relying on horizontal scroll. */
export default function EditorToolbar({ editor, disabled }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor;
      if (!e) return null;
      return {
        paragraph: e.isActive('paragraph'),
        h2: e.isActive('heading', { level: 2 }),
        h3: e.isActive('heading', { level: 3 }),
        h4: e.isActive('heading', { level: 4 }),
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        blockquote: e.isActive('blockquote'),
        link: e.isActive('link'),
        alignLeft: e.isActive({ textAlign: 'left' }),
        alignCenter: e.isActive({ textAlign: 'center' }),
        alignRight: e.isActive({ textAlign: 'right' }),
        alignJustify: e.isActive({ textAlign: 'justify' }),
        inTable: e.isActive('table'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        canUnlink: e.can().unsetLink(),
      };
    },
  });

  if (!editor || !state) return null;

  const disabledAll = disabled;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50/60">
      <ToolbarButton
        label="Paragraph"
        icon={Pilcrow}
        active={state.paragraph}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <ToolbarButton
        label="Heading 2"
        icon={Heading2}
        active={state.h2}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="Heading 3"
        icon={Heading3}
        active={state.h3}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label="Heading 4"
        icon={Heading4}
        active={state.h4}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      />

      <Divider />

      <ToolbarButton
        label="Bold"
        icon={Bold}
        active={state.bold}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        icon={Italic}
        active={state.italic}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Underline"
        icon={Underline}
        active={state.underline}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />

      <Divider />

      <ToolbarButton
        label="Bullet list"
        icon={List}
        active={state.bulletList}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbered list"
        icon={ListOrdered}
        active={state.orderedList}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Blockquote"
        icon={Quote}
        active={state.blockquote}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />

      <Divider />

      <ToolbarButton
        label="Align left"
        icon={AlignLeft}
        active={state.alignLeft}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      />
      <ToolbarButton
        label="Align center"
        icon={AlignCenter}
        active={state.alignCenter}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      />
      <ToolbarButton
        label="Align right"
        icon={AlignRight}
        active={state.alignRight}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      />
      <ToolbarButton
        label="Justify"
        icon={AlignJustify}
        active={state.alignJustify}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      />

      <Divider />

      <ToolbarButton
        label="Insert link"
        icon={Link2}
        active={state.link}
        disabled={disabledAll}
        onClick={() => setLinkDialogOpen(true)}
      />
      <ToolbarButton
        label="Remove link"
        icon={Link2Off}
        disabled={disabledAll || !state.canUnlink}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
      <ToolbarButton
        label="Horizontal rule"
        icon={Minus}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <ToolbarButton
        label="Insert table"
        icon={Table2}
        disabled={disabledAll}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />

      <Divider />

      <ToolbarButton
        label="Undo"
        icon={Undo2}
        disabled={disabledAll || !state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label="Redo"
        icon={Redo2}
        disabled={disabledAll || !state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />

      {state.inTable && (
        <>
          <div className="basis-full h-0" aria-hidden="true" />
          <div className="flex flex-wrap items-center gap-0.5 pt-1 mt-1 border-t border-slate-200 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Table</span>
            <ToolbarPillButton
              label="Add column after"
              icon={Columns3}
              text="+Col"
              disabled={disabledAll}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            />
            <ToolbarPillButton
              label="Delete column"
              icon={Trash2}
              text="Col"
              disabled={disabledAll}
              onClick={() => editor.chain().focus().deleteColumn().run()}
            />
            <ToolbarPillButton
              label="Add row after"
              icon={Rows3}
              text="+Row"
              disabled={disabledAll}
              onClick={() => editor.chain().focus().addRowAfter().run()}
            />
            <ToolbarPillButton
              label="Delete row"
              icon={Trash2}
              text="Row"
              disabled={disabledAll}
              onClick={() => editor.chain().focus().deleteRow().run()}
            />
            <ToolbarPillButton
              label="Delete table"
              icon={Trash2}
              text="Table"
              disabled={disabledAll}
              onClick={() => editor.chain().focus().deleteTable().run()}
            />
          </div>
        </>
      )}

      <LinkDialog editor={editor} open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} />
    </div>
  );
}
