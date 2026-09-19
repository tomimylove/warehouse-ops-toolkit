import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sm px-2 py-0.5 font-mono text-xs',
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {children}
    </button>
  );
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
      attributes: { class: 'min-h-[100px] px-3 py-2 outline-none text-sm [&_p]:m-0 [&_p]:mb-2' },
    },
  });

  if (!editor) return null;

  return (
    <div className="border-input bg-transparent relative rounded-md border shadow-xs">
      <div className="border-input flex gap-1 border-b px-2 py-1">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      {editor.isEmpty && placeholder && (
        <span className="text-muted-foreground pointer-events-none absolute top-11 left-3 text-sm">
          {placeholder}
        </span>
      )}
    </div>
  );
}
