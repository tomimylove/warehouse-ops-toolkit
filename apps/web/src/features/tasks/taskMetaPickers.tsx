import { Calendar, Check, Circle, Crown, Flag, Layers, Repeat, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Column, Task, TaskPriority, TaskRecurrence } from './types';

// Shared by every view that renders a task row/card (Board, List, Gantt,
// Calendar) — one real set of quick-edit popovers instead of a copy per
// view. Each badge is its own popover trigger, so changing a field never
// needs opening the drawer.

export function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const PRIORITY_STYLE: Record<Exclude<TaskPriority, 'NONE'>, string> = {
  LOW: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  MEDIUM: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  HIGH: 'bg-red-500/15 text-red-600 dark:text-red-400',
};
export const PRIORITY_ICON_COLOR: Record<TaskPriority, string> = {
  NONE: 'text-muted-foreground/40',
  LOW: 'text-blue-500',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-red-500',
};

export const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const RECURRENCES: Exclude<TaskRecurrence, 'NONE'>[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

export function PriorityPicker({
  task,
  onUpdate,
  open,
  onOpenChange,
}: {
  task: Task;
  onUpdate: (data: { priority: TaskPriority }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {task.priority === 'NONE' ? (
          <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground">
            <Flag className="size-3.5" />
          </button>
        ) : (
          <button type="button" className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', PRIORITY_STYLE[task.priority])}>
            {task.priority.toLowerCase()}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {(['NONE', ...PRIORITIES] as TaskPriority[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              onUpdate({ priority: p });
              onOpenChange(false);
            }}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3 shrink-0', task.priority === p ? 'opacity-100' : 'opacity-0')} />
            <Flag className={cn('size-3 shrink-0', PRIORITY_ICON_COLOR[p])} />
            {p === 'NONE' ? 'No priority' : p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function DueDatePicker({
  task,
  onUpdate,
  open,
  onOpenChange,
}: {
  task: Task;
  onUpdate: (data: { dueDate: string }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const overdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1 text-[10px]',
            task.dueDate ? (overdue ? 'text-destructive font-medium' : 'text-muted-foreground') : 'text-muted-foreground/40 hover:text-muted-foreground',
          )}
        >
          <Calendar className="size-3.5" />
          {task.dueDate && new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <DatePicker
          mode="single"
          selected={task.dueDate ? new Date(task.dueDate) : undefined}
          onSelect={(date) => {
            if (!date) return;
            onUpdate({ dueDate: date.toISOString() });
            onOpenChange(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function RecurrencePicker({
  task,
  onUpdate,
  open,
  onOpenChange,
}: {
  task: Task;
  onUpdate: (data: { recurrence: TaskRecurrence }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className={task.recurrence === 'NONE' ? 'text-muted-foreground/40 hover:text-muted-foreground' : 'text-blue-500'}>
          <Repeat className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {(['NONE', ...RECURRENCES] as TaskRecurrence[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              onUpdate({ recurrence: r });
              onOpenChange(false);
            }}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3 shrink-0', task.recurrence === r ? 'opacity-100' : 'opacity-0')} />
            <Repeat className={cn('size-3 shrink-0', r === 'NONE' ? 'text-muted-foreground/40' : 'text-muted-foreground')} />
            {r === 'NONE' ? "Doesn't repeat" : r.charAt(0) + r.slice(1).toLowerCase()}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Multi-select — a task can have several assignees, so this is a
// checklist (toggling one doesn't close the popover) rather than a
// pick-one-and-close list. The trigger stacks up to 3 avatars with a
// "+N" overflow badge instead of showing just one.
const MAX_ASSIGNEE_AVATARS = 3;

export function AssigneePicker({
  task,
  users,
  onUpdate,
  className,
  open,
  onOpenChange,
}: {
  task: Task;
  users: { id: string; name: string }[];
  onUpdate: (data: { assigneeIds: string[] }) => void;
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  function toggle(userId: string) {
    const ids = task.assignees.map((a) => a.id);
    onUpdate({ assigneeIds: ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId] });
  }

  const shown = task.assignees.slice(0, MAX_ASSIGNEE_AVATARS);
  const overflow = task.assignees.length - shown.length;
  // No assignee of its own: the epic's owner is the effective responsible
  // (specs/features/weekly-meeting.md), shown dimmed so it reads as
  // inherited rather than assigned.
  const inheritedOwner =
    task.assignees.length === 0 && task.epic?.ownerId ? users.find((u) => u.id === task.epic!.ownerId) : undefined;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className={cn('flex items-center', className)}>
          {task.assignees.length === 0 && inheritedOwner ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar size="sm" className="opacity-60 ring-2 ring-dashed ring-violet-400/60">
                  <AvatarFallback className="text-[9px]">{initials(inheritedOwner.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>Epic owner: {inheritedOwner.name}</TooltipContent>
            </Tooltip>
          ) : task.assignees.length === 0 ? (
            <User className="text-muted-foreground/40 hover:text-muted-foreground size-4" />
          ) : (
            <div className="flex -space-x-1.5">
              {shown.map((a) => (
                <Tooltip key={a.id}>
                  <TooltipTrigger asChild>
                    <Avatar size="sm" className="ring-background ring-2">
                      <AvatarFallback className="text-[9px]">{initials(a.name)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{a.name}</TooltipContent>
                </Tooltip>
              ))}
              {overflow > 0 && (
                <Avatar size="sm" className="ring-background ring-2">
                  <AvatarFallback className="text-[9px]">+{overflow}</AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      {/* Top-left of the trigger, not the right edge — this sits at the
          far right of the badge row, so a right-aligned popover used to
          overshoot the card's edge. */}
      <PopoverContent className="w-44 p-1" align="start" side="bottom" onClick={(e) => e.stopPropagation()}>
        {users.map((u) => {
          const checked = task.assignees.some((a) => a.id === u.id);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
            >
              <Check className={cn('size-3 shrink-0', checked ? 'opacity-100' : 'opacity-0')} />
              <Avatar size="sm" className="size-4 shrink-0">
                <AvatarFallback className="text-[8px]">{initials(u.name)}</AvatarFallback>
              </Avatar>
              {u.name}
            </button>
          );
        })}
        {users.length === 0 && <p className="text-muted-foreground px-2 py-1.5 text-xs">No users yet.</p>}
      </PopoverContent>
    </Popover>
  );
}

// Single-select owner of an epic — one accountable person, unlike the
// multi-select assignee list.
export function OwnerPicker({
  task,
  users,
  onUpdate,
  open,
  onOpenChange,
}: {
  task: Task;
  users: { id: string; name: string }[];
  onUpdate: (data: { ownerId: string | null }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className="flex items-center">
          {task.owner ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar size="sm" className="ring-2 ring-violet-400">
                  <AvatarFallback className="text-[9px]">{initials(task.owner.name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>Owner: {task.owner.name}</TooltipContent>
            </Tooltip>
          ) : (
            <Crown className="text-muted-foreground/40 hover:text-muted-foreground size-4" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start" side="bottom" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            onUpdate({ ownerId: null });
            onOpenChange(false);
          }}
          className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
        >
          <Check className={cn('size-3 shrink-0', !task.ownerId ? 'opacity-100' : 'opacity-0')} />
          <Crown className="text-muted-foreground size-3 shrink-0" />
          No owner
        </button>
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => {
              onUpdate({ ownerId: u.id });
              onOpenChange(false);
            }}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3 shrink-0', task.ownerId === u.id ? 'opacity-100' : 'opacity-0')} />
            <Avatar size="sm" className="size-4 shrink-0">
              <AvatarFallback className="text-[8px]">{initials(u.name)}</AvatarFallback>
            </Avatar>
            {u.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Which epic a task belongs to — only epics from the task's own board are
// offered (the backend rejects cross-board links anyway).
export function EpicPicker({
  task,
  epics,
  onUpdate,
  open,
  onOpenChange,
}: {
  task: Task;
  epics: { id: string; title: string }[];
  onUpdate: (data: { epicId: string | null }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (epics.length === 0 && !task.epicId) return null;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button
          type="button"
          className={cn(
            'flex max-w-28 items-center gap-1 text-[10px]',
            task.epic ? 'rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-600 dark:text-violet-400' : 'text-muted-foreground/40 hover:text-muted-foreground',
          )}
        >
          <Layers className="size-3.5 shrink-0" />
          {task.epic && <span className="truncate">{task.epic.title}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start" side="bottom" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            onUpdate({ epicId: null });
            onOpenChange(false);
          }}
          className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
        >
          <Check className={cn('size-3 shrink-0', !task.epicId ? 'opacity-100' : 'opacity-0')} />
          No epic
        </button>
        {epics.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => {
              onUpdate({ epicId: e.id });
              onOpenChange(false);
            }}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3 shrink-0', task.epicId === e.id ? 'opacity-100' : 'opacity-0')} />
            <Layers className="size-3 shrink-0 text-violet-500" />
            <span className="truncate">{e.title}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Status = the board column the task sits in (To do / In progress / …).
export function StatusPicker({
  task,
  columns,
  onUpdate,
  open,
  onOpenChange,
}: {
  task: Task;
  columns: Column[];
  onUpdate: (data: { columnId: string }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const current = columns.find((c) => c.id === task.columnId);
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button type="button" className="hover:bg-accent flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs">
          <Circle className="size-2.5 shrink-0" style={{ color: current?.color ?? '#64748b', fill: current?.color ?? '#64748b' }} />
          {current?.name ?? 'No status'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" side="bottom" onClick={(e) => e.stopPropagation()}>
        {columns.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              onUpdate({ columnId: c.id });
              onOpenChange(false);
            }}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs"
          >
            <Check className={cn('size-3 shrink-0', task.columnId === c.id ? 'opacity-100' : 'opacity-0')} />
            <Circle className="size-2.5 shrink-0" style={{ color: c.color ?? '#64748b', fill: c.color ?? '#64748b' }} />
            {c.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
