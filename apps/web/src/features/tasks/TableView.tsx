import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Eye, EyeOff, Layers, MoreHorizontal, Plus } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import {
  AssigneePicker,
  DueDatePicker,
  EpicPicker,
  OwnerPicker,
  PriorityPicker,
  RecurrencePicker,
  StatusPicker,
} from './taskMetaPickers';
import type { Board, Column, Project, Task } from './types';

interface TableViewProps {
  project: Project;
  onOpenTask: (taskId: string) => void;
}

type UpdateData = Parameters<typeof tasksApi.updateTask>[1];
type Users = { id: string; name: string }[];

function ProgressCell({ done, total, epic }: { done: number; total: number; epic?: boolean }) {
  if (total === 0) return <span className="text-muted-foreground/40 text-xs">—</span>;
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-all', epic ? 'bg-violet-500' : 'bg-primary')}
          style={{ width: `${Math.round((done / total) * 100)}%` }}
        />
      </div>
      <span>
        {done}/{total}
      </span>
    </div>
  );
}

// One table row — epic or task. Every cell is the same inline-edit control
// the Board card uses (shared pickers), so nothing here needs the drawer.
function TableTaskRow({
  task,
  indent,
  users,
  columns,
  epics,
  onUpdate,
  onOpen,
  childrenOpen,
  onToggleChildren,
  onAddSubtask,
  onAddTaskToEpic,
}: {
  task: Task;
  indent: boolean;
  users: Users;
  columns: Column[];
  epics: { id: string; title: string }[];
  onUpdate: (data: UpdateData) => void;
  onOpen: () => void;
  // Epics: whether their tasks are shown. Tasks: whether subtasks are shown.
  childrenOpen: boolean;
  onToggleChildren: () => void;
  onAddSubtask: () => void;
  onAddTaskToEpic: () => void;
}) {
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const isEpic = task.type === 'EPIC';
  const hasChildren = isEpic ? (task.epicStats?.total ?? 0) > 0 : (task.subtaskStats?.total ?? 0) > 0;
  const progress = isEpic ? task.epicStats : task.subtaskStats;
  const pick = (name: string) => ({ open: openPicker === name, onOpenChange: (o: boolean) => setOpenPicker(o ? name : null) });

  return (
    <tr className={cn('hover:bg-muted/40 border-b last:border-b-0', isEpic && 'bg-violet-500/5')}>
      <td className="py-1.5 pr-2 pl-3">
        <div className={cn('flex items-center gap-2', indent && 'pl-6')}>
          <button
            type="button"
            onClick={onToggleChildren}
            className={cn('text-muted-foreground shrink-0', !hasChildren && !isEpic && 'invisible')}
          >
            <ChevronRight className={cn('size-3.5 transition-transform', childrenOpen && 'rotate-90')} />
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
          {isEpic && <Layers className="size-3.5 shrink-0 text-violet-500" />}
          <button
            type="button"
            onClick={onOpen}
            className={cn('min-w-0 truncate text-left', isEpic && 'font-medium', task.completed && 'text-muted-foreground line-through')}
          >
            {task.title}
          </button>
          {!isEpic && (
            <EpicPicker task={task} epics={epics} onUpdate={onUpdate} {...pick('epic')} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground ml-auto shrink-0">
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isEpic ? (
                <DropdownMenuItem onClick={onAddTaskToEpic}>
                  <Plus className="size-3.5" />
                  Add task to epic
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onAddSubtask}>
                  <Plus className="size-3.5" />
                  Add subtask
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onUpdate({ type: isEpic ? 'TASK' : 'EPIC' })}>
                <Layers className="size-3.5" />
                {isEpic ? 'Convert to task' : 'Convert to epic'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center">
          {isEpic ? (
            <OwnerPicker task={task} users={users} onUpdate={onUpdate} {...pick('owner')} />
          ) : (
            <AssigneePicker task={task} users={users} onUpdate={onUpdate} {...pick('assignee')} />
          )}
        </div>
      </td>
      <td className="px-2 py-1.5">
        <DueDatePicker task={task} onUpdate={onUpdate} {...pick('due')} />
      </td>
      <td className="px-2 py-1.5">
        <StatusPicker task={task} columns={columns} onUpdate={onUpdate} {...pick('status')} />
      </td>
      <td className="px-2 py-1.5">
        <PriorityPicker task={task} onUpdate={onUpdate} {...pick('priority')} />
      </td>
      <td className="px-2 py-1.5">
        <RecurrencePicker task={task} onUpdate={onUpdate} {...pick('recurrence')} />
      </td>
      <td className="py-1.5 pr-3 pl-2">
        <ProgressCell done={progress?.done ?? 0} total={progress?.total ?? 0} epic={isEpic} />
      </td>
    </tr>
  );
}

function InlineAddRow({ placeholder, indent, onSubmit, onCancel }: { placeholder: string; indent: boolean; onSubmit: (title: string) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [posting, setPosting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      await onSubmit(trimmed);
      setTitle('');
    } finally {
      setPosting(false);
    }
  }

  return (
    <tr className="border-b">
      <td colSpan={7} className={cn('py-1.5 pr-3 pl-3', indent && 'pl-12')}>
        <form onSubmit={submit}>
          <input
            autoFocus
            value={title}
            disabled={posting}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title.trim() && !posting && onCancel()}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
            placeholder={placeholder}
            className="bg-background w-full max-w-md rounded-md border px-2 py-1 text-sm outline-none disabled:opacity-60"
          />
        </form>
      </td>
    </tr>
  );
}

function BoardSection({
  board,
  collapsed,
  showCompleted,
  onToggleCollapsed,
  onCollapseAll,
  onExpandAll,
  users,
  onOpenTask,
}: {
  board: Board;
  collapsed: boolean;
  showCompleted: boolean;
  onToggleCollapsed: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  users: Users;
  onOpenTask: (taskId: string) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [closedEpics, setClosedEpics] = useState<Set<string>>(new Set());
  const [openSubtasks, setOpenSubtasks] = useState<Set<string>>(new Set());
  const [subtasksById, setSubtasksById] = useState<Record<string, Task[]>>({});
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [addingTaskToEpic, setAddingTaskToEpic] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [posting, setPosting] = useState(false);

  const firstColumnId = board.columns[0]?.id;

  async function load() {
    setTasks(await tasksApi.listBoardTasks(board.id));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  async function updateTask(taskId: string, data: UpdateData) {
    const updated = await tasksApi.updateTask(taskId, data);
    // Merge, don't replace: the update response carries no progress stats.
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
    if (data.completed !== undefined || data.epicId !== undefined || data.type !== undefined) load();
  }

  async function loadSubtasks(taskId: string) {
    const full = await tasksApi.getTask(taskId);
    setSubtasksById((prev) => ({ ...prev, [taskId]: full.subtasks ?? [] }));
  }

  async function toggleSubtasks(taskId: string) {
    const opening = !openSubtasks.has(taskId);
    setOpenSubtasks((prev) => {
      const next = new Set(prev);
      if (opening) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
    if (opening && !subtasksById[taskId]) await loadSubtasks(taskId);
  }

  async function addSubtask(parentId: string, title: string) {
    await tasksApi.createTask({ title, parentId });
    await loadSubtasks(parentId);
    setOpenSubtasks((prev) => new Set(prev).add(parentId));
    setAddingSubtaskTo(null);
    load();
  }

  async function addTaskToEpic(epicId: string, title: string) {
    await tasksApi.createTask({ title, boardId: board.id, columnId: firstColumnId, epicId });
    setAddingTaskToEpic(null);
    load();
  }

  async function toggleSubtaskDone(subtask: Task) {
    const updated = await tasksApi.updateTask(subtask.id, { completed: !subtask.completed });
    if (!subtask.parentId) return;
    setSubtasksById((prev) => ({ ...prev, [subtask.parentId!]: (prev[subtask.parentId!] ?? []).map((s) => (s.id === subtask.id ? updated : s)) }));
    load();
  }

  async function addTop(type: 'TASK' | 'EPIC') {
    const trimmed = newTitle.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      // A columnId is required for the row to show up on the Board view.
      await tasksApi.createTask({ title: trimmed, boardId: board.id, columnId: firstColumnId, type });
      setNewTitle('');
      await load();
    } finally {
      setPosting(false);
    }
  }

  const visible = (t: Task) => showCompleted || !t.completed;
  const epics = tasks.filter((t) => t.type === 'EPIC').sort((a, b) => a.order - b.order);
  const epicRefs = epics.map((e) => ({ id: e.id, title: e.title }));
  const standalone = tasks.filter((t) => t.type === 'TASK' && !t.epicId && visible(t)).sort((a, b) => a.order - b.order);
  const shownCount = tasks.filter(visible).length;

  function renderTask(task: Task, indent: boolean) {
    const rows = [
      <TableTaskRow
        key={task.id}
        task={task}
        indent={indent}
        users={users}
        columns={board.columns}
        epics={epicRefs}
        onUpdate={(data) => updateTask(task.id, data)}
        onOpen={() => onOpenTask(task.id)}
        childrenOpen={openSubtasks.has(task.id)}
        onToggleChildren={() => toggleSubtasks(task.id)}
        onAddSubtask={() => {
          if (!openSubtasks.has(task.id)) toggleSubtasks(task.id);
          setAddingSubtaskTo(task.id);
        }}
        onAddTaskToEpic={() => undefined}
      />,
    ];
    if (openSubtasks.has(task.id)) {
      for (const sub of subtasksById[task.id] ?? []) {
        rows.push(
          <tr key={sub.id} className="bg-muted/20 border-b">
            <td colSpan={7} className={cn('py-1 pr-3', indent ? 'pl-20' : 'pl-14')}>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleSubtaskDone(sub)}
                  className={cn(
                    'flex size-3.5 shrink-0 items-center justify-center rounded-full border',
                    sub.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {sub.completed && <Check className="size-2" />}
                </button>
                <button type="button" onClick={() => onOpenTask(task.id)} className={cn('truncate text-left', sub.completed && 'text-muted-foreground line-through')}>
                  {sub.title}
                </button>
              </div>
            </td>
          </tr>,
        );
      }
    }
    if (addingSubtaskTo === task.id) {
      rows.push(
        <InlineAddRow
          key={`${task.id}-add-sub`}
          placeholder="Subtask title…"
          indent={indent}
          onSubmit={(title) => addSubtask(task.id, title)}
          onCancel={() => setAddingSubtaskTo(null)}
        />,
      );
    }
    return rows;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button" onClick={onToggleCollapsed} className="bg-muted hover:bg-muted/80 flex w-full items-center gap-2 px-3 py-2 text-left">
            <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', collapsed && '-rotate-90')} />
            <span className="text-sm font-medium">{board.name}</span>
            <span className="text-muted-foreground text-xs">{loading ? '…' : shownCount}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onExpandAll}>Expand all</ContextMenuItem>
          <ContextMenuItem onClick={onCollapseAll}>Collapse all</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs">
                <th className="py-1.5 pr-2 pl-3 font-medium">Title</th>
                <th className="w-28 px-2 py-1.5 font-medium">Responsible</th>
                <th className="w-24 px-2 py-1.5 font-medium">Due</th>
                <th className="w-36 px-2 py-1.5 font-medium">Status</th>
                <th className="w-24 px-2 py-1.5 font-medium">Priority</th>
                <th className="w-14 px-2 py-1.5 font-medium">Repeat</th>
                <th className="w-36 py-1.5 pr-3 pl-2 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-3 py-2">Loading…</td>
                </tr>
              )}
              {!loading && shownCount === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-3 py-2">No tasks yet.</td>
                </tr>
              )}

              {epics.filter(visible).map((epic) => {
                const epicOpen = !closedEpics.has(epic.id);
                const children = tasks.filter((t) => t.epicId === epic.id && visible(t)).sort((a, b) => a.order - b.order);
                return [
                  <TableTaskRow
                    key={epic.id}
                    task={epic}
                    indent={false}
                    users={users}
                    columns={board.columns}
                    epics={epicRefs}
                    onUpdate={(data) => updateTask(epic.id, data)}
                    onOpen={() => onOpenTask(epic.id)}
                    childrenOpen={epicOpen}
                    onToggleChildren={() =>
                      setClosedEpics((prev) => {
                        const next = new Set(prev);
                        if (next.has(epic.id)) next.delete(epic.id);
                        else next.add(epic.id);
                        return next;
                      })
                    }
                    onAddSubtask={() => undefined}
                    onAddTaskToEpic={() => {
                      setClosedEpics((prev) => {
                        const next = new Set(prev);
                        next.delete(epic.id);
                        return next;
                      });
                      setAddingTaskToEpic(epic.id);
                    }}
                  />,
                  ...(epicOpen ? children.flatMap((t) => renderTask(t, true)) : []),
                  ...(epicOpen && addingTaskToEpic === epic.id
                    ? [
                        <InlineAddRow
                          key={`${epic.id}-add`}
                          placeholder="Task title…"
                          indent
                          onSubmit={(title) => addTaskToEpic(epic.id, title)}
                          onCancel={() => setAddingTaskToEpic(null)}
                        />,
                      ]
                    : []),
                ];
              })}

              {standalone.flatMap((t) => renderTask(t, false))}
            </tbody>
          </table>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTop('TASK');
            }}
            className="flex items-center gap-1 border-t p-2"
          >
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add task or epic…" className="h-8 max-w-md text-sm" disabled={posting} />
            <Button type="submit" size="sm" variant="ghost" className="h-8" disabled={posting || !newTitle.trim()}>
              <Plus className="size-4" />
              Task
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-8" disabled={posting || !newTitle.trim()} onClick={() => addTop('EPIC')}>
              <Layers className="size-4" />
              Epic
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// Project-wide table: every board in the project as a collapsible section,
// its epics (with their tasks nested) and standalone tasks as real rows.
// Completed work is hidden unless "Show completed" is on. Right-click a
// board header for Expand all / Collapse all across every board.
export function TableView({ project, onOpenTask }: TableViewProps) {
  const [users, setUsers] = useState<Users>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);

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
      <div className="flex justify-end">
        <Button type="button" variant={showCompleted ? 'secondary' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setShowCompleted((v) => !v)}>
          {showCompleted ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
          Completed
        </Button>
      </div>
      {project.boards.map((board) => (
        <BoardSection
          key={board.id}
          board={board}
          collapsed={collapsed.has(board.id)}
          showCompleted={showCompleted}
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
