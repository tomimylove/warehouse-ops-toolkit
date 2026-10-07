import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import { AssigneePicker, DueDatePicker, PriorityPicker, RecurrencePicker } from './taskMetaPickers';
import type { Project, Task } from './types';

interface ListViewProps {
  project: Project;
  onOpenTask: (taskId: string) => void;
}

// A single task row, badges reused verbatim from Board — same quick-edit
// popovers, same completion checkbox, same subtask expand+add — just laid
// out as a flat row instead of a kanban card.
function ListTaskRow({
  task,
  users,
  onUpdate,
  onOpen,
  expanded,
  onToggleExpand,
  subtasks,
  loadingSubtasks,
  onToggleSubtask,
  onAddSubtask,
}: {
  task: Task;
  users: { id: string; name: string }[];
  onUpdate: (data: Parameters<typeof tasksApi.updateTask>[1]) => void;
  onOpen: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  subtasks: Task[] | undefined;
  loadingSubtasks: boolean;
  onToggleSubtask: (subtask: Task) => void;
  onAddSubtask: (title: string) => Promise<void>;
}) {
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const stats = task.subtaskStats;

  async function submitSubtask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = subtaskTitle.trim();
    if (!trimmed) return;
    await onAddSubtask(trimmed);
    setSubtaskTitle('');
    setAddingSubtask(false);
  }

  return (
    <div className="border-border/70 border-b last:border-b-0">
      <div className="hover:bg-muted/40 flex items-center gap-2 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={onToggleExpand}
          className={cn('text-muted-foreground shrink-0', !stats && 'opacity-0')}
        >
          <ChevronRight className={cn('size-3.5 transition-transform', expanded && 'rotate-90')} />
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ completed: !task.completed })}
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full border',
            task.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40',
          )}
        >
          {task.completed && <Check className="size-2.5" />}
        </button>
        <button type="button" onClick={onOpen} className={cn('min-w-0 flex-1 truncate text-left', task.completed && 'text-muted-foreground line-through')}>
          {task.title}
        </button>
        {stats && <span className="text-muted-foreground shrink-0 text-xs">{stats.done}/{stats.total}</span>}
        <div className="flex shrink-0 items-center gap-1.5">
          <PriorityPicker task={task} onUpdate={onUpdate} open={openPicker === 'priority'} onOpenChange={(o) => setOpenPicker(o ? 'priority' : null)} />
          <DueDatePicker task={task} onUpdate={onUpdate} open={openPicker === 'due'} onOpenChange={(o) => setOpenPicker(o ? 'due' : null)} />
          <RecurrencePicker task={task} onUpdate={onUpdate} open={openPicker === 'recurrence'} onOpenChange={(o) => setOpenPicker(o ? 'recurrence' : null)} />
          <AssigneePicker task={task} users={users} onUpdate={onUpdate} open={openPicker === 'assignee'} onOpenChange={(o) => setOpenPicker(o ? 'assignee' : null)} />
          <button type="button" onClick={() => { if (!expanded) onToggleExpand(); setAddingSubtask(true); }} className="text-muted-foreground/40 hover:text-muted-foreground">
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-muted/20 flex flex-col gap-1 py-1 pl-10">
          {loadingSubtasks && <p className="text-muted-foreground px-2 py-1 text-xs">Loading…</p>}
          {!loadingSubtasks &&
            subtasks?.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2 px-2 py-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => onToggleSubtask(sub)}
                  className={cn(
                    'flex size-3.5 shrink-0 items-center justify-center rounded-full border',
                    sub.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {sub.completed && <Check className="size-2" />}
                </button>
                <button type="button" onClick={onOpen} className={cn('truncate text-left', sub.completed && 'text-muted-foreground line-through')}>
                  {sub.title}
                </button>
              </div>
            ))}
          {addingSubtask ? (
            <form onSubmit={submitSubtask} className="px-2 py-0.5">
              <input
                autoFocus
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onBlur={() => !subtaskTitle.trim() && setAddingSubtask(false)}
                onKeyDown={(e) => e.key === 'Escape' && setAddingSubtask(false)}
                placeholder="Subtask title…"
                className="bg-background w-full rounded-md border px-2 py-1 text-xs outline-none"
              />
            </form>
          ) : (
            <button type="button" onClick={() => setAddingSubtask(true)} className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-0.5 text-left text-xs">
              <Plus className="size-3" />
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BoardSection({
  boardId,
  boardName,
  collapsed,
  onToggleCollapsed,
  onCollapseAll,
  onExpandAll,
  users,
  onOpenTask,
}: {
  boardId: string;
  boardName: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  users: { id: string; name: string }[];
  onOpenTask: (taskId: string) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [subtasksById, setSubtasksById] = useState<Record<string, Task[]>>({});
  const [loadingSubtaskIds, setLoadingSubtaskIds] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState('');

  async function load() {
    setLoading(true);
    setTasks(await tasksApi.listBoardTasks(boardId));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  async function updateTask(taskId: string, data: Parameters<typeof tasksApi.updateTask>[1]) {
    const updated = await tasksApi.updateTask(taskId, data);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (data.completed !== undefined) load();
  }

  async function toggleExpand(taskId: string) {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
    if (!subtasksById[taskId]) {
      setLoadingSubtaskIds((prev) => new Set(prev).add(taskId));
      const full = await tasksApi.getTask(taskId);
      setSubtasksById((prev) => ({ ...prev, [taskId]: full.subtasks ?? [] }));
      setLoadingSubtaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }

  async function toggleSubtaskDone(subtask: Task) {
    const updated = await tasksApi.updateTask(subtask.id, { completed: !subtask.completed });
    if (!subtask.parentId) return;
    setSubtasksById((prev) => ({ ...prev, [subtask.parentId!]: (prev[subtask.parentId!] ?? []).map((s) => (s.id === subtask.id ? updated : s)) }));
    load();
  }

  async function addSubtask(parentId: string, title: string) {
    await tasksApi.createTask({ title, parentId });
    const full = await tasksApi.getTask(parentId);
    setSubtasksById((prev) => ({ ...prev, [parentId]: full.subtasks ?? [] }));
    load();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await tasksApi.createTask({ title: trimmed, boardId });
    setNewTitle('');
    load();
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button" onClick={onToggleCollapsed} className="bg-muted hover:bg-muted/80 flex w-full items-center gap-2 px-3 py-2 text-left">
            <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', collapsed && '-rotate-90')} />
            <span className="text-sm font-medium">{boardName}</span>
            <span className="text-muted-foreground text-xs">{loading ? '…' : tasks.length}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onExpandAll}>Expand all</ContextMenuItem>
          <ContextMenuItem onClick={onCollapseAll}>Collapse all</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {!collapsed && (
        <div>
          {loading && <p className="text-muted-foreground px-3 py-2 text-sm">Loading…</p>}
          {!loading && tasks.length === 0 && <p className="text-muted-foreground px-3 py-2 text-sm">No tasks yet.</p>}
          {tasks.map((task) => (
            <ListTaskRow
              key={task.id}
              task={task}
              users={users}
              onOpen={() => onOpenTask(task.id)}
              onUpdate={(data) => updateTask(task.id, data)}
              expanded={expandedTasks.has(task.id)}
              onToggleExpand={() => toggleExpand(task.id)}
              subtasks={subtasksById[task.id]}
              loadingSubtasks={loadingSubtaskIds.has(task.id)}
              onToggleSubtask={toggleSubtaskDone}
              onAddSubtask={(title) => addSubtask(task.id, title)}
            />
          ))}
          <form onSubmit={addTask} className="flex items-center gap-1 border-t p-2">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add task…" className="h-8 text-sm" />
            <Button type="submit" size="icon" variant="ghost" className="size-8 shrink-0">
              <Plus className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// Project-wide view — every board in the project, each a collapsible
// section with its tasks listed flat inside (not split by column). Right-
// click a board's header for "Expand all"/"Collapse all" across every
// board in the list, not just that one.
export function ListView({ project, onOpenTask }: ListViewProps) {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    tasksApi.listUsers().then(setUsers);
  }, []);

  function toggleBoard(boardId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {project.boards.map((board) => (
        <BoardSection
          key={board.id}
          boardId={board.id}
          boardName={board.name}
          collapsed={collapsed.has(board.id)}
          onToggleCollapsed={() => toggleBoard(board.id)}
          onCollapseAll={() => setCollapsed(new Set(project.boards.map((b) => b.id)))}
          onExpandAll={() => setCollapsed(new Set())}
          users={users}
          onOpenTask={onOpenTask}
        />
      ))}
      {project.boards.length === 0 && <p className="text-muted-foreground text-sm">No boards yet.</p>}
    </div>
  );
}
