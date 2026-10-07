import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import type { Board, Task } from './types';

interface GanttViewProps {
  board: Board;
  onOpenTask: (taskId: string) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_WIDTH = 28; // px

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const PRIORITY_BAR: Record<Task['priority'], string> = {
  NONE: 'bg-muted-foreground/40',
  LOW: 'bg-blue-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-red-500',
};

// One row per top-level task, a bar from its creation date to its due
// date (or a short "undated" marker at today if it has none) against a
// day-by-day timeline header. Simple on purpose — the first cut of a
// Gantt view, not a full dependency/critical-path tool.
export function GanttView({ board, onOpenTask }: GanttViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    tasksApi.listBoardTasks(board.id).then(setTasks);
  }, [board.id]);

  const today = startOfDay(new Date());

  const { rangeStart, days } = useMemo(() => {
    const dates = tasks.flatMap((t) => [new Date(t.createdAt), t.dueDate ? new Date(t.dueDate) : null].filter((d): d is Date => Boolean(d)));
    const earliest = dates.length ? startOfDay(new Date(Math.min(...dates.map((d) => d.getTime())))) : today;
    const latest = dates.length ? startOfDay(new Date(Math.max(...dates.map((d) => d.getTime())))) : today;
    const start = new Date(Math.min(earliest.getTime(), today.getTime()));
    start.setDate(start.getDate() - 2);
    const end = new Date(Math.max(latest.getTime(), today.getTime()));
    end.setDate(end.getDate() + 5);
    const count = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
    return { rangeStart: start, days: Array.from({ length: count }, (_, i) => new Date(start.getTime() + i * DAY_MS)) };
  }, [tasks, today]);

  function offsetDays(date: Date) {
    return Math.round((startOfDay(date).getTime() - rangeStart.getTime()) / DAY_MS);
  }

  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No tasks on this board yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div style={{ width: days.length * DAY_WIDTH + 200 }}>
        {/* Header row: day-of-month, grouped into month labels below it
            would be a nice-to-have but isn't essential for a first cut. */}
        <div className="bg-muted sticky top-0 flex border-b">
          <div className="w-[200px] shrink-0 px-3 py-1.5 text-xs font-medium">Task</div>
          <div className="flex">
            {days.map((d) => (
              <div
                key={d.toISOString()}
                style={{ width: DAY_WIDTH }}
                className={cn(
                  'text-muted-foreground border-border/60 shrink-0 border-l py-1.5 text-center text-[10px]',
                  d.getTime() === today.getTime() && 'bg-primary/10 text-primary font-semibold',
                )}
              >
                {d.getDate()}
              </div>
            ))}
          </div>
        </div>

        {tasks.map((task) => {
          const dueDate = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;
          const createdDate = startOfDay(new Date(task.createdAt));
          const barStart = Math.min(offsetDays(createdDate), dueDate ? offsetDays(dueDate) : offsetDays(createdDate));
          const barEnd = dueDate ? offsetDays(dueDate) : offsetDays(createdDate);
          const barLen = Math.max(1, barEnd - barStart + 1);

          return (
            <div key={task.id} className="flex items-center border-b last:border-b-0">
              <button
                type="button"
                onClick={() => onOpenTask(task.id)}
                className={cn(
                  'w-[200px] shrink-0 truncate px-3 py-2 text-left text-xs',
                  task.completed && 'text-muted-foreground line-through',
                )}
              >
                {task.title}
              </button>
              <div className="relative flex" style={{ width: days.length * DAY_WIDTH, height: 32 }}>
                {days.map((d, i) => (
                  <div
                    key={i}
                    style={{ width: DAY_WIDTH }}
                    className={cn('border-border/60 h-full shrink-0 border-l', d.getTime() === today.getTime() && 'bg-primary/5')}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  style={{ left: barStart * DAY_WIDTH + 2, width: barLen * DAY_WIDTH - 4 }}
                  className={cn('absolute top-1/2 h-4 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100', PRIORITY_BAR[task.priority])}
                  title={task.title}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
