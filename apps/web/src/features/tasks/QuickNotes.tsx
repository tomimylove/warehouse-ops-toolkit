import { useEffect, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
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

// The sidebar entry point for personal notes — deliberately not a nav
// item/route (specs/ARCHITECTURE.md, раздел 12): opens a Sheet with the
// note list, quick-add at the bottom, count as a badge on the button.
export function QuickNotesButton() {
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
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Notes">
          <NotebookPen />
          <span>Notes</span>
          {notes.length > 0 && (
            <Badge variant="secondary" className="ml-auto h-5 min-w-5 justify-center px-1 group-data-[collapsible=icon]:hidden">
              {notes.length}
            </Badge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>

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
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Quick note…"
              autoFocus
            />
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
