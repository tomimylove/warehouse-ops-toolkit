import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Mic, Paperclip, SendHorizontal, Smile, Trash2, Type } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from '@/components/ui/chat-bubble';
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

function LikePill({ liked, count, onClick }: { liked: boolean; count: number; onClick: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
          className="bg-background border-border flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] shadow-sm"
        >
          <motion.span key={count} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="flex items-center gap-0.5">
            <Heart className={cn('size-2.5', liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground')} />
            {count}
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Bubble({
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
    <div className={cn('mb-3 flex flex-col', own ? 'items-end' : 'items-start')}>
      <ChatBubble variant={own ? 'sent' : 'received'}>
        <ChatBubbleAvatar fallback={initials(comment.author.name)} />
        <div className="flex min-w-0 flex-col">
          {!own && <span className="text-muted-foreground mb-1 px-1 text-xs font-medium">{comment.author.name}</span>}
          <div className="relative">
            <ChatBubbleMessage variant={own ? 'sent' : 'received'} html={comment.text} />
            <div className={cn('absolute -bottom-2.5', own ? '-left-1.5' : '-right-1.5')}>
              <LikePill liked={liked} count={comment.likedBy.length} onClick={onToggleLike} />
            </div>
          </div>
          <ChatBubbleActionWrapper variant={own ? 'sent' : 'received'}>
            <ChatBubbleAction icon={<Heart className={cn('size-3.5', liked && 'fill-red-500 text-red-500')} />} onClick={onToggleLike} />
            {canDelete && <ChatBubbleAction icon={<Trash2 className="size-3.5" />} onClick={onDelete} />}
          </ChatBubbleActionWrapper>
        </div>
      </ChatBubble>
      <ChatBubbleTimestamp
        timestamp={formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        className={cn(comment.likedBy.length > 0 && 'mt-2.5', own ? 'mr-9' : 'ml-9')}
      />
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
            <Bubble
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

      <div className="mt-2 flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {richOpen && editor && (
            <motion.div
              key="toolbar"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-input bg-popover overflow-hidden rounded-lg border shadow-xs"
            >
              <RichTextToolbar editor={editor} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-1">
          <AnimatePresence initial={false}>
            {!hasText && (
              <motion.div
                key="attach"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 rounded-full" disabled>
                      <Paperclip className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attachments — coming soon</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-input focus-within:border-ring relative min-w-0 flex-1 rounded-3xl border transition-colors">
            <RichTextEditor
              value={draft}
              onChange={setDraft}
              placeholder="Write a message…"
              toolbar={false}
              bordered={false}
              minHeight="20px"
              resizable={false}
              contentClassName="pr-16"
              onEditorReady={setEditor}
              onSubmitKey={handlePost}
            />
            <div className="absolute right-1.5 bottom-1 flex items-center gap-0.5">
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
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {hasText ? (
              <motion.div key="send" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                <Button type="button" size="icon" className="size-8 shrink-0 rounded-full" onClick={handlePost} disabled={posting}>
                  <SendHorizontal className="size-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div key="mic" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 rounded-full" disabled>
                      <Mic className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice messages — coming soon</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
