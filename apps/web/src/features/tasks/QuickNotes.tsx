import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { tasksApi } from './api';
import type { Task } from './types';

// Floating action button, fixed bottom-right on every screen — not a
// sidebar entry (specs/ARCHITECTURE.md, раздел 12). Opens a Sheet with
// the note list and a quick-add field at the bottom. Notes are just Task
// rows with no boardId, scoped to their author by the API
// (GET /tasks/mine) — same table as board tasks, not a separate model.
export function QuickNoteFab() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Task[]>([]);
  const [draft, setDraft] = useState('');

  async function load() {
    setNotes(await tasksApi.listMyNotes());
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    await tasksApi.createTask({ title: draft.trim() });
    setDraft('');
    load();
  }

  async function removeNote(id: string) {
    await tasksApi.removeTask(id);
    load();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick note"
        className="bg-primary text-primary-foreground hover:bg-primary/90 fixed right-6 bottom-6 z-40 flex size-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
      >
        <Plus className="size-5" />
        {notes.length > 0 && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1">
            {notes.length}
          </Badge>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Notes</SheetTitle>
          </SheetHeader>

          <ul className="flex flex-1 flex-col gap-2 overflow-y-auto px-4">
            {notes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet.</p>}
            {notes.map((note) => (
              <li key={note.id} className="bg-card flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                <span>{note.title}</span>
                <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => removeNote(note.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>

          <form onSubmit={addNote} className="border-t p-4">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Quick note…" autoFocus />
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
