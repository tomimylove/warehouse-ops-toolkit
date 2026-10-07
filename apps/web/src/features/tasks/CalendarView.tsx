import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tasksApi } from './api';
import { PRIORITY_ICON_COLOR } from './taskMetaPickers';
import type { Board, Task } from './types';

interface CalendarViewProps {
  board: Board;
  onOpenTask: (taskId: string) => void;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Month grid — each cell lists the top-level tasks (not subtasks, same
// exclusion the project gallery's stats use) due that day. Tasks with no
// due date have nowhere to render on a calendar, so they're called out
// separately above the grid instead of being silently dropped.
export function CalendarView({ board, onOpenTask }: CalendarViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    tasksApi.listBoardTasks(board.id).then(setTasks);
  }, [board.id]);

  const undated = tasks.filter((t) => !t.dueDate);

  const days = useMemo(() => {
    const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    // Monday-first grid: shift back to the Monday on/before the 1st.
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [month]);

  const today = new Date();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </Button>
          <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {undated.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border p-2">
          <span className="text-muted-foreground shrink-0 text-xs">No due date:</span>
          {undated.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onOpenTask(t.id)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs',
                t.completed && 'text-muted-foreground line-through',
              )}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="bg-muted text-muted-foreground px-2 py-1.5 text-center text-xs font-medium">
            {d}
          </div>
        ))}
        {days.map((date) => {
          const inMonth = date.getMonth() === month.getMonth();
          const dayTasks = tasks.filter((t) => t.dueDate && sameDay(new Date(t.dueDate), date));
          return (
            <div
              key={date.toISOString()}
              className={cn('bg-background flex min-h-24 flex-col gap-1 p-1.5', !inMonth && 'bg-muted/30')}
            >
              <span className={cn('text-xs', !inMonth && 'text-muted-foreground/50', sameDay(date, today) && 'text-primary font-semibold')}>
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onOpenTask(t.id)}
                    className={cn(
                      'hover:bg-accent flex items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight',
                      t.completed && 'text-muted-foreground line-through',
                    )}
                  >
                    <span className={cn('size-1.5 shrink-0 rounded-full', t.priority === 'NONE' ? 'bg-muted-foreground/30' : PRIORITY_ICON_COLOR[t.priority].replace('text-', 'bg-'))} />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
