import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { formatDistanceToNow } from 'date-fns';
import { Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePermissions } from '../../app/PermissionsContext';
import { CommentThread } from '../comments/CommentThread';
import { tasksApi } from './api';
import type { Task, TaskActivity, TaskComment } from './types';

interface TaskDrawerProps {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

// The same shared comment thread Announcements uses — reactions, replies,
// edit, the floating composer, all of it — not a cut-down copy.
function ChatTab({ taskId }: { taskId: string }) {
  const { user, has } = usePermissions();

  return (
    <CommentThread<TaskComment>
      threadKey={taskId}
      className="h-full"
      currentUserId={user?.id}
      canDeleteComment={() => has('tasks:delete')}
      emptyTitle="No messages yet"
      emptyHint="Say something about this task."
      api={{
        list: () => tasksApi.listComments(taskId),
        create: (text, replyToId) => tasksApi.createComment(taskId, text, replyToId),
        update: (commentId, text) => tasksApi.updateComment(taskId, commentId, text),
        remove: (commentId) => tasksApi.removeComment(taskId, commentId),
        toggleReaction: (commentId, emoji) => tasksApi.toggleCommentReaction(taskId, commentId, emoji),
      }}
    />
  );
}

// Renamed from "Log" — same data (TaskActivityLog), presented as a
// vertical timeline (dot + connecting line per entry) instead of a flat
// list, reading top-to-bottom as the task's chronological progress.
function TimelineTab({ taskId }: { taskId: string }) {
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    tasksApi
      .listActivity(taskId)
      .then(setActivity)
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (activity.length === 0) return <p className="text-muted-foreground text-sm">No activity yet.</p>;

  const chronological = [...activity].reverse();

  return (
    <ul className="relative flex flex-col gap-4 py-1 pl-5">
      <div className="bg-border absolute top-1 bottom-1 left-[7px] w-px" />
      {chronological.map((a) => (
        <li key={a.id} className="relative">
          <div className="bg-primary border-background absolute top-0.5 -left-5 size-2.5 rounded-full border-2" />
          <div className="text-xs">
            <span className="font-medium">{a.actor.name}</span> <span className="text-muted-foreground">{a.message.toLowerCase()}</span>
          </div>
          <div className="text-muted-foreground mt-0.5 text-[10px]">
            {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
          </div>
        </li>
      ))}
    </ul>
  );
}

// The right-hand panel that opens on a task/note card. Priority/assignee/
// due date/recurrence moved out of here onto the board itself (each
// card's badges, and the board's filter toolbar you can drag values off
// of) — editing them no longer needs opening the drawer at all.
export function TaskDrawer({ taskId, onOpenChange, onChanged }: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
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
      setDescriptionDirty(false);
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
    const updated = await tasksApi.updateTask(task.id, { title });
    setTask(updated);
    onChanged();
  }

  async function saveDescription() {
    if (!task || description === (task.description ?? '') || savingDescription) return;
    setSavingDescription(true);
    try {
      const updated = await tasksApi.updateTask(task.id, { description });
      setTask(updated);
      setDescriptionDirty(false);
      onChanged();
    } finally {
      setSavingDescription(false);
    }
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

  async function toggleSubtask(subtaskId: string, completed: boolean) {
    if (!task) return;
    await tasksApi.updateTask(subtaskId, { completed });
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
          <Tabs defaultValue="chat" className="flex min-h-0 flex-1 flex-col px-4">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="subtasks">Subtasks{task.subtasks?.length ? ` (${task.subtasks.length})` : ''}</TabsTrigger>
            </TabsList>

            {/* Chat owns its own single scroll region (with the floating
                composer pinned inside it) — it must NOT also sit inside an
                overflow-y-auto ancestor, or the outer box scrolls instead
                and the composer ends up clipped at the bottom. */}
            <TabsContent value="chat" className="mt-3 flex min-h-0 flex-col">
              <ChatTab taskId={task.id} />
            </TabsContent>

            <TabsContent value="description" className="mt-3 flex min-h-0 flex-col gap-2 overflow-y-auto">
              <RichTextEditor
                value={description}
                onChange={(html) => {
                  setDescription(html);
                  setDescriptionDirty(html !== (task.description ?? ''));
                }}
                onBlur={saveDescription}
                onEditorReady={setDescriptionEditor}
                placeholder="Add a description…"
                minHeight="128px"
              />
              <Button type="button" size="sm" className="self-end" onClick={saveDescription} disabled={!descriptionDirty || savingDescription}>
                {savingDescription ? 'Saving…' : 'Save'}
              </Button>
            </TabsContent>

            <TabsContent value="timeline" className="mt-3 min-h-0 overflow-y-auto">
              <TimelineTab taskId={task.id} />
            </TabsContent>

            <TabsContent value="subtasks" className="mt-3 flex min-h-0 flex-col gap-3 overflow-y-auto">
              <ul className="ml-3.5 flex flex-col gap-1.5 py-0.5">
                {task.subtasks?.map((sub) => (
                  <li key={sub.id} className="relative pl-4">
                    {/* Rounded branch off the trunk, not a plain line down
                        — each item's own top-half curves right into it, and
                        consecutive items stack into one continuous trunk. */}
                    <span className="border-border absolute top-0 left-0 h-1/2 w-3 rounded-bl-md border-b border-l" aria-hidden />
                    <div className="bg-card flex items-center gap-2 rounded-md border p-2 text-sm">
                      <button
                        type="button"
                        onClick={() => toggleSubtask(sub.id, !sub.completed)}
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-full border',
                          sub.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40',
                        )}
                      >
                        {sub.completed && <Check className="size-3" />}
                      </button>
                      <span className={cn('flex-1', sub.completed && 'text-muted-foreground line-through')}>{sub.title}</span>
                    </div>
                  </li>
                ))}
                {!task.subtasks?.length && <p className="text-muted-foreground text-sm">No subtasks yet.</p>}
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
