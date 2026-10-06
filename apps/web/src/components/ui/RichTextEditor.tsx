import { useEffect, useState } from 'react';
import * as React from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  SquareCode,
  Underline as UnderlineIcon,
  Undo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  toolbar?: boolean;
  bordered?: boolean;
  minHeight?: string;
  resizable?: boolean;
  autofocus?: boolean;
  className?: string;
  contentClassName?: string;
  onEditorReady?: (editor: Editor | null) => void;
  onSubmitKey?: () => void;
}

// forwardRef + spreading ...rest is required here, not cosmetic — Radix's
// `asChild` (used by the Link button's Popover trigger) clones this element
// and merges its own ref/aria/data-state props onto it. Without forwarding
// those through to the real <button>, Radix has no anchor element to
// position the popover against, so the Popover silently fails to render
// instead of just being mispositioned — that's what broke the Link button.
const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    title: string;
  }
>(({ active, disabled, title, children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      title={title}
      disabled={disabled}
      className={cn(
        'flex size-7 items-center justify-center rounded-sm',
        disabled
          ? 'text-muted-foreground/40'
          : active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
ToolbarButton.displayName = 'ToolbarButton';

function ToolbarSeparator() {
  return <div className="bg-border mx-0.5 w-px self-stretch" />;
}

// Shared formatting row — used both as the built-in toolbar of a bordered
// RichTextEditor and standalone (e.g. the chat composer's "Aa" flyout,
// which needs the toolbar detached from the input pill it sits above).
export function RichTextToolbar({ editor, className }: { editor: Editor; className?: string }) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  function applyLink() {
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkPopoverOpen(false);
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-0.5 px-1.5 py-1', className)}>
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="size-3.5" />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="size-3.5" />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-3.5" />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <SquareCode className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="size-3.5" />
      </ToolbarButton>
      <ToolbarSeparator />
      <Popover
        open={linkPopoverOpen}
        onOpenChange={(open) => {
          setLinkPopoverOpen(open);
          if (open) setLinkUrl(editor.getAttributes('link').href ?? '');
        }}
      >
        <PopoverTrigger asChild>
          <ToolbarButton title="Link" active={editor.isActive('link')}>
            <LinkIcon className="size-3.5" />
          </ToolbarButton>
        </PopoverTrigger>
        {/* Radix portals this to <body>, so it isn't clipped by a Sheet's
            or scroll container's overflow the way the old absolute-div
            version was. */}
        <PopoverContent className="flex w-auto gap-1 p-1" align="start">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') setLinkPopoverOpen(false);
            }}
            placeholder="https://…"
            className="h-7 w-48 rounded-sm border-none bg-transparent px-1.5 text-xs outline-none"
          />
          <button type="button" onClick={applyLink} className="bg-primary text-primary-foreground rounded-sm px-2 text-xs">
            Apply
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Shared with every place that renders saved Tiptap HTML read-only
// (ChatBubbleMessage, the announcement detail view) — those use
// dangerouslySetInnerHTML with their own class lists that never had list or
// code-block styling, so bullet/numbered lists rendered with no
// list-style/indent (looked broken) and <pre> kept the browser's default
// white-space: pre (no wrap), collapsing code blocks onto one long line.
export const richTextContentClass =
  '[&_p]:m-0 [&_p]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-2 [&_pre]:text-xs [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-1';

// Everyday rich-text field: headings, formatting marks, lists, quotes,
// code blocks, links, undo/redo — enough for an announcement body without
// turning into a full document editor (no tables/images/embeds).
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  toolbar = true,
  bordered = true,
  minHeight = '160px',
  resizable = true,
  autofocus = false,
  className,
  contentClassName,
  onEditorReady,
  onSubmitKey,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    autofocus,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}`,
        class: cn('px-3 py-2 outline-none text-sm', richTextContentClass, contentClassName),
      },
      handleKeyDown: (_view, event) => {
        if (onSubmitKey && event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSubmitKey();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  if (!editor) return null;

  return (
    <div className={cn(bordered && 'border-input bg-transparent flex flex-col rounded-md border shadow-xs', className)}>
      {toolbar && <RichTextToolbar editor={editor} className="border-input border-b" />}
      {/* resize-y + overflow-auto gives the browser's native drag handle. */}
      <div className={cn('overflow-auto', resizable && 'resize-y')}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
