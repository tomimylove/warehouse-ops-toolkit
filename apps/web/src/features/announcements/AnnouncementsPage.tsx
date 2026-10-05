import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { History, MoreHorizontal, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { announcementsApi } from './api';
import { usePermissions } from '../../app/PermissionsContext';
import { Button, EmptyState, PageHeader } from '../../components/ui';
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
import { AnnouncementComposer } from './AnnouncementComposer';
import { AnnouncementHistory } from './AnnouncementHistory';
import type { Announcement } from './types';

const INLINE_TEAM_TABS = 4;

export function AnnouncementsPage() {
  const { has } = usePermissions();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
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
      if (selectedId && !list.some((a) => a.id === selectedId)) setSelectedId(null);
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

  const filtered = teamFilter ? items.filter((a) => a.teams.some((t) => t.id === teamFilter)) : items;
  const unreadCount = items.filter((a) => !a.isRead).length;
  const selected = items.find((a) => a.id === selectedId) ?? null;

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

  async function handleTogglePin(item: Announcement) {
    const updated = await announcementsApi.update(item.id, { pinned: !item.pinned });
    setItems((prev) => prev.map((a) => (a.id === item.id ? updated : a)));
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

  const inlineTeams = teams.slice(0, INLINE_TEAM_TABS);
  const overflowTeams = teams.slice(INLINE_TEAM_TABS);

  return (
    <section className="flex h-full flex-col">
      <PageHeader title="Announcements" subtitle="What the team needs to know, in one place." />

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

        <div className="ml-auto flex items-center gap-2">
          {unreadCount > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
          {has('announcements:create') && (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              New announcement
            </Button>
          )}
        </div>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState message="No announcements yet — publish the first one above." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-4">
          <ul className="flex flex-col gap-1 overflow-y-auto">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => select(item)}
                  className={`hover:bg-accent flex w-full flex-col gap-0.5 rounded-md border p-2.5 text-left ${
                    item.id === selectedId ? 'border-primary bg-accent' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    {!item.isRead && <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />}
                    {item.pinned && <Pin className="text-muted-foreground mt-0.5 size-3 shrink-0" />}
                    <span className={`truncate text-sm ${item.isRead ? 'font-normal' : 'font-medium'}`}>{item.title}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="min-h-0 overflow-y-auto rounded-md border">
            {!selected ? (
              <div className="flex h-full items-center justify-center p-8">
                <EmptyState message="Select an announcement to read." />
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{selected.title}</h2>
                  <div className="flex shrink-0 gap-1">
                    {has('announcements:edit') && (
                      <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)} title="History">
                        <History />
                      </Button>
                    )}
                    {has('announcements:pin') && (
                      <Button variant="ghost" size="icon" onClick={() => handleTogglePin(selected)}>
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

                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span>{formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}</span>
                  {!selected.visibleToAll &&
                    selected.teams.map((t) => (
                      <span key={t.id} className="bg-muted rounded-full px-2 py-0.5">
                        {t.name}
                      </span>
                    ))}
                </div>

                {/* Tiptap output is our own sanitized rich text — safe to render.
                    If this ever accepts arbitrary user HTML from elsewhere, sanitize first. */}
                <div className="mt-4 text-sm [&_p]:m-0 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: selected.body }} />
              </div>
            )}
          </div>
        </div>
      )}

      <AnnouncementComposer open={composerOpen} onOpenChange={setComposerOpen} editing={editing} onSaved={load} />

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
