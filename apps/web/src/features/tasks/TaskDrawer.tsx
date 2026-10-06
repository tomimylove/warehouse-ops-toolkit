import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Check, Flag, Repeat, Send, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import type { Task, TaskActivity, TaskComment, TaskPriority, TaskRecurrence } from './types';

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

const PRIORITIES: TaskPriority[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
const RECURRENCES: TaskRecurrence[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'];

function toDateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

// Quick-edit row above the tabs — priority/assignee/due date/recurrence,
// each saved immediately on change rather than needing a separate save
// step, since these are single-value pickers rather than free text.
function QuickFields({
  task,
  users,
  onUpdate,
}: {
  task: Task;
  users: { id: string; name: string }[];
  onUpdate: (data: Parameters<typeof tasksApi.updateTask>[1]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
            <Flag className="size-3" />
            {task.priority === 'NONE' ? 'Priority' : task.priority}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {PRIORITIES.map((p) => (
            <DropdownMenuItem key={p} onClick={() => onUpdate({ priority: p })}>
              <Check className={cn('size-3.5', task.priority === p ? 'opacity-100' : 'opacity-0')} />
              {p === 'NONE' ? 'No priority' : p}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
            <User className="size-3" />
            {task.assignee?.name ?? 'Assignee'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onUpdate({ assigneeId: null })}>
            <Check className={cn('size-3.5', !task.assigneeId ? 'opacity-100' : 'opacity-0')} />
            Unassigned
          </DropdownMenuItem>
          {users.map((u) => (
            <DropdownMenuItem key={u.id} onClick={() => onUpdate({ assigneeId: u.id })}>
              <Check className={cn('size-3.5', task.assigneeId === u.id ? 'opacity-100' : 'opacity-0')} />
              {u.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative">
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
          <label>
            <Calendar className="size-3" />
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Due date'}
            <input
              type="date"
              value={toDateInputValue(task.dueDate)}
              onChange={(e) => onUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
            <Repeat className="size-3" />
            {task.recurrence === 'NONE' ? 'Repeat' : task.recurrence.toLowerCase()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {RECURRENCES.map((r) => (
            <DropdownMenuItem key={r} onClick={() => onUpdate({ recurrence: r })}>
              <Check className={cn('size-3.5', task.recurrence === r ? 'opacity-100' : 'opacity-0')} />
              {r === 'NONE' ? "Doesn't repeat" : r.charAt(0) + r.slice(1).toLowerCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ChatTab({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    tasksApi
      .listComments(taskId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [taskId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const comment = await tasksApi.createComment(taskId, draft.trim());
    setComments((prev) => [...prev, comment]);
    setDraft('');
  }

  return (
    <div className="flex flex-col gap-3">
      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {!loading && comments.length === 0 && <p className="text-muted-foreground text-sm">No messages yet.</p>}
      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <Avatar size="sm" className="shrink-0">
              <AvatarFallback className="text-[9px]">{initials(c.author.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium">{c.author.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm break-words">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" />
        <Button type="submit" size="icon" className="shrink-0">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function LogTab({ taskId }: { taskId: string }) {
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

  return (
    <ul className="flex flex-col gap-2.5">
      {activity.map((a) => (
        <li key={a.id} className="text-xs">
          <span className="font-medium">{a.actor.name}</span> <span className="text-muted-foreground">{a.message.toLowerCase()}</span>
          <span className="text-muted-foreground"> · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
        </li>
      ))}
    </ul>
  );
}

// The right-hand panel that opens on a task/note card — tabs for
// Description (rich text), Subtasks (with completion toggle), Chat
// (per-task comments), and Log (activity feed); quick-edit fields for
// priority/assignee/due date/recurrence sit above the tabs.
export function TaskDrawer({ taskId, onOpenChange, onChanged }: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [descriptionEditor, setDescriptionEditor] = useState<Editor | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    tasksApi.listUsers().then(setUsers);
  }, []);

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

  async function updateQuickField(data: Parameters<typeof tasksApi.updateTask>[1]) {
    if (!task) return;
    const updated = await tasksApi.updateTask(task.id, data);
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
          <>
            <QuickFields task={task} users={users} onUpdate={updateQuickField} />

            <Tabs defaultValue="description" className="flex-1 overflow-y-auto px-4">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="subtasks">Subtasks{task.subtasks?.length ? ` (${task.subtasks.length})` : ''}</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="log">Log</TabsTrigger>
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

              <TabsContent value="chat" className="mt-3">
                <ChatTab taskId={task.id} />
              </TabsContent>

              <TabsContent value="log" className="mt-3">
                <LogTab taskId={task.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
