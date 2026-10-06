import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { KanbanSquare, Plus } from 'lucide-react';
import { PageHeader, EmptyState, Button, Input } from '../../components/ui';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import type { Project } from './types';

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

      <PageHeader
        title={activeProject?.name ?? 'Projects'}
        subtitle="Project → Board → Column → Task, same rows power Board/Gantt/Calendar."
      />

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
            <Tabs value={activeBoardId ?? ''} onValueChange={setActiveBoardId}>
              <TabsList>
                {activeProject.boards.map((b) => (
                  <TabsTrigger key={b.id} value={b.id}>
                    {b.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
