import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, Layers, Plus, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import type { Board, Task, TaskPriority } from './types';

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

const PRIORITY_STYLE: Record<Exclude<TaskPriority, 'NONE'>, string> = {
  LOW: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  MEDIUM: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  HIGH: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'NONE') return null;
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', PRIORITY_STYLE[priority])}>
      {priority.toLowerCase()}
    </span>
  );
}

function DueBadge({ dueDate, completed }: { dueDate: string; completed: boolean }) {
  const overdue = !completed && new Date(dueDate) < new Date();
  return (
    <span className={cn('text-[10px]', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
      {new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
    </span>
  );
}

function SubtaskRow({ subtask, onToggle, onOpen }: { subtask: Task; onToggle: () => void; onOpen: () => void }) {
  return (
    <div className="hover:bg-muted/60 flex items-center gap-2 rounded-md px-2 py-1 text-xs">
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
        {subtask.completed && <span className="text-[9px] leading-none">✓</span>}
      </button>
      <button
        type="button"
        onClick={onOpen}
        className={cn('flex-1 truncate text-left', subtask.completed && 'text-muted-foreground line-through')}
      >
        {subtask.title}
      </button>
    </div>
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
}: {
  task: Task;
  onOpen: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  subtasks: Task[] | undefined;
  loadingSubtasks: boolean;
  onToggleSubtask: (subtask: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const subtaskCount = task._count?.subtasks ?? 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="cursor-pointer touch-none gap-0 py-0"
        onClick={onOpen}
        {...attributes}
        {...listeners}
      >
        <CardContent className="space-y-2 p-3 text-sm">
          <div className="flex items-start gap-1.5">
            {subtaskCount > 0 && <Layers className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />}
            <span className="flex-1">{task.title}</span>
          </div>

          {(task.priority !== 'NONE' || task.dueDate || task.recurrence !== 'NONE' || task.assignee) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              {task.dueDate && <DueBadge dueDate={task.dueDate} completed={task.completed} />}
              {task.recurrence !== 'NONE' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Repeat className="text-muted-foreground size-3" />
                  </TooltipTrigger>
                  <TooltipContent>Repeats {task.recurrence.toLowerCase()}</TooltipContent>
                </Tooltip>
              )}
              {task.assignee && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar size="sm" className="ml-auto">
                      <AvatarFallback className="text-[9px]">{initials(task.assignee.name)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{task.assignee.name}</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {subtaskCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="text-muted-foreground flex items-center gap-1 text-xs"
            >
              <ChevronDown className={cn('size-3 transition-transform', expanded && 'rotate-180')} />
              {subtaskCount} subtask{subtaskCount !== 1 ? 's' : ''}
            </button>
          )}
        </CardContent>
      </Card>

      {expanded && (
        <div className="mt-1 ml-2 flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
          {loadingSubtasks && <p className="text-muted-foreground px-2 py-1 text-xs">Loading…</p>}
          {!loadingSubtasks &&
            subtasks?.map((sub) => (
              <SubtaskRow key={sub.id} subtask={sub} onToggle={() => onToggleSubtask(sub)} onOpen={() => onOpen()} />
            ))}
        </div>
      )}
    </div>
  );
}

function BoardColumn({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: columnId });
  return (
    <div ref={setNodeRef} className="flex min-h-5 flex-col gap-2">
      {children}
    </div>
  );
}

// Board is the only view shipped so far — Gantt/Calendar are the same Task
// rows under a different layout (specs/ARCHITECTURE.md, раздел 12), not
// separate modules. Cross-column and within-column drag both go through
// dnd-kit's DndContext below; reordering persists as a per-task `order`
// PATCH, a move persists as `columnId` + `order`.
export function BoardView({ board, onOpenTask, onColumnsChanged }: BoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draftByColumn, setDraftByColumn] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [subtasksById, setSubtasksById] = useState<Record<string, Task[]>>({});
  const [loadingSubtaskIds, setLoadingSubtaskIds] = useState<Set<string>>(new Set());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function load() {
    setTasks(await tasksApi.listBoardTasks(board.id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);

  async function addTask(columnId: string, e: React.FormEvent) {
    e.preventDefault();
    const title = draftByColumn[columnId]?.trim();
    if (!title) return;
    await tasksApi.createTask({ title, boardId: board.id, columnId });
    setDraftByColumn((prev) => ({ ...prev, [columnId]: '' }));
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
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === event.active.id) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const dragged = tasks.find((t) => t.id === active.id);
    if (!dragged) return;

    const overTask = tasks.find((t) => t.id === over.id);
    const targetColumnId = overTask ? overTask.columnId : String(over.id);
    if (!targetColumnId) return;

    if (targetColumnId === dragged.columnId) {
      const columnTasks = tasks.filter((t) => t.columnId === targetColumnId).sort((a, b) => a.order - b.order);
      const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      setTasks((prev) =>
        prev.map((t) => {
          const idx = reordered.findIndex((r) => r.id === t.id);
          return idx === -1 ? t : { ...t, order: idx };
        }),
      );
      await Promise.all(reordered.map((t, i) => tasksApi.updateTask(t.id, { order: i })));
    } else {
      const targetTasks = tasks.filter((t) => t.columnId === targetColumnId);
      const newOrder = targetTasks.length;
      setTasks((prev) =>
        prev.map((t) => (t.id === dragged.id ? { ...t, columnId: targetColumnId, order: newOrder } : t)),
      );
      await tasksApi.updateTask(dragged.id, { columnId: targetColumnId, order: newOrder });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {board.columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.columnId === column.id).sort((a, b) => a.order - b.order);
          return (
            <div key={column.id} className="w-72 shrink-0">
              <h3 className="text-muted-foreground mb-2 px-1 text-sm font-medium">{column.name}</h3>

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
                    />
                  ))}
                </BoardColumn>
              </SortableContext>

              <form onSubmit={(e) => addTask(column.id, e)} className="mt-2 flex gap-1">
                <Input
                  value={draftByColumn[column.id] ?? ''}
                  onChange={(e) => setDraftByColumn((prev) => ({ ...prev, [column.id]: e.target.value }))}
                  placeholder="Add task…"
                  className="h-8 text-sm"
                />
                <Button type="submit" size="icon" variant="ghost" className="size-8 shrink-0">
                  <Plus className="size-4" />
                </Button>
              </form>
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
      </DragOverlay>
    </DndContext>
  );
}
