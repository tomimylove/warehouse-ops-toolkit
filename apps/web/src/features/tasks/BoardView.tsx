import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Check, ChevronDown, Flag, MoreHorizontal, Plus, Repeat, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import { AssigneePicker, DueDatePicker, PRIORITIES, PRIORITY_ICON_COLOR, PriorityPicker, RECURRENCES, RecurrencePicker, initials } from './taskMetaPickers';
import type { Board, Task, TaskPriority, TaskRecurrence } from './types';

interface BoardViewProps {
  board: Board;
  onOpenTask: (taskId: string) => void;
  onColumnsChanged: () => void;
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const COLUMN_COLORS = [
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#ef4444',
  '#64748b',
];
const DEFAULT_COLUMN_COLOR = '#64748b';

// ---------------------------------------------------------------------
// Column color picker — a grid of swatch buttons, same "pick one from a
// small fixed palette" shape as the announcement composer's cover picker.
// ---------------------------------------------------------------------
function ColorSwatchGrid({ value, onPick }: { value: string | null; onPick: (color: string | null) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 p-1">
      <button
        type="button"
        title="No color"
        onClick={() => onPick(null)}
        className={cn(
          'bg-muted flex size-7 items-center justify-center rounded-full border-2',
          !value ? 'border-primary' : 'border-transparent',
        )}
      >
        {!value && <Check className="size-3.5" />}
      </button>
      {COLUMN_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          style={{ background: c }}
          className={cn('flex size-7 items-center justify-center rounded-full border-2', value === c ? 'border-foreground' : 'border-transparent')}
        >
          {value === c && <Check className="size-3.5 text-white" />}
        </button>
      ))}
    </div>
  );
}

// The column itself — draggable from anywhere on its header bar (same
// click-vs-drag distance threshold as cards), with a dashed placeholder
// while dragging, matching the card reorder effect.
function BoardColumnContainer({
  column,
  onColorChange,
  onRename,
  children,
}: {
  column: { id: string; name: string; color: string | null };
  onColorChange: (color: string | null) => void;
  onRename: (name: string) => void;
  children: React.ReactNode;
}) {
  // useSortable already registers this node as both the drag source AND
  // the drop target for column.id — a separate useDroppable with the same
  // id would double-register it, so the task list below just renders
  // inside this same droppable area instead of its own.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [colorOpen, setColorOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const color = column.color ?? DEFAULT_COLUMN_COLOR;

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="w-72 shrink-0">
        <div className="border-muted-foreground/30 h-40 rounded-lg border-2 border-dashed" />
      </div>
    );
  }

  function commitRename() {
    setRenaming(false);
    if (name.trim() && name.trim() !== column.name) onRename(name.trim());
    else setName(column.name);
  }

  return (
    <div ref={setNodeRef} style={style} className="w-72 shrink-0 overflow-hidden rounded-lg" {...attributes} {...listeners}>
      <div style={{ background: color }} className="flex w-full items-center text-white">
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setName(column.name);
                setRenaming(false);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full bg-transparent px-3 py-2 text-left text-sm font-medium outline-none"
          />
        ) : (
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverAnchor asChild>
              <button
                type="button"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenaming(true);
                }}
                onClick={() => setColorOpen(true)}
                className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm font-medium"
              >
                {column.name}
              </button>
            </PopoverAnchor>
            <PopoverContent className="w-auto" align="start">
              <ColorSwatchGrid
                value={column.color}
                onPick={(c) => {
                  onColorChange(c);
                  setColorOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div style={{ background: hexToRgba(color, 0.08) }} className="flex flex-col gap-2 p-2">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// "+ Add task" above the column's first card — a plain link until
// clicked, then an inline card-shaped input; Enter saves, Escape/blur
// (when empty) cancels back to the link. Guards against double-submit so
// a slow request can't be fired twice from one Enter-mash.
// ---------------------------------------------------------------------
function AddTaskRow({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      await onAdd(trimmed);
      setTitle('');
      inputRef.current?.focus();
    } finally {
      setPosting(false);
    }
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm"
      >
        <Plus className="size-3.5" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={submit}>
      <Card className="gap-0 py-0">
        <CardContent className="p-2">
          <input
            ref={inputRef}
            autoFocus
            value={title}
            disabled={posting}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title.trim() && !posting && setAdding(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setTitle('');
                setAdding(false);
              }
            }}
            placeholder="Task title…"
            className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
          />
        </CardContent>
      </Card>
    </form>
  );
}

