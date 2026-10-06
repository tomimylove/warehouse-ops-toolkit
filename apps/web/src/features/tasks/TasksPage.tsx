import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanSquare, Plus } from 'lucide-react';
import { PageHeader, EmptyState, Button, Input } from '../../components/ui';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { tasksApi } from './api';
import { BoardView } from './BoardView';
import { TaskDrawer } from './TaskDrawer';
import type { Board, Project } from './types';

// The project gallery's mini-dashboard card — boards/task counts and a
// completion bar from the list endpoint's aggregates (projects.service.ts),
// "Done" meaning the default Done column, not a stored flag.
function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const pct = project.taskCount > 0 ? Math.round((project.doneCount / project.taskCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="border-border hover:border-primary/50 hover:bg-muted/40 flex flex-col items-start rounded-lg border p-4 text-left transition-colors"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
          <KanbanSquare className="text-muted-foreground size-4" />
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
        </span>
      </div>

      <h3 className="mt-3 truncate text-sm font-medium">{project.name}</h3>

      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
        <span>
          {project.boards.length} board{project.boards.length !== 1 ? 's' : ''}
        </span>
        <span>
          {project.taskCount} task{project.taskCount !== 1 ? 's' : ''}
        </span>
      </div>

      {project.taskCount > 0 ? (
        <div className="mt-3 w-full">
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {project.doneCount}/{project.taskCount} done · {pct}%
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-xs">No tasks yet</p>
      )}
    </button>
  );
}

// A board tab — double-click to rename, drag (press+move, same threshold
// trick as board columns/cards) to reorder among its siblings.
function BoardTab({ board, active, onSelect, onRename }: { board: Board; active: boolean; onSelect: () => void; onRename: (name: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: board.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(board.name);

  function commit() {
    setRenaming(false);
    if (name.trim() && name.trim() !== board.name) onRename(name.trim());
    else setName(board.name);
  }

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="border-muted-foreground/30 h-8 w-24 rounded-md border-2 border-dashed" />;
  }

  if (renaming) {
    return (
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setName(board.name);
            setRenaming(false);
          }
        }}
        className="bg-background h-8 w-28 rounded-md border px-2 text-sm outline-none"
      />
    );
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setRenaming(true);
      }}
      className={cn(
        'inline-flex h-8 touch-none items-center rounded-md px-2.5 text-sm font-medium transition-all',
        active ? 'bg-background text-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground',
      )}
    >
      {board.name}
    </button>
  );
}

export function TasksPage() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function load() {
    setLoading(true);
    setProjects(await tasksApi.listProjects());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Project selection lives entirely in the URL now (the sidebar's
  // Projects submenu links to /tasks/:projectId) — no internal
  // activeProjectId state to keep in sync with it.
  const activeProject = projects.find((p) => p.id === projectId) ?? null;

  useEffect(() => {
    if (activeProject && !activeProject.boards.some((b) => b.id === activeBoardId)) {
      setActiveBoardId(activeProject.boards[0]?.id ?? null);
    }
  }, [activeProject, activeBoardId]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const project = await tasksApi.createProject(newProjectName.trim());
    setNewProjectName('');
    await load();
    navigate(`/tasks/${project.id}`);
  }

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProject || !newBoardName.trim()) return;
    const board = await tasksApi.createBoard(activeProject.id, newBoardName.trim());
    setNewBoardName('');
    await load();
    setActiveBoardId(board.id);
  }

  async function renameBoard(boardId: string, name: string) {
    if (!activeProject) return;
    await tasksApi.updateBoard(activeProject.id, boardId, { name });
    await load();
  }

  async function handleBoardDragEnd(event: DragEndEvent) {
    if (!activeProject) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = activeProject.boards.map((b) => b.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(ids, oldIndex, newIndex);
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== activeProject.id
          ? p
          : { ...p, boards: reordered.map((id) => p.boards.find((b) => b.id === id)!) },
      ),
    );
    await tasksApi.reorderBoards(activeProject.id, reordered);
  }

  const boardSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const activeBoard = activeProject?.boards.find((b) => b.id === activeBoardId) ?? null;

  return (
    // Same mx-auto + max-w-[1360px] pattern as Announcements — the
    // previous max-w-4xl, centered in a much wider content area, left a
    // lopsided gap on the left that didn't match any other page.
    <section className="mx-auto w-full max-w-[1360px]">
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button" onClick={() => navigate('/tasks')} className="hover:text-foreground">
                Projects
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {activeProject && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeProject.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title={activeProject?.name ?? 'Projects'} />

      {!loading && !activeProject && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <EmptyState message="No projects yet — create the first one." />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onOpen={() => navigate(`/tasks/${p.id}`)} />
              ))}
            </div>
          )}
          <form onSubmit={createProject} className="flex max-w-sm gap-2">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name"
            />
            <Button type="submit">Create</Button>
          </form>
        </div>
      )}

      {activeProject && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <DndContext sensors={boardSensors} collisionDetection={closestCenter} onDragEnd={handleBoardDragEnd}>
              <SortableContext items={activeProject.boards.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                <div className="bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5">
                  {activeProject.boards.map((b) => (
                    <BoardTab key={b.id} board={b} active={b.id === activeBoardId} onSelect={() => setActiveBoardId(b.id)} onRename={(name) => renameBoard(b.id, name)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <form onSubmit={createBoard} className="flex items-center gap-1">
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="New board…"
                className="h-8 w-32 text-sm"
              />
              <Button type="submit" size="icon" variant="ghost" className="size-8">
                <Plus className="size-4" />
              </Button>
            </form>
          </div>

          {activeBoard ? (
            <BoardView
              key={`${activeBoard.id}-${refreshKey}`}
              board={activeBoard}
              onOpenTask={setOpenTaskId}
              onColumnsChanged={load}
            />
          ) : (
            <EmptyState message="No boards yet — add one above." />
          )}
        </>
      )}

      <TaskDrawer
        taskId={openTaskId}
        onOpenChange={(open) => !open && setOpenTaskId(null)}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </section>
  );
}
