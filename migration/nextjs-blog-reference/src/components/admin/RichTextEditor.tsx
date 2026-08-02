"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3 } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const toggleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  const btnClass = (isActive: boolean) =>
    `p-2 rounded-lg transition-all border ${
      isActive 
      ? 'bg-primary text-white border-primary shadow-sm' 
      : 'bg-white text-secondary/70 border-gray-100 hover:border-primary/30 hover:text-primary'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
      <button
        onClick={(e) => toggleAction(e, () => editor.chain().focus().toggleBold().run())}
        className={btnClass(editor.isActive('bold'))}
      >
        <Bold size={16} />
      </button>
      <button
        onClick={(e) => toggleAction(e, () => editor.chain().focus().toggleItalic().run())}
        className={btnClass(editor.isActive('italic'))}
      >
        <Italic size={16} />
      </button>
      <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
      <button
        onClick={(e) => toggleAction(e, () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={(e) => toggleAction(e, () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
      >
        <Heading3 size={16} />
      </button>
      <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
      <button
        onClick={(e) => toggleAction(e, () => editor.chain().focus().toggleBulletList().run())}
        className={btnClass(editor.isActive('bulletList'))}
      >
        <List size={16} />
      </button>
      <button
        onClick={(e) => toggleAction(e, () => editor.chain().focus().toggleOrderedList().run())}
        className={btnClass(editor.isActive('orderedList'))}
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={(e) => toggleAction(e, () => editor.chain().focus().toggleBlockquote().run())}
        className={btnClass(editor.isActive('blockquote'))}
      >
        <Quote size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none max-w-none text-secondary/80 min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep content synced if it changes externally (like loading initial data)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Small timeout to prevent cyclic updates
      setTimeout(() => {
        editor.commands.setContent(content);
      }, 0);
    }
  }, [content, editor]);

  return (
    <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
      <MenuBar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
