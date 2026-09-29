import { request } from '../../lib/rest-api-provider';
import type { Board, Project, Task } from './types';

// Dedicated client, not the generic DataProvider — Tasks' routes are
// nested (/projects/:id/boards) and include a non-CRUD one (/tasks/mine),
// neither of which fits the flat list/get/create/update/remove shape used
// for Announcements.
export const tasksApi = {
  listProjects: () => request<Project[]>('/projects'),
  createProject: (name: string) => request<Project>('/projects', { method: 'POST', body: JSON.stringify({ name }) }),

  listBoards: (projectId: string) => request<Board[]>(`/projects/${projectId}/boards`),
  createBoard: (projectId: string, name: string) =>
    request<Board>(`/projects/${projectId}/boards`, { method: 'POST', body: JSON.stringify({ name }) }),

  listBoardTasks: (boardId: string) => request<Task[]>(`/tasks?boardId=${boardId}`),
  listMyNotes: () => request<Task[]>('/tasks/mine'),
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (data: {
    title: string;
    description?: string;
    boardId?: string;
    columnId?: string;
    parentId?: string;
  }) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Pick<Task, 'title' | 'description' | 'columnId'>>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