function SubtaskRow({ subtask, onToggle, onOpen }: { subtask: Task; onToggle: () => void; onOpen: () => void }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center gap-2 p-2 text-xs">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full border',
            subtask.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40',
          )}
        >
          {subtask.completed && <Check className="size-2.5" />}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className={cn('flex-1 truncate text-left', subtask.completed && 'text-muted-foreground line-through')}
        >
          {subtask.title}
        </button>
      </CardContent>
    </Card>
  );
}

// Inline "+ subtask" affordance inside the expanded subtask list — same
// debounce guard as AddTaskRow. Open state is controlled from TaskCard so
// the card's "…" menu can trigger it directly, not just the link here.
function AddSubtaskRow({
  onAdd,
  open,
  onOpenChange,
}: {
  onAdd: (title: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      await onAdd(trimmed);
      setTitle('');
      onOpenChange(false);
    } finally {
      setPosting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 text-left text-xs"
      >
        <Plus className="size-3" />
        Add subtask
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-1 px-0.5">
      <input
        ref={inputRef}
        autoFocus
        value={title}
        disabled={posting}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => !title.trim() && !posting && onOpenChange(false)}
        onKeyDown={(e) => e.key === 'Escape' && onOpenChange(false)}
        placeholder="Subtask title…"
        className="bg-background min-w-0 flex-1 rounded-md border px-2 py-1 text-xs outline-none disabled:opacity-60"
      />
    </form>
  );
}

