import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, Textarea } from '../../components/ui';
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

export function AnnouncementComments({ announcementId }: { announcementId: string }) {
  const { user, has } = usePermissions();
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    announcementsApi
      .listComments(announcementId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [announcementId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const comment = await announcementsApi.createComment(announcementId, draft.trim());
      setComments((prev) => [...prev, comment]);
      setDraft('');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    await announcementsApi.removeComment(announcementId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="border-border mt-6 border-t pt-4">
      <h3 className="mb-3 text-sm font-medium">
        Comments{comments.length > 0 && <span className="text-muted-foreground"> ({comments.length})</span>}
      </h3>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!loading && (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="group flex items-start gap-2.5">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="text-xs">{initials(c.author.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.author.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm break-words whitespace-pre-wrap">{c.text}</p>
              </div>
              {(c.author.id === user?.id || has('announcements:delete')) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handlePost} className="mt-3 flex items-start gap-2.5">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="text-xs">{user ? initials(user.name) : ''}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            className="min-h-[60px] text-sm"
          />
          <Button type="submit" size="sm" className="self-end" disabled={posting || !draft.trim()}>
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}
