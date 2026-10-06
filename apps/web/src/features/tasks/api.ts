import { request } from '../../lib/rest-api-provider';
import type { Board, Column, Project, Task, TaskActivity, TaskComment, TaskPriority, TaskRecurrence } from './types';

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
  updateBoard: (projectId: string, boardId: string, data: Partial<Pick<Board, 'name' | 'order'>>) =>
    request<Board>(`/projects/${projectId}/boards/${boardId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  reorderBoards: (projectId: string, orderedIds: string[]) =>
    request<Board[]>(`/projects/${projectId}/boards/reorder`, { method: 'PATCH', body: JSON.stringify({ orderedIds }) }),
  createColumn: (boardId: string, name: string) =>
    request<Column>(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify({ name }) }),
  updateColumn: (id: string, data: Partial<Pick<Column, 'name' | 'color'>>) =>
    request<Column>(`/columns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  reorderColumns: (boardId: string, orderedIds: string[]) =>
    request<Board>(`/boards/${boardId}/columns/reorder`, { method: 'PATCH', body: JSON.stringify({ orderedIds }) }),

  listBoardTasks: (boardId: string) => request<Task[]>(`/tasks?boardId=${boardId}`),
  listMyNotes: () => request<Task[]>('/tasks/mine'),
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (data: {
    title: string;
    description?: string;
    boardId?: string;
    columnId?: string;
    parentId?: string;
    dueDate?: string;
    priority?: TaskPriority;
    recurrence?: TaskRecurrence;
    assigneeId?: string;
  }) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (
    id: string,
    data: Partial<
      Pick<Task, 'title' | 'description' | 'columnId' | 'order' | 'dueDate' | 'priority' | 'recurrence' | 'completed'> & {
        assigneeId: string | null;
      }
    >,
  ) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  listComments: (taskId: string) => request<TaskComment[]>(`/tasks/${taskId}/comments`),
  createComment: (taskId: string, text: string, replyToId?: string) =>
    request<TaskComment>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ text, replyToId }) }),
  updateComment: (taskId: string, commentId: string, text: string) =>
    request<TaskComment>(`/tasks/${taskId}/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  removeComment: (taskId: string, commentId: string) =>
    request<void>(`/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
  toggleCommentReaction: (taskId: string, commentId: string, emoji: string) =>
    request<TaskComment>(`/tasks/${taskId}/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
  listActivity: (taskId: string) => request<TaskActivity[]>(`/tasks/${taskId}/activity`),

  listUsers: () => request<{ id: string; name: string; email: string }[]>('/users'),
};
