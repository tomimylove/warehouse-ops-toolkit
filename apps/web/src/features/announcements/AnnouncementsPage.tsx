import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { History, MoreHorizontal, PartyPopper, Pencil, Pin, PinOff, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { announcementsApi } from './api';
import { coverFor } from './covers';
import { usePermissions } from '../../app/PermissionsContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { richTextContentClass } from '@/components/ui/RichTextEditor';
import { Button, EmptyState, Input, PageHeader } from '../../components/ui';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AnnouncementComments } from './AnnouncementComments';
import { AnnouncementComposer } from './AnnouncementComposer';
import { AnnouncementHistory } from './AnnouncementHistory';
import type { Announcement } from './types';

const INLINE_TEAM_TABS = 4;

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AnnouncementsPage() {
  const { has } = usePermissions();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await announcementsApi.list();
      setItems(list);
      setSelectedId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        // Nothing selected (or the selection vanished) — default to the
        // oldest unread one, so working through the backlog starts at the
        // start of it. If everything's already read, leave nothing selected
        // rather than reopening the newest — the reader pane shows an
        // "all caught up" state instead.
        const unread = [...list].filter((a) => !a.isRead).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return unread[0]?.id ?? null;
      });
    } catch {
      setError('Could not load announcements. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teams = useMemo(() => {
    const byId = new Map<string, string>();
    for (const item of items) for (const team of item.teams) byId.set(team.id, team.name);
    return Array.from(byId, ([id, name]) => ({ id, name }));
  }, [items]);

  const filtered = useMemo(() => {
    const byTeam = teamFilter ? items.filter((a) => a.teams.some((t) => t.id === teamFilter)) : items;
    const q = query.trim().toLowerCase();
    if (!q) return byTeam;
    return byTeam.filter(
      (a) => a.title.toLowerCase().includes(q) || plainText(a.body).toLowerCase().includes(q) || a.author.name.toLowerCase().includes(q),
    );
  }, [items, teamFilter, query]);
  const unreadCount = items.filter((a) => !a.isRead).length;
  const selected = items.find((a) => a.id === selectedId) ?? null;
  const readerRef = useRef<HTMLDivElement>(null);

  // Switching announcements shouldn't carry over the previous one's scroll
  // position — always land back on the title/body, not mid-thread.
  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);

  async function select(item: Announcement) {
    setSelectedId(item.id);
    if (!item.isRead) {
      await announcementsApi.markRead(item.id);
      setItems((prev) => prev.map((a) => (a.id === item.id ? { ...a, isRead: true } : a)));
    }
  }

  async function handleMarkAllRead() {
    await announcementsApi.markAllRead();
    setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
  }

  async function setPinned(item: Announcement, pinned: boolean, { announceUndo = true } = {}) {
    const updated = await announcementsApi.update(item.id, { pinned });
    setItems((prev) => prev.map((a) => (a.id === item.id ? updated : a)));
    if (announceUndo) {
      toast(pinned ? 'Pinned' : 'Unpinned', {
        description: `"${item.title}" ${pinned ? 'now shows at the top of the feed.' : 'no longer shows at the top.'}`,
        action: { label: 'Undo', onClick: () => setPinned(updated, !pinned, { announceUndo: false }) },
      });
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    await announcementsApi.remove(deleting.id);
    if (selectedId === deleting.id) setSelectedId(null);
    setDeleting(null);
    load();
  }

  function openCreate() {
    setEditing(null);
    setComposerOpen(true);
  }

  function openEdit(item: Announcement) {
    setEditing(item);
    setComposerOpen(true);
  }

  function handleSaved(saved: Announcement, wasEditing: boolean) {
    toast(wasEditing ? 'Announcement updated' : 'Announcement published', {
      description: `"${saved.title}" ${wasEditing ? 'has been updated.' : 'is now live in the feed.'}`,
    });
    load();
  }

  const inlineTeams = teams.slice(0, INLINE_TEAM_TABS);
  const overflowTeams = teams.slice(INLINE_TEAM_TABS);

  return (
    <section className="mx-auto flex h-full w-full max-w-[1360px] flex-col">
      <PageHeader
        title="Announcements"
        subtitle="What the team needs to know, in one place."
        action={
          has('announcements:create') && (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              New announcement
            </Button>
          )
        }
      />

      {/* Reserved for the HSE-incidents "stories" ribbon (specs ported from
          the HSE widgets spec) — not built yet, placeholder keeps the slot
          and layout stable for when it lands. */}
      <div className="border-border mb-4 flex items-center gap-3 rounded-md border border-dashed px-3 py-2">
        <span className="text-muted-foreground text-xs font-medium">Stories</span>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-muted size-8 shrink-0 rounded-full" />
          ))}
        </div>
        <span className="text-muted-foreground ml-auto text-xs">Coming soon</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={teamFilter === null ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTeamFilter(null)}
        >
          All
        </Button>
        {inlineTeams.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={teamFilter === t.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTeamFilter(t.id)}
          >
            {t.name}
          </Button>
        ))}
        {overflowTeams.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {overflowTeams.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => setTeamFilter(t.id)}>
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {unreadCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        ) : (
          items.length > 0 && <span className="text-muted-foreground ml-auto text-xs">All caught up ✓</span>
        )}
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          message={
            items.length === 0
              ? 'No announcements yet — publish the first one above.'
              : 'No announcements match your search.'
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,720px)_280px] gap-4">
          <div className="flex min-h-0 flex-col gap-2">
            <div className="relative shrink-0">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search announcements…"
                className="h-8 pr-7 pl-8 text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-full"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1 overflow-y-auto">
              {filtered.map((item) => {
              const cover = coverFor(item.id, item.coverId);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => select(item)}
                    className={`flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors ${
                      item.id === selectedId ? 'bg-muted' : 'hover:bg-muted/60'
                    }`}
                  >
                    <div className="size-10 shrink-0 rounded-md" style={{ background: cover.gradient }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1.5">
                        {!item.isRead && <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />}
                        {item.pinned && <Pin className="text-muted-foreground mt-0.5 size-3 shrink-0" />}
                        <span className={`truncate text-sm ${item.isRead ? 'font-normal' : 'font-medium'}`}>
                          {item.title}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                        <Avatar className="size-4">
                          <AvatarFallback className="text-[9px]">{initials(item.author.name)}</AvatarFallback>
                        </Avatar>
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
              })}
            </ul>
          </div>

          <div className="min-h-0 overflow-y-auto" ref={readerRef}>
            {selected ? (
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-xs">{initials(selected.author.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{selected.author.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
                    </span>
                    {!selected.visibleToAll &&
                      selected.teams.map((t) => (
                        <span key={t.id} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                          {t.name}
                        </span>
                      ))}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {has('announcements:edit') && (
                      <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)} title="History">
                        <History />
                      </Button>
                    )}
                    {has('announcements:pin') && (
                      <Button variant="ghost" size="icon" onClick={() => setPinned(selected, !selected.pinned)}>
                        {selected.pinned ? <PinOff /> : <Pin />}
                      </Button>
                    )}
                    {has('announcements:edit') && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(selected)}>
                        <Pencil />
                      </Button>
                    )}
                    {has('announcements:delete') && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(selected)}>
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>

                <div
                  className="mt-4 h-32 w-full rounded-md"
                  style={{ background: coverFor(selected.id, selected.coverId).gradient }}
                />

                {/* Tiptap output is our own sanitized rich text — safe to render.
                    If this ever accepts arbitrary user HTML from elsewhere, sanitize first. */}
                <div className={`mt-4 text-sm ${richTextContentClass}`} dangerouslySetInnerHTML={{ __html: selected.body }} />

                <AnnouncementComments announcementId={selected.id} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="bg-muted flex size-16 items-center justify-center rounded-full">
                  <PartyPopper className="text-muted-foreground size-7" />
                </div>
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-muted-foreground max-w-56 text-xs">
                  You've read every announcement. New ones will show up here.
                </p>
              </div>
            )}
          </div>

          {/* Reserved for the HSE-topics / Quick-links widget column
              (specs/features/14-widgets-hse.md) — same 280px width the
              original spec used. Not built yet. */}
          <div className="border-border flex flex-col gap-2 rounded-md border border-dashed p-3">
            <span className="text-muted-foreground text-xs font-medium">Widgets</span>
            <div className="bg-muted h-20 rounded-md" />
            <div className="bg-muted h-20 rounded-md" />
            <span className="text-muted-foreground text-xs">Coming soon</span>
          </div>
        </div>
      )}

      <AnnouncementComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        editing={editing}
        onSaved={(saved) => handleSaved(saved, editing !== null)}
      />

      {selected && (
        <AnnouncementHistory
          announcementId={selected.id}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onRestored={load}
        />
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" will be removed for everyone. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
