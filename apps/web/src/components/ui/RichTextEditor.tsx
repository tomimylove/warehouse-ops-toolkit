import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Minimal rich-text field: bold/italic/lists/links — enough for an
// announcement body, not a full document editor. Swap StarterKit's
// extension list if a module needs more later.
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'rich-text-editor__content' },
    },
  });

  if (!editor) return null;

  return (
    <div className="rich-text-editor">
      <div className="rich-text-editor__toolbar">
        <button
          type="button"
          className={editor.isActive('bold') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          className={editor.isActive('italic') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
      </div>
      <EditorContent editor={editor} />
      {editor.isEmpty && placeholder && (
        <span className="rich-text-editor__placeholder">{placeholder}</span>
      )}
    </div>
  );
}
