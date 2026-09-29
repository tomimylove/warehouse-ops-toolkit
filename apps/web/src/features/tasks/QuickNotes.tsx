import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'quick-notes';

// Placeholder persistence — real Notes are just Task rows with no boardId
// (specs/ARCHITECTURE.md, раздел 12), but the Tasks module isn't built
// yet. localStorage keeps this usable in the meantime; swap for
// dataProvider('tasks') once that model exists, no UI change needed here.
function loadNotes(): QuickNote[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

// Floating action button, fixed bottom-right on every screen — not a
// sidebar entry (specs/ARCHITECTURE.md, раздел 12). Opens a Sheet with
// the note list and a quick-add field at the bottom.
export function QuickNoteFab() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<QuickNote[]>(loadNotes);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setNotes((prev) => [{ id: crypto.randomUUID(), text: draft.trim(), createdAt: new Date().toISOString() }, ...prev]);
    setDraft('');
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
              <li key={note.id} className="bg-card rounded-md border p-3 text-sm">
                {note.text}
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