function TaskCard({
  task,
  onOpen,
  expanded,
  onToggleExpand,
  subtasks,
  loadingSubtasks,
  onToggleSubtask,
  onAddSubtask,
  onUpdate,
  users,
}: {
  task: Task;
  onOpen: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  subtasks: Task[] | undefined;
  loadingSubtasks: boolean;
  onToggleSubtask: (subtask: Task) => void;
  onAddSubtask: (title: string) => Promise<void>;
  onUpdate: (data: Parameters<typeof tasksApi.updateTask>[1]) => void;
  users: { id: string; name: string }[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const stats = task.subtaskStats;
  // Only one badge popover open at a time, on this card — opening another
  // closes whichever was already open instead of stacking.
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style}>
        <div className="border-muted-foreground/30 h-[52px] rounded-lg border-2 border-dashed" />
      </div>
    );
  }

  return (
    <div>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onOpen} className="cursor-pointer touch-none">
        <Card className="gap-0 py-0">
          <CardContent className="space-y-2 p-3 text-sm">
            <div className="flex items-start gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ completed: !task.completed });
                }}
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                  task.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40',
                )}
              >
                {task.completed && <Check className="size-2.5" />}
              </button>
              <span className={cn('min-w-0 flex-1', task.completed && 'text-muted-foreground line-through')}>{task.title}</span>
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground shrink-0">
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={() => {
                      if (!expanded) onToggleExpand();
                      setAddingSubtask(true);
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add subtask
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pl-5" onClick={(e) => e.stopPropagation()}>
              <PriorityPicker
                task={task}
                onUpdate={onUpdate}
                open={openPicker === 'priority'}
                onOpenChange={(o) => setOpenPicker(o ? 'priority' : null)}
              />
              <DueDatePicker
                task={task}
                onUpdate={onUpdate}
                open={openPicker === 'due'}
                onOpenChange={(o) => setOpenPicker(o ? 'due' : null)}
              />
              <RecurrencePicker
                task={task}
                onUpdate={onUpdate}
                open={openPicker === 'recurrence'}
                onOpenChange={(o) => setOpenPicker(o ? 'recurrence' : null)}
              />
              <AssigneePicker
                task={task}
                users={users}
                onUpdate={onUpdate}
                className="ml-auto"
                open={openPicker === 'assignee'}
                onOpenChange={(o) => setOpenPicker(o ? 'assignee' : null)}
              />
            </div>

            {stats && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="text-muted-foreground flex w-full items-center gap-1.5 pl-5 text-xs"
              >
                <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
                  />
                </div>
                <span className="shrink-0">
                  {stats.done}/{stats.total}
                </span>
                <ChevronDown className={cn('size-3 shrink-0 transition-transform', expanded && 'rotate-180')} />
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {expanded && (
        <div className="mt-1 ml-3.5 flex flex-col gap-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
          {loadingSubtasks && <p className="text-muted-foreground px-2 py-1 text-xs">Loading…</p>}
          {!loadingSubtasks &&
            subtasks?.map((sub) => (
              <div key={sub.id} className="relative pl-3">
                {/* Rounded branch off the trunk, not a plain line down —
                    each row's own top-half curves right, and consecutive
                    rows stack into one continuous trunk. */}
                <span className="border-border absolute top-0 left-0 h-1/2 w-2.5 rounded-bl-md border-b border-l" aria-hidden />
                <SubtaskRow subtask={sub} onToggle={() => onToggleSubtask(sub)} onOpen={onOpen} />
              </div>
            ))}
          <div className="relative pl-3">
            <span className="border-border absolute top-0 left-0 h-1/2 w-2.5 rounded-bl-md border-b border-l" aria-hidden />
            <AddSubtaskRow onAdd={onAddSubtask} open={addingSubtask} onOpenChange={setAddingSubtask} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Filter/assign toolbar — click a value to filter the board by it; drag
// the same value onto a card to assign it there instead. Each value is a
// small useDraggable item (id "filter:<field>:<value>") living in the
// same DndContext as the cards, so a drop can land on either.
// ---------------------------------------------------------------------
function FilterOption({
  id,
  label,
  active,
  onClick,
  children,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs',
        active && 'bg-accent',
        isDragging && 'opacity-30',
      )}
      {...attributes}
      {...listeners}
    >
      <Check className={cn('size-3 shrink-0', active ? 'opacity-100' : 'opacity-0')} />
      {children}
      {label}
    </button>
  );
}

interface Filters {
  priority: TaskPriority | null;
  assigneeId: string | null;
  recurrence: TaskRecurrence | null;
  overdueOnly: boolean;
}

function FilterToolbar({
  filters,
  setFilters,
  users,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  users: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant={filters.priority ? 'secondary' : 'outline'} size="sm" className="h-7 text-xs">
            <Flag className="size-3" />
            {filters.priority ? filters.priority.charAt(0) + filters.priority.slice(1).toLowerCase() : 'Priority'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          {PRIORITIES.map((p) => (
            <FilterOption
              key={p}
              id={`filter:priority:${p}`}
              label={p.charAt(0) + p.slice(1).toLowerCase()}
              active={filters.priority === p}
              onClick={() => setFilters({ ...filters, priority: filters.priority === p ? null : p })}
            >
              <Flag className={cn('size-3 shrink-0', PRIORITY_ICON_COLOR[p])} />
            </FilterOption>
          ))}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant={filters.assigneeId ? 'secondary' : 'outline'} size="sm" className="h-7 text-xs">
            <User className="size-3" />
            {users.find((u) => u.id === filters.assigneeId)?.name ?? 'Assignee'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          {users.map((u) => (
            <FilterOption
              key={u.id}
              id={`filter:assigneeId:${u.id}`}
              label={u.name}
              active={filters.assigneeId === u.id}
              onClick={() => setFilters({ ...filters, assigneeId: filters.assigneeId === u.id ? null : u.id })}
            >
              <Avatar size="sm" className="size-4 shrink-0">
                <AvatarFallback className="text-[8px]">{initials(u.name)}</AvatarFallback>
              </Avatar>
            </FilterOption>
          ))}
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant={filters.overdueOnly ? 'secondary' : 'outline'}
        size="sm"
        className="h-7 text-xs"
        onClick={() => setFilters({ ...filters, overdueOnly: !filters.overdueOnly })}
      >
        <Calendar className="size-3" />
        Overdue
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant={filters.recurrence ? 'secondary' : 'outline'} size="sm" className="h-7 text-xs">
            <Repeat className="size-3" />
            {filters.recurrence ? filters.recurrence.charAt(0) + filters.recurrence.slice(1).toLowerCase() : 'Repeat'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          {RECURRENCES.map((r) => (
            <FilterOption
              key={r}
              id={`filter:recurrence:${r}`}
              label={r.charAt(0) + r.slice(1).toLowerCase()}
              active={filters.recurrence === r}
              onClick={() => setFilters({ ...filters, recurrence: filters.recurrence === r ? null : r })}
            >
              <Repeat className="text-muted-foreground size-3 shrink-0" />
            </FilterOption>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Board is one of three views (Board/Gantt/Calendar) over the same Task
// rows (specs/ARCHITECTURE.md, раздел 12) — Gantt/Calendar aren't built
// yet, their tabs are disabled placeholders rather than missing entirely,
// so the switcher's shape is already right for when they land.
export function BoardView({ board, onOpenTask, onColumnsChanged }: BoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [subtasksById, setSubtasksById] = useState<Record<string, Task[]>>({});
  const [loadingSubtaskIds, setLoadingSubtaskIds] = useState<Set<string>>(new Set());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeFilterDrag, setActiveFilterDrag] = useState<{ field: string; value: string; label: string } | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<Filters>({ priority: null, assigneeId: null, recurrence: null, overdueOnly: false });
  const [columnOrder, setColumnOrder] = useState<string[]>(board.columns.map((c) => c.id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function load() {
    setTasks(await tasksApi.listBoardTasks(board.id));
  }

  useEffect(() => {
    load();
    tasksApi.listUsers().then(setUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  useEffect(() => {
    setColumnOrder(board.columns.map((c) => c.id));
  }, [board.columns]);

  const orderedColumns = columnOrder.map((id) => board.columns.find((c) => c.id === id)).filter((c): c is Board['columns'][number] => Boolean(c));

  async function addTask(columnId: string, title: string) {
    await tasksApi.createTask({ title, boardId: board.id, columnId });
    load();
  }

  async function addSubtask(parentId: string, title: string) {
    await tasksApi.createTask({ title, parentId });
    const full = await tasksApi.getTask(parentId);
    setSubtasksById((prev) => ({ ...prev, [parentId]: full.subtasks ?? [] }));
    load();
  }

  async function addColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    await tasksApi.createColumn(board.id, newColumnName.trim());
    setNewColumnName('');
    setAddingColumn(false);
    onColumnsChanged();
  }

  async function changeColumnColor(columnId: string, color: string | null) {
    await tasksApi.updateColumn(columnId, { color });
    onColumnsChanged();
  }

  async function renameColumn(columnId: string, name: string) {
    await tasksApi.updateColumn(columnId, { name });
    onColumnsChanged();
  }

  async function updateTask(taskId: string, data: Parameters<typeof tasksApi.updateTask>[1]) {
    const updated = await tasksApi.updateTask(taskId, data);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    // A completion toggle can cascade to the parent task server-side
    // (points: all subtasks done -> parent done; any done -> parent moved
    // to In progress) — simplest to just re-sync from the server rather
    // than reimplement that logic on the client.
    if (data.completed !== undefined) load();
  }

  async function toggleExpand(taskId: string) {
    setExpanded((prev) => {
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
    setSubtasksById((prev) => ({
      ...prev,
      [subtask.parentId!]: (prev[subtask.parentId!] ?? []).map((s) => (s.id === subtask.id ? updated : s)),
    }));
    load();
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith('filter:')) {
      const [, field, value] = id.split(':');
      // assigneeId's value is a user id, not display text — every other
      // field's value is already a readable enum member — so only this
      // one needs resolving to a name for the drag overlay.
      const label = field === 'assigneeId' ? users.find((u) => u.id === value)?.name ?? value : value;
      setActiveFilterDrag({ field, value, label });
      return;
    }
    if (board.columns.some((c) => c.id === id)) {
      setDraggingColumnId(id);
      return;
    }
    setActiveTask(tasks.find((t) => t.id === id) ?? null);
  }

  // Cross-column reflow while dragging — the task moves columns live in
  // state, so its card (rendered as a dashed placeholder while isDragging)
  // visually "arrives" in the column being hovered, instead of only
  // snapping over on drop.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    if (activeId.startsWith('filter:') || draggingColumnId) return;
    const dragged = tasks.find((t) => t.id === activeId);
    if (!dragged) return;
    const overTask = tasks.find((t) => t.id === over.id);
    const overColumnId = overTask ? overTask.columnId : String(over.id);
    if (!overColumnId || overColumnId === dragged.columnId) return;
    setTasks((prev) => prev.map((t) => (t.id === dragged.id ? { ...t, columnId: overColumnId } : t)));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setActiveFilterDrag(null);
    const wasColumnDrag = draggingColumnId;
    setDraggingColumnId(null);
    if (!over) return;

    const activeId = String(active.id);

    if (activeId.startsWith('filter:')) {
      const overTaskForFilter = tasks.find((t) => t.id === over.id);
      if (!overTaskForFilter) return;
      const [, field, value] = activeId.split(':');
      // Dropping an assignee chip ADDS them to the task's assignee list
      // (it can have several now) — every other field replaces its value.
      if (field === 'assigneeId') {
        const ids = overTaskForFilter.assignees.map((a) => a.id);
        if (!ids.includes(value)) await updateTask(overTaskForFilter.id, { assigneeIds: [...ids, value] });
      } else {
        await updateTask(overTaskForFilter.id, { [field]: value } as never);
      }
      return;
    }

    if (wasColumnDrag) {
      const oldIndex = columnOrder.indexOf(activeId);
      const newIndex = columnOrder.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const reordered = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(reordered);
      await tasksApi.reorderColumns(board.id, reordered);
      onColumnsChanged();
      return;
    }

    const dragged = tasks.find((t) => t.id === activeId);
    if (!dragged) return;
    const overTask = tasks.find((t) => t.id === over.id);
    const targetColumnId = overTask ? overTask.columnId : String(over.id);
    if (!targetColumnId) return;

    const columnTasks = tasks.filter((t) => t.columnId === targetColumnId).sort((a, b) => a.order - b.order);
    const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
    const newIndex = overTask ? columnTasks.findIndex((t) => t.id === over.id) : columnTasks.length - 1;
    if (oldIndex === -1) return;

    const reordered = oldIndex === newIndex ? columnTasks : arrayMove(columnTasks, oldIndex, newIndex);
    setTasks((prev) =>
      prev.map((t) => {
        const idx = reordered.findIndex((r) => r.id === t.id);
        return idx === -1 ? t : { ...t, order: idx, columnId: targetColumnId };
      }),
    );
    await Promise.all(reordered.map((t, i) => tasksApi.updateTask(t.id, { order: i, columnId: targetColumnId })));
  }

  const visibleTasks = tasks.filter((t) => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assigneeId && !t.assignees.some((a) => a.id === filters.assigneeId)) return false;
    if (filters.recurrence && t.recurrence !== filters.recurrence) return false;
    if (filters.overdueOnly && !(t.dueDate && !t.completed && new Date(t.dueDate) < new Date())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* FilterToolbar's chips are useDraggable sources that must drop
          onto cards further down — both have to live inside the SAME
          DndContext, or the chips simply don't register as draggable at
          all (this was the actual bug behind "drag-to-assign does
          nothing": the toolbar used to sit in a sibling div outside this
          provider entirely). */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5">
            <span className="bg-background text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm">
              Board
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground/50 inline-flex cursor-not-allowed items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
                  Gantt
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground/50 inline-flex cursor-not-allowed items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
                  Calendar
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </div>

          <FilterToolbar filters={filters} setFilters={setFilters} users={users} />
        </div>

        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {orderedColumns.map((column) => {
              const columnTasks = visibleTasks.filter((t) => t.columnId === column.id).sort((a, b) => a.order - b.order);
              return (
                <BoardColumnContainer
                  key={column.id}
                  column={column}
                  onColorChange={(color) => changeColumnColor(column.id, color)}
                  onRename={(name) => renameColumn(column.id, name)}
                >
                  <AddTaskRow onAdd={(title) => addTask(column.id, title)} />

                  <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={() => onOpenTask(task.id)}
                        expanded={expanded.has(task.id)}
                        onToggleExpand={() => toggleExpand(task.id)}
                        subtasks={subtasksById[task.id]}
                        loadingSubtasks={loadingSubtaskIds.has(task.id)}
                        onToggleSubtask={toggleSubtaskDone}
                        onAddSubtask={(title) => addSubtask(task.id, title)}
                        onUpdate={(data) => updateTask(task.id, data)}
                        users={users}
                      />
                    ))}
                  </SortableContext>
                </BoardColumnContainer>
              );
            })}

            <div className="w-64 shrink-0">
              {addingColumn ? (
                <form onSubmit={addColumn} className="flex gap-1">
                  <Input
                    autoFocus
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onBlur={() => !newColumnName.trim() && setAddingColumn(false)}
                    placeholder="Column name…"
                    className="h-8 text-sm"
                  />
                  <Button type="submit" size="icon" variant="ghost" className="size-8 shrink-0">
                    <Plus className="size-4" />
                  </Button>
                </form>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAddingColumn(true)}>
                  <Plus className="size-4" />
                  Add column
                </Button>
              )}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask && (
            <Card className="w-72 gap-0 py-0 shadow-lg">
              <CardContent className="p-3 text-sm">{activeTask.title}</CardContent>
            </Card>
          )}
          {activeFilterDrag && (
            <div className="bg-background rounded-full border px-2.5 py-1 text-xs shadow-lg">{activeFilterDrag.label}</div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
