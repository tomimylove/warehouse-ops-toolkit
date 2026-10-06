import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Check, ChevronDown, Flag, GripVertical, LayoutGrid, Plus, Repeat, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import type { Board, Task, TaskPriority, TaskRecurrence } from './types';

interface BoardViewProps {
  board: Board;
  onOpenTask: (taskId: string) => void;
  onColumnsChanged: () => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
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

const PRIORITY_STYLE: Record<Exclude<TaskPriority, 'NONE'>, string> = {
  LOW: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  MEDIUM: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  HIGH: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const RECURRENCES: Exclude<TaskRecurrence, 'NONE'>[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

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

function ColumnHeader({ column, onColorChange }: { column: { name: string; color: string | null }; onColorChange: (color: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const color = column.color ?? DEFAULT_COLUMN_COLOR;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{ background: color }}
          className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-white"
        >
          <span className="truncate">{column.name}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="start">
        <ColorSwatchGrid
          value={column.color}
          onPick={(c) => {
            onColorChange(c);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------
// "+ Add task" above the column's first card — a plain link until
// clicked, then an inline card-shaped input; Enter saves, Escape/blur
// (when empty) cancels back to the link.
// ---------------------------------------------------------------------
function AddTaskRow({ onAdd }: { onAdd: (title: string) => void | Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    await onAdd(trimmed);
    setTitle('');
    inputRef.current?.focus();
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
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title.trim() && setAdding(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setTitle('');
                setAdding(false);
              }
            }}
            placeholder="Task title…"
            className="w-full bg-transparent text-sm outline-none"
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

function TaskCard({
  task,
  onOpen,
  expanded,
  onToggleExpand,
  subtasks,
  loadingSubtasks,
  onToggleSubtask,
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
  onUpdate: (data: Parameters<typeof tasksApi.updateTask>[1]) => void;
  users: { id: string; name: string }[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const stats = task.subtaskStats;

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style}>
        <div className="border-muted-foreground/30 h-[52px] rounded-lg border-2 border-dashed" />
      </div>
    );
  }

  return (
    <div>
      <div ref={setNodeRef} style={style}>
        <Card className="gap-0 py-0">
          <CardContent className="space-y-2 p-3 text-sm">
            <div className="flex items-start gap-1.5">
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="text-muted-foreground/50 hover:text-muted-foreground mt-0.5 shrink-0 touch-none"
              >
                <GripVertical className="size-3.5" />
              </button>
              <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
                {task.title}
              </button>
            </div>

            {(task.priority !== 'NONE' || task.dueDate || task.recurrence !== 'NONE' || task.assignee) && (
              <div className="flex flex-wrap items-center gap-1.5 pl-5">
                <PriorityPicker task={task} onUpdate={onUpdate} />
                {task.dueDate && <DueDatePicker task={task} onUpdate={onUpdate} />}
                {task.recurrence !== 'NONE' && <RecurrencePicker task={task} onUpdate={onUpdate} />}
                <AssigneePicker task={task} users={users} onUpdate={onUpdate} className="ml-auto" />
              </div>
            )}

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
        <div className="border-border mt-1 ml-3.5 flex flex-col gap-1 border-l py-0.5 pl-2.5" onClick={(e) => e.stopPropagation()}>
          {loadingSubtasks && <p className="text-muted-foreground px-2 py-1 text-xs">Loading…</p>}
          {!loadingSubtasks &&
            subtasks?.map((sub) => (
              <SubtaskRow key={sub.id} subtask={sub} onToggle={() => onToggleSubtask(sub)} onOpen={onOpen} />
            ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Per-card quick-edit popovers — every badge on the card is itself the
// trigger, so changing priority/assignee/due date/recurrence never needs
// opening the drawer.
// ---------------------------------------------------------------------
function PriorityPicker({ task, onUpdate }: { task: Task; onUpdate: (data: { priority: TaskPriority }) => void }) {
  if (task.priority === 'NONE') return null;
  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button
          type="button"
          className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', PRIORITY_STYLE[task.priority])}
        >
          {task.priority.toLowerCase()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {(['NONE', ...PRIORITIES] as TaskPriority[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onUpdate({ priority: p })}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3', task.priority === p ? 'opacity-100' : 'opacity-0')} />
            {p === 'NONE' ? 'No priority' : p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function DueDatePicker({ task, onUpdate }: { task: Task; onUpdate: (data: { dueDate: string }) => void }) {
  const overdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className={cn('text-[10px]', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
          {task.dueDate && new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" onClick={(e) => e.stopPropagation()}>
        <input
          type="date"
          defaultValue={task.dueDate?.slice(0, 10) ?? ''}
          onChange={(e) => e.target.value && onUpdate({ dueDate: new Date(e.target.value).toISOString() })}
          className="bg-background text-sm outline-none"
        />
      </PopoverContent>
    </Popover>
  );
}

function RecurrencePicker({ task, onUpdate }: { task: Task; onUpdate: (data: { recurrence: TaskRecurrence }) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className="text-muted-foreground">
          <Repeat className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {(['NONE', ...RECURRENCES] as TaskRecurrence[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onUpdate({ recurrence: r })}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3', task.recurrence === r ? 'opacity-100' : 'opacity-0')} />
            {r === 'NONE' ? "Doesn't repeat" : r.charAt(0) + r.slice(1).toLowerCase()}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function AssigneePicker({
  task,
  users,
  onUpdate,
  className,
}: {
  task: Task;
  users: { id: string; name: string }[];
  onUpdate: (data: { assigneeId: string | null }) => void;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className={className}>
          {task.assignee ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar size="sm">
                  <AvatarFallback className="text-[9px]">{initials(task.assignee.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{task.assignee.name}</TooltipContent>
            </Tooltip>
          ) : (
            <User className="text-muted-foreground/50 size-4" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onUpdate({ assigneeId: null })}
          className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
        >
          <Check className={cn('size-3', !task.assigneeId ? 'opacity-100' : 'opacity-0')} />
          Unassigned
        </button>
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onUpdate({ assigneeId: u.id })}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3', task.assigneeId === u.id ? 'opacity-100' : 'opacity-0')} />
            {u.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function BoardColumn({ columnId, children }: { columnId: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: columnId });
  return (
    <div ref={setNodeRef} className="flex min-h-5 flex-col gap-2">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// Filter/assign toolbar — click a value to filter the board by it; drag
// the same value onto a card to assign it there instead. Each value is a
// small useDraggable item (id "filter:<field>:<value>") living in the
// same DndContext as the cards, so a drop can land on either.
// ---------------------------------------------------------------------
function FilterOption({ id, label, active, onClick, children }: { id: string; label: string; active: boolean; onClick: () => void; children?: React.ReactNode }) {
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
            />
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
            />
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
            />
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
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<Filters>({ priority: null, assigneeId: null, recurrence: null, overdueOnly: false });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function load() {
    setTasks(await tasksApi.listBoardTasks(board.id));
  }

  useEffect(() => {
    load();
    tasksApi.listUsers().then(setUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  async function addTask(columnId: string, title: string) {
    await tasksApi.createTask({ title, boardId: board.id, columnId });
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

  async function updateTask(taskId: string, data: Parameters<typeof tasksApi.updateTask>[1]) {
    const updated = await tasksApi.updateTask(taskId, data);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
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
      setActiveFilterDrag({ field, value, label: value });
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
    if (activeId.startsWith('filter:')) return;
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
    if (!over) return;

    const activeId = String(active.id);
    if (activeId.startsWith('filter:')) {
      const overTaskForFilter = tasks.find((t) => t.id === over.id);
      if (!overTaskForFilter) return;
      const [, field, value] = activeId.split(':');
      if (field === 'assigneeId') await updateTask(overTaskForFilter.id, { assigneeId: value });
      else await updateTask(overTaskForFilter.id, { [field]: value } as never);
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
    if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
    if (filters.recurrence && t.recurrence !== filters.recurrence) return false;
    if (filters.overdueOnly && !(t.dueDate && !t.completed && new Date(t.dueDate) < new Date())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5">
          <span className="bg-background text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm">
            <LayoutGrid className="size-3.5" />
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {board.columns.map((column) => {
            const columnTasks = visibleTasks.filter((t) => t.columnId === column.id).sort((a, b) => a.order - b.order);
            return (
              <div key={column.id} className="w-72 shrink-0 overflow-hidden rounded-lg" style={{ background: hexToRgba(column.color ?? DEFAULT_COLUMN_COLOR, 0.08) }}>
                <ColumnHeader column={column} onColorChange={(color) => changeColumnColor(column.id, color)} />

                <div className="flex flex-col gap-2 p-2">
                  <AddTaskRow onAdd={(title) => addTask(column.id, title)} />

                  <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <BoardColumn columnId={column.id}>
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
                          onUpdate={(data) => updateTask(task.id, data)}
                          users={users}
                        />
                      ))}
                    </BoardColumn>
                  </SortableContext>
                </div>
              </div>
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
