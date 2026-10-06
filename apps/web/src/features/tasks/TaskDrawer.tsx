import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble';
import { cn } from '@/lib/utils';
import { usePermissions } from '../../app/PermissionsContext';
import { tasksApi } from './api';
import type { Task, TaskActivity, TaskComment } from './types';

interface TaskDrawerProps {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function isEmptyHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').trim().length === 0;
}

// Same bubble styling and composer shape as AnnouncementComments — no
// reactions/replies/edit here though, TaskComment is deliberately flatter
// (same reasoning the schema comment on that model gives).
function ChatTab({ taskId }: { taskId: string }) {
  const { user } = usePermissions();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [draft, setDraft] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    tasksApi
      .listComments(taskId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [taskId]);

  async function send() {
    if (isEmptyHtml(draft) || posting) return;
    setPosting(true);
    try {
      const comment = await tasksApi.createComment(taskId, draft);
      setComments((prev) => [...prev, comment]);
      setDraft('');
      editor?.commands.clearContent();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
        {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {!loading && comments.length === 0 && <p className="text-muted-foreground text-sm">No messages yet.</p>}
        {comments.map((c) => {
          const own = c.authorId === user?.id;
          return (
            <ChatBubble key={c.id} variant={own ? 'sent' : 'received'}>
              <ChatBubbleAvatar fallback={initials(c.author.name)} />
              <div className="flex min-w-0 flex-col">
                {!own && <span className="text-muted-foreground mb-1 px-1 text-xs font-medium">{c.author.name}</span>}
                <ChatBubbleMessage
                  variant={own ? 'sent' : 'received'}
                  html={c.text}
                  meta={formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                />
              </div>
            </ChatBubble>
          );
        })}
      </div>

      <div className="border-input focus-within:border-ring mt-2 flex shrink-0 items-end gap-1 rounded-2xl border px-1.5 py-1 transition-colors">
        <RichTextEditor
          value={draft}
          onChange={setDraft}
          onEditorReady={setEditor}
          placeholder="Write a message…"
          toolbar={false}
          bordered={false}
          minHeight="20px"
          resizable={false}
          className="min-w-0 flex-1"
          contentClassName="px-2 py-1"
        />
        <Button type="button" size="icon" className="size-8 shrink-0 rounded-full" onClick={send} disabled={posting}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
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
    const updated = await tasksApi.updateTask(task.id, { title });
    setTask(updated);
    onChanged();
  }

  async function saveDescription() {
    if (!task || description === (task.description ?? '')) return;
    const updated = await tasksApi.updateTask(task.id, { description });
    setTask(updated);
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
          <Tabs defaultValue="chat" className="flex-1 overflow-y-auto px-4">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="subtasks">Subtasks{task.subtasks?.length ? ` (${task.subtasks.length})` : ''}</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-3 h-full">
              <ChatTab taskId={task.id} />
            </TabsContent>

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

            <TabsContent value="timeline" className="mt-3">
              <TimelineTab taskId={task.id} />
            </TabsContent>

            <TabsContent value="subtasks" className="mt-3 flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {task.subtasks?.map((sub) => (
                  <li key={sub.id} className="bg-card flex items-center gap-2 rounded-md border p-2 text-sm">
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
