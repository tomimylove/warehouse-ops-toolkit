import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { tasksApi } from './api';
import type { Task } from './types';

interface TaskDrawerProps {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

// The right-hand panel that opens on a task/note card — Chat is
// deliberately not a tab yet (specs/ARCHITECTURE.md, раздел 12): comments
// are a shared Core primitive that still needs designing (mentions,
// notifications) rather than a one-off bolted onto Tasks alone.
export function TaskDrawer({ taskId, onOpenChange, onChanged }: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [descriptionEditor, setDescriptionEditor] = useState<Editor | null>(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }
    tasksApi.getTask(taskId).then((t) => {
      setTask(t);
      setTitle(t.title);
      setDescription(t.description ?? '');
      // The editor instance persists across tasks (the drawer stays
      // mounted while switching which card is open) — its content is only
      // the *initial* value on creation, so switching tasks needs this
      // explicit reset or it'd keep showing the previous task's text.
      descriptionEditor?.commands.setContent(t.description ?? '');
    });
    // descriptionEditor intentionally excluded — it would re-run this
    // effect (and reset the field mid-edit) every time the editor
    // instance itself changes, not just when taskId does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function saveTitle() {
    if (!task || title === task.title) return;
    await tasksApi.updateTask(task.id, { title });
    onChanged();
  }

  async function saveDescription() {
    if (!task || description === (task.description ?? '')) return;
    await tasksApi.updateTask(task.id, { description });
    onChanged();
  }

  async function addSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !newSubtask.trim()) return;
    await tasksApi.createTask({ title: newSubtask.trim(), parentId: task.id });
    setNewSubtask('');
    const refreshed = await tasksApi.getTask(task.id);
    setTask(refreshed);
    onChanged();
  }

  return (
    <Sheet open={taskId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle asChild>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
          </SheetTitle>
        </SheetHeader>

        {task && (
          <Tabs defaultValue="description" className="flex-1 px-4">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="subtasks">Subtasks{task.subtasks?.length ? ` (${task.subtasks.length})` : ''}</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-3">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                onBlur={saveDescription}
                onEditorReady={setDescriptionEditor}
                placeholder="Add a description…"
                minHeight="128px"
              />
            </TabsContent>

            <TabsContent value="subtasks" className="mt-3 flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {task.subtasks?.map((sub) => (
                  <li key={sub.id} className="bg-card rounded-md border p-2 text-sm">
                    {sub.title}
                  </li>
                ))}
                {!task.subtasks?.length && (
                  <p className="text-muted-foreground text-sm">No subtasks yet.</p>
                )}
              </ul>
              <form onSubmit={addSubtask} className="flex gap-2">
                <Input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="New subtask…" />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
