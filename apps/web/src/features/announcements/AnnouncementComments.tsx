import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { formatDistanceToNow } from 'date-fns';
import { Mic, Paperclip, SendHorizontal, Smile, Trash2, Type } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button, RichTextEditor } from '../../components/ui';
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

export function AnnouncementComments({ announcementId }: { announcementId: string }) {
  const { user, has } = usePermissions();
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [richOpen, setRichOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const editorRef = useRef<Editor | null>(null);
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

  async function handlePost() {
    if (isEmpty(draft) || posting) return;
    setPosting(true);
    try {
      const comment = await announcementsApi.createComment(announcementId, draft);
      setComments((prev) => [...prev, comment]);
      setDraft('');
      editorRef.current?.commands.clearContent();
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    await announcementsApi.removeComment(announcementId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  function insertEmoji(emoji: string) {
    editorRef.current?.chain().focus().insertContent(emoji).run();
    setEmojiOpen(false);
  }

  return (
    <div className="border-border mt-6 border-t pt-4">
      <h3 className="mb-3 text-sm font-medium">
        Чат{comments.length > 0 && <span className="text-muted-foreground"> ({comments.length})</span>}
      </h3>

      {loading && <p className="text-muted-foreground text-sm">Загрузка…</p>}

      {!loading && (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => {
            const own = c.author.id === user?.id;
            return (
              <li key={c.id} className={`group flex items-end gap-2.5 ${own ? 'flex-row-reverse' : ''}`}>
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-xs">{initials(c.author.name)}</AvatarFallback>
                </Avatar>
                <div className={`flex min-w-0 max-w-[75%] flex-col gap-1 ${own ? 'items-end' : 'items-start'}`}>
                  {!own && <span className="text-muted-foreground px-1 text-xs font-medium">{c.author.name}</span>}
                  <div className="flex items-end gap-1.5">
                    {own && (c.author.id === user?.id || has('announcements:delete')) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm break-words [&_p]:m-0 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_a]:underline ${
                        own ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                      dangerouslySetInnerHTML={{ __html: c.text }}
                    />
                    {!own && (c.author.id === user?.id || has('announcements:delete')) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <span className="text-muted-foreground px-1 text-[11px]">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </li>
            );
          })}
          <div ref={bottomRef} />
        </ul>
      )}

      <div className="mt-3 flex items-start gap-2.5">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="text-xs">{user ? initials(user.name) : ''}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <RichTextEditor
            value={draft}
            onChange={setDraft}
            placeholder="Написать сообщение…"
            toolbar={richOpen}
            minHeight="20px"
            resizable={false}
            onEditorReady={(editor) => {
              editorRef.current = editor;
            }}
            onSubmitKey={handlePost}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={richOpen ? 'secondary' : 'ghost'}
                    size="icon"
                    className="size-7"
                    onClick={() => setRichOpen((v) => !v)}
                  >
                    <Type className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Форматирование текста</TooltipContent>
              </Tooltip>

              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-7">
                    <Smile className="size-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto" align="start">
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-7" disabled>
                    <Paperclip className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Вложения — скоро</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-7" disabled>
                    <Mic className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Голосовые сообщения — скоро</TooltipContent>
              </Tooltip>
            </div>

            <Button type="button" size="sm" onClick={handlePost} disabled={posting || isEmpty(draft)}>
              <SendHorizontal className="size-3.5" />
              Отправить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
