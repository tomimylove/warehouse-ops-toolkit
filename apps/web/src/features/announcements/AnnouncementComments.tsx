import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Mic, MoreHorizontal, Paperclip, Pencil, Reply, SendHorizontal, SmilePlus, Trash2, Type, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { ChatBubble, ChatBubbleAction, ChatBubbleActionWrapper, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble';
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

function plainSnippet(html: string, max = 80) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function isEmptyHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').trim().length === 0;
}

const EMOJI = ['👍', '❤️', '😂', '🎉', '😮', '🙏', '👏', '🔥', '✅', '😊', '🤔', '👀'];
const MAX_REACTIONS_SHOWN = 4;

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

type ResolvedReactions = Record<string, { id: string; name: string }[]>;

function ReactorList({ entries }: { entries: [string, { id: string; name: string }[]][] }) {
  return (
    <div className="space-y-1">
      {entries.map(([emoji, users]) => (
        <div key={emoji} className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="text-xs">{users.map((u) => u.name).join(', ')}</span>
        </div>
      ))}
    </div>
  );
}

// One combined badge for the whole message — every distinct emoji used
// once each, plus a single total count (not a count per emoji, which
// read as cluttered) — embedded at the bubble's bottom-right corner.
// Only ~20% of the badge's height overlaps into the bubble (-bottom-4);
// the rest hangs below it, WhatsApp-style — the Bubble wrapper's mb-6
// leaves enough clearance for that overhang before the next message.
// Hover or click shows who reacted with what (not the emoji picker —
// adding your own reaction is the hover toolbar's React button).
function ReactionBar({
  reactions,
  onHoverChange,
}: {
  reactions: ResolvedReactions;
  onHoverChange: (hovering: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;

  const shownEmoji = entries.slice(0, MAX_REACTIONS_SHOWN).map(([emoji]) => emoji);
  const total = entries.reduce((sum, [, users]) => sum + users.length, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
        className="absolute -bottom-4 right-1"
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="bg-background flex items-center gap-1 rounded-full px-1.5 py-0.5 text-base shadow-sm"
                >
                  <motion.span key={total} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="leading-none">
                    {shownEmoji.join('')}
                  </motion.span>
                  <span className="text-muted-foreground text-xs">{total}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto" align="center">
                <ReactorList entries={entries} />
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent>
            <ReactorList entries={entries} />
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </AnimatePresence>
  );
}

function Bubble({
  comment,
  own,
  canDelete,
  onDelete,
  onEditRequest,
  onToggleReaction,
  onReply,
}: {
  comment: AnnouncementComment;
  own: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onEditRequest: () => void;
  onToggleReaction: (emoji: string) => void;
  onReply: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // CSS :hover can't be scoped to exclude a nested child's box — hovering
  // the reaction badge is still hovering the bubble's `.group`, which would
  // also pop up the reply/react/menu toolbar. Tracked separately and
  // force-hidden with `!opacity-0` (important, so it beats group-hover).
  const [reactionHover, setReactionHover] = useState(false);

  return (
    <div className={cn('mb-6 flex flex-col', own ? 'items-end' : 'items-start')}>
      <ChatBubble variant={own ? 'sent' : 'received'}>
        <ChatBubbleAvatar fallback={initials(comment.author.name)} />
        <div className="flex min-w-0 flex-col">
          {!own && <span className="text-muted-foreground mb-1 px-1 text-xs font-medium">{comment.author.name}</span>}
          <div className="relative">
            {comment.replyTo && (
              <div className="bg-muted border-primary/60 mb-1 rounded-md border-l-[3px] px-2.5 py-1.5 text-xs">
                <div className="text-primary font-medium">{comment.replyTo.author.name}</div>
                <div className="text-muted-foreground truncate">{plainSnippet(comment.replyTo.text, 60)}</div>
              </div>
            )}

            <ChatBubbleMessage
              variant={own ? 'sent' : 'received'}
              html={comment.text}
              meta={formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            />

            <ReactionBar reactions={comment.reactions} onHoverChange={setReactionHover} />

            <ChatBubbleActionWrapper
              className={cn((pickerOpen || menuOpen) && 'opacity-100', reactionHover && '!opacity-0')}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ChatBubbleAction icon={<Reply className="size-3.5" />} onClick={onReply} />
                </TooltipTrigger>
                <TooltipContent>Reply</TooltipContent>
              </Tooltip>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <ChatBubbleAction icon={<SmilePlus className="size-3.5" />} />
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>React</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-auto" align="center">
                  <EmojiGrid
                    onPick={(emoji) => {
                      onToggleReaction(emoji);
                      setPickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {(own || canDelete) && (
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <ChatBubbleAction icon={<MoreHorizontal className="size-3.5" />} />
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>More</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" sideOffset={4}>
                    {own && (
                      <DropdownMenuItem onClick={onEditRequest}>
                        <Pencil className="size-3.5" /> Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="size-3.5" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </ChatBubbleActionWrapper>
          </div>
        </div>
      </ChatBubble>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AnnouncementComments({ announcementId, className }: { announcementId: string; className?: string }) {
  const { user, has } = usePermissions();
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [richOpen, setRichOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [replyTo, setReplyTo] = useState<AnnouncementComment | null>(null);
  const [editingComment, setEditingComment] = useState<AnnouncementComment | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setComments([]);
    setReplyTo(null);
    setEditingComment(null);
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

  const hasText = !isEmptyHtml(draft);

  function scrollToBottom() {
    // Only called after the current user's own post/reply — opening an
    // announcement (or switching to one) should land on the discussion
    // header, not jump straight to the bottom of a long thread.
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ block: 'nearest' }));
  }

  function clearComposer() {
    setDraft('');
    editor?.commands.clearContent();
  }

  function startReply(comment: AnnouncementComment) {
    setEditingComment(null);
    setReplyTo(comment);
  }

  function startEdit(comment: AnnouncementComment) {
    setReplyTo(null);
    setEditingComment(comment);
    setDraft(comment.text);
    editor?.commands.setContent(comment.text);
  }

  function cancelEdit() {
    setEditingComment(null);
    clearComposer();
  }

  async function handleSubmit() {
    if (!hasText || posting) return;
    setPosting(true);
    try {
      if (editingComment) {
        const updated = await announcementsApi.updateComment(announcementId, editingComment.id, draft);
        setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setEditingComment(null);
      } else {
        const comment = await announcementsApi.createComment(announcementId, draft, replyTo?.id);
        setComments((prev) => [...prev, comment]);
        setReplyTo(null);
        scrollToBottom();
      }
      clearComposer();
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
    <div className={cn('border-border mt-6 border-t pt-4', className)}>
      <h3 className="mb-3 text-sm font-medium">
        Discussion{comments.length > 0 && <span className="text-muted-foreground"> ({comments.length})</span>}
      </h3>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!loading && (
        // Bottom padding roughly matches the composer's height, so the
        // sticky composer below doesn't sit directly on top of the last
        // message once you've scrolled all the way down.
        <div className="flex flex-col pb-16">
          {comments.map((c) => (
            <Bubble
              key={c.id}
              comment={c}
              own={c.author.id === user?.id}
              canDelete={c.author.id === user?.id || has('announcements:delete')}
              onDelete={() => handleDelete(c.id)}
              onEditRequest={() => startEdit(c)}
              onToggleReaction={(emoji) => handleToggleReaction(c.id, emoji)}
              onReply={() => startReply(c)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Sticky, not static — the composer (and the edit-in-composer flow)
          used to sit at the natural end of the thread, so on any real
          discussion you had to scroll all the way down to find it. Sticky
          keeps it pinned to the bottom of the page's scroll viewport
          (AnnouncementsPage's reader pane) regardless of thread length or
          scroll position, floating just above the messages beneath it. A
          solid background keeps it legible over whatever scrolls under it. */}
      <div className="bg-background sticky bottom-0 pb-2">
        {/* Single bordered container for the whole composer — the toolbar
            flyout and the icon row both live inside it, so nothing looks
            bolted on and nothing (send/mic included) pokes out past the
            border. */}
        <div className="border-input focus-within:border-ring overflow-hidden rounded-2xl border transition-colors">
        <AnimatePresence initial={false}>
          {(replyTo || editingComment) && (
            <motion.div
              key="context-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-input overflow-hidden border-b"
            >
              <div className="flex items-center gap-2 px-3 py-1.5">
                {editingComment ? <Pencil className="text-muted-foreground size-3.5 shrink-0" /> : <Reply className="text-muted-foreground size-3.5 shrink-0" />}
                <div className="min-w-0 flex-1 text-xs">
                  {editingComment ? (
                    <span className="font-medium">Editing message</span>
                  ) : (
                    <>
                      <span className="font-medium">Replying to {replyTo!.author.name}</span>
                      <span className="text-muted-foreground ml-1.5">{plainSnippet(replyTo!.text, 50)}</span>
                    </>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 rounded-full"
                      onClick={() => (editingComment ? cancelEdit() : setReplyTo(null))}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel</TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        <div className="flex items-end gap-0.5 px-1.5 py-1">
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
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 rounded-full" disabled>
                <Paperclip className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attachments — coming soon</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={richOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="size-8 shrink-0 rounded-full"
                onClick={() => setRichOpen((v) => !v)}
              >
                <Type className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Formatting</TooltipContent>
          </Tooltip>

          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 rounded-full">
                    <SmilePlus className="size-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Emoji</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto" align="end">
              <EmojiGrid onPick={insertEmoji} />
            </PopoverContent>
          </Popover>

          <AnimatePresence mode="wait" initial={false}>
            {hasText ? (
              <motion.div key="send" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" size="icon" className="size-8 shrink-0 rounded-full" onClick={handleSubmit} disabled={posting}>
                      <SendHorizontal className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{editingComment ? 'Save' : 'Send'}</TooltipContent>
                </Tooltip>
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
    </div>
  );
}
