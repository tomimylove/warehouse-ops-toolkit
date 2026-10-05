import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Mic, Paperclip, SendHorizontal, SmilePlus, Trash2, Type } from 'lucide-react';
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
const MAX_REACTIONS_SHOWN = 3;

function EmojiGrid({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="hover:bg-accent flex size-8 items-center justify-center rounded-md text-lg"
          onClick={() => onPick(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// A single pill housing every reaction on the comment (grouped by emoji,
// each with its own count), not one pill per emoji — matches the
// Discord/YouGile-style reaction bar, not a bare like counter.
function ReactionBar({
  reactions,
  userId,
  own,
  onToggle,
}: {
  reactions: Record<string, string[]>;
  userId?: string;
  own: boolean;
  onToggle: (emoji: string) => void;
}) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  const shown = entries.slice(0, MAX_REACTIONS_SHOWN);
  const extra = entries.length - shown.length;

  return (
    <AnimatePresence>
      {entries.length > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
          className={cn('bg-background border-border absolute -bottom-3 flex items-center gap-1 rounded-full border px-1.5 py-0.5 shadow-sm', own ? 'left-1.5' : 'right-1.5')}
        >
          {shown.map(([emoji, users]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onToggle(emoji)}
              className={cn('flex items-center gap-0.5 rounded-full px-0.5 text-xs', userId && users.includes(userId) && 'bg-primary/10')}
            >
              <motion.span key={users.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
                {emoji}
              </motion.span>
              <span className="text-muted-foreground text-[10px]">{users.length}</span>
            </button>
          ))}
          {extra > 0 && <span className="text-muted-foreground px-0.5 text-[10px]">+{extra}</span>}
        </motion.div>
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
  onToggleReaction,
}: {
  comment: AnnouncementComment;
  own: boolean;
  canDelete: boolean;
  userId?: string;
  onDelete: () => void;
  onToggleReaction: (emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className={cn('mb-4 flex flex-col', own ? 'items-end' : 'items-start')}>
      <ChatBubble variant={own ? 'sent' : 'received'}>
        <ChatBubbleAvatar fallback={initials(comment.author.name)} />
        <div className="flex min-w-0 flex-col">
          {!own && <span className="text-muted-foreground mb-1 px-1 text-xs font-medium">{comment.author.name}</span>}
          <div className="relative">
            <ChatBubbleMessage variant={own ? 'sent' : 'received'} html={comment.text} />
            <ReactionBar reactions={comment.reactions} userId={userId} own={own} onToggle={onToggleReaction} />
          </div>
          <ChatBubbleActionWrapper variant={own ? 'sent' : 'received'}>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <ChatBubbleAction icon={<SmilePlus className="size-3.5" />} />
              </PopoverTrigger>
              <PopoverContent className="w-auto" align="center">
                <EmojiGrid
                  onPick={(emoji) => {
                    onToggleReaction(emoji);
                    setPickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {canDelete && <ChatBubbleAction icon={<Trash2 className="size-3.5" />} onClick={onDelete} />}
          </ChatBubbleActionWrapper>
        </div>
      </ChatBubble>
      <ChatBubbleTimestamp
        timestamp={formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        className={cn(Object.keys(comment.reactions).length > 0 && 'mt-2.5', own ? 'mr-9' : 'ml-9')}
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

  async function handleToggleReaction(commentId: string, emoji: string) {
    const updated = await announcementsApi.toggleCommentReaction(announcementId, commentId, emoji);
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
              onToggleReaction={(emoji) => handleToggleReaction(c.id, emoji)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Single bordered container for the whole composer — the toolbar flyout
          and the icon row both live inside it, so nothing looks bolted on
          and nothing (send/mic included) pokes out past the border. */}
      <div className="border-input focus-within:border-ring mt-3 overflow-hidden rounded-2xl border transition-colors">
        <AnimatePresence initial={false}>
          {richOpen && editor && (
            <motion.div
              key="toolbar"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-input overflow-hidden border-b"
            >
              <RichTextToolbar editor={editor} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-0.5 px-1.5 py-1">
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

          <RichTextEditor
            value={draft}
            onChange={setDraft}
            placeholder="Write a message…"
            toolbar={false}
            bordered={false}
            minHeight="20px"
            resizable={false}
            className="min-w-0 flex-1"
            contentClassName="px-2 py-1"
            onEditorReady={setEditor}
            onSubmitKey={handlePost}
          />

          <Button
            type="button"
            variant={richOpen ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8 shrink-0 rounded-full"
            onClick={() => setRichOpen((v) => !v)}
          >
            <Type className="size-4" />
          </Button>

          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 rounded-full">
                <SmilePlus className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto" align="end">
              <EmojiGrid onPick={insertEmoji} />
            </PopoverContent>
          </Popover>

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
