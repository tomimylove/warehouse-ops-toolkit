import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
    <section className="mx-auto max-w-4xl">
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

      {!loading && projects.length === 0 && (
        <div className="space-y-4">
          <EmptyState message="No projects yet — create the first one." />
          <form onSubmit={createProject} className="flex max-w-sm gap-2">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
            />
            <Button type="submit">Create</Button>
          </form>
        </div>
      )}

      {!loading && projects.length > 0 && !activeProject && (
        <div className="space-y-4">
          <EmptyState message="Pick a project from the sidebar, or create a new one." />
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
            <BoardView key={`${activeBoard.id}-${refreshKey}`} board={activeBoard} onOpenTask={setOpenTaskId} />
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
