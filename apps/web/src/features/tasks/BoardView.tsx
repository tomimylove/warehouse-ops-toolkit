import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tasksApi } from './api';
import type { Board, Task } from './types';

interface BoardViewProps {
  board: Board;
  onOpenTask: (taskId: string) => void;
}

// Board is the only view shipped in this first slice — Gantt/Calendar are
// the same Task rows under a different layout, added later
// (specs/ARCHITECTURE.md, раздел 12), not separate modules. No
// drag-and-drop yet either; moving a task between columns will come with
// the view switcher.
export function BoardView({ board, onOpenTask }: BoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draftByColumn, setDraftByColumn] = useState<Record<string, string>>({});

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

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {board.columns.map((column) => (
        <div key={column.id} className="w-72 shrink-0">
          <h3 className="text-muted-foreground mb-2 px-1 text-sm font-medium">{column.name}</h3>
          <div className="flex flex-col gap-2">
            {tasks
              .filter((t) => t.columnId === column.id)
              .map((task) => (
                <Card key={task.id} className="cursor-pointer" onClick={() => onOpenTask(task.id)}>
                  <CardContent className="p-3 text-sm">{task.title}</CardContent>
                </Card>
              ))}
          </div>
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
      ))}
    </div>
  );
}
