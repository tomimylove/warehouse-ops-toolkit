import { useEffect, useState } from 'react';
import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { dataProvider } from '../../lib/provider';
import { usePermissions } from '../../app/PermissionsContext';
import { Button, Card, CardContent, EmptyState, Input, PageHeader, RichTextEditor } from '../../components/ui';
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Announcement } from './types';

export function AnnouncementsPage() {
  const { has } = usePermissions();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [editing, setEditing] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await dataProvider.list<Announcement>('announcements'));
    } catch {
      setError('Could not load announcements. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await dataProvider.create<Announcement>('announcements', { title, body });
    setTitle('');
    setBody('');
    load();
  }

  function openEdit(item: Announcement) {
    setEditing(item);
    setEditTitle(item.title);
    setEditBody(item.body);
  }

  async function handleEditSave() {
    if (!editing) return;
    await dataProvider.update<Announcement>('announcements', editing.id, {
      title: editTitle,
      body: editBody,
    });
    setEditing(null);
    load();
  }

  async function handleTogglePin(item: Announcement) {
    await dataProvider.update<Announcement>('announcements', item.id, { pinned: !item.pinned });
    load();
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    await dataProvider.remove('announcements', deleting.id);
    setDeleting(null);
    load();
  }

  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader title="Announcements" subtitle="What the team needs to know, in one place." />

      {has('announcements:create') && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <RichTextEditor value={body} onChange={setBody} placeholder="What's the announcement?" />
              <Button type="submit">Publish</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground mt-4 text-sm">Loading…</p>}
      {error && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mt-4">
          <EmptyState message="No announcements yet — publish the first one above." />
        </div>
      )}

      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card>
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="mb-2 text-base font-medium">{item.title}</h2>
                  <div className="-mt-1 -mr-1 flex shrink-0 gap-1">
                    {has('announcements:pin') && (
                      <Button variant="ghost" size="icon" onClick={() => handleTogglePin(item)}>
                        {item.pinned ? <PinOff /> : <Pin />}
                      </Button>
                    )}
                    {has('announcements:edit') && (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil />
                      </Button>
                    )}
                    {has('announcements:delete') && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(item)}>
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Tiptap output is our own sanitized rich text — safe to render.
                    If this ever accepts arbitrary user HTML from elsewhere, sanitize first. */}
                <div
                  className="text-muted-foreground text-sm [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: item.body }}
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
            <RichTextEditor value={editBody} onChange={setEditBody} placeholder="What's the announcement?" />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
