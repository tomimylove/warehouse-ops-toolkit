import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Mic, Paperclip, SendHorizontal, Smile, Trash2, Type } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button, RichTextEditor, RichTextToolbar } from '../../components/ui';
import { usePermissions } from '../../app/PermissionsContext';
import { announcementsApi } from './api';
import type { AnnouncementComment } from './types';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const EMOJI = ['👍', '❤️', '😂', '🎉', '😮', '🙏', '👏', '🔥', '✅', '😊', '🤔', '👀'];

function ChatBubble({
  comment,
  own,
  canDelete,
  userId,
  onDelete,
  onToggleLike,
}: {
  comment: AnnouncementComment;
  own: boolean;
  canDelete: boolean;
  userId?: string;
  onDelete: () => void;
  onToggleLike: () => void;
}) {
  const liked = userId ? comment.likedBy.includes(userId) : false;

  return (
    <div className={cn('group mb-1 flex items-end gap-2', own && 'flex-row-reverse')}>
      <Avatar className="mb-5 size-7 shrink-0">
        <AvatarFallback className="text-xs">{initials(comment.author.name)}</AvatarFallback>
      </Avatar>
      <div className={cn('flex max-w-[72%] min-w-0 flex-col gap-1', own ? 'items-end' : 'items-start')}>
        {!own && <span className="text-muted-foreground px-1 text-xs font-medium">{comment.author.name}</span>}
        <div className="relative">
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2 text-sm break-words [&_a]:underline [&_p]:m-0 [&_p]:mb-1 [&_p:last-child]:mb-0',
              own ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm',
            )}
            dangerouslySetInnerHTML={{ __html: comment.text }}
          />
          {comment.likedBy.length > 0 && (
            <button
              type="button"
              onClick={onToggleLike}
              className={cn(
                'bg-background border-border absolute -bottom-2.5 flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] shadow-sm',
                own ? '-left-1.5' : '-right-1.5',
              )}
            >
              <Heart className={cn('size-2.5', liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground')} />
              {comment.likedBy.length}
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 px-1">
          <span className="text-muted-foreground text-[11px]">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          <button
            type="button"
            onClick={onToggleLike}
            className={cn(
              'text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100',
              comment.likedBy.length > 0 && 'hidden',
            )}
          >
            <Heart className={cn('size-3', liked && 'fill-red-500 text-red-500')} />
          </button>
          {canDelete && (
            <button type="button" onClick={onDelete} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementComments({ announcementId }: { announcementId: string }) {
  const { user, has } = usePermissions();
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [richOpen, setRichOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setComments([]);
    announcementsApi
      .listComments(announcementId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [announcementId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [comments.length]);

  function isEmpty(html: string) {
    return html.replace(/<[^>]+>/g, '').trim().length === 0;
  }

  const hasText = !isEmpty(draft);

  async function handlePost() {
    if (!hasText || posting) return;
    setPosting(true);
    try {
      const comment = await announcementsApi.createComment(announcementId, draft);
      setComments((prev) => [...prev, comment]);
      setDraft('');
      editor?.commands.clearContent();
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    await announcementsApi.removeComment(announcementId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  async function handleToggleLike(commentId: string) {
    const updated = await announcementsApi.toggleCommentLike(announcementId, commentId);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
  }

  function insertEmoji(emoji: string) {
    editor?.chain().focus().insertContent(emoji).run();
    setEmojiOpen(false);
  }

  return (
    <div className="border-border mt-6 border-t pt-4">
      <h3 className="mb-3 text-sm font-medium">
        Discussion{comments.length > 0 && <span className="text-muted-foreground"> ({comments.length})</span>}
      </h3>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!loading && (
        <div className="flex flex-col">
          {comments.map((c) => (
            <ChatBubble
              key={c.id}
              comment={c}
              own={c.author.id === user?.id}
              canDelete={c.author.id === user?.id || has('announcements:delete')}
              userId={user?.id}
              onDelete={() => handleDelete(c.id)}
              onToggleLike={() => handleToggleLike(c.id)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-1.5">
        {richOpen && editor && (
          <div className="border-input bg-popover rounded-lg border shadow-xs">
            <RichTextToolbar editor={editor} />
          </div>
        )}

        <div className="border-input focus-within:ring-ring/30 flex items-end gap-1 rounded-3xl border px-2 py-1.5 focus-within:ring-2">
          {!hasText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 rounded-full" disabled>
                  <Paperclip className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attachments — coming soon</TooltipContent>
            </Tooltip>
          )}

          <RichTextEditor
            value={draft}
            onChange={setDraft}
            placeholder="Write a message…"
            toolbar={false}
            bordered={false}
            minHeight="20px"
            resizable={false}
            className="min-w-0 flex-1"
            onEditorReady={setEditor}
            onSubmitKey={handlePost}
          />

          <Button
            type="button"
            variant={richOpen ? 'secondary' : 'ghost'}
            size="icon"
            className="size-7 shrink-0 rounded-full"
            onClick={() => setRichOpen((v) => !v)}
          >
            <Type className="size-3.5" />
          </Button>

          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 rounded-full">
                <Smile className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto" align="end">
              <div className="grid grid-cols-6 gap-1">
                {EMOJI.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="hover:bg-accent flex size-8 items-center justify-center rounded-md text-lg"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {hasText ? (
            <Button
              type="button"
              size="icon"
              className="size-7 shrink-0 rounded-full"
              onClick={handlePost}
              disabled={posting}
            >
              <SendHorizontal className="size-3.5" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 rounded-full" disabled>
                  <Mic className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice messages — coming soon</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
