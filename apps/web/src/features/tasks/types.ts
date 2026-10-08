export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskRecurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type TaskType = 'TASK' | 'EPIC';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  boardId: string | null;
  columnId: string | null;
  order: number;
  authorId: string;
  parentId: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  recurrence: TaskRecurrence;
  assignees: { id: string; name: string }[];
  type: TaskType;
  epicId: string | null;
  epic: { id: string; title: string; ownerId: string | null } | null;
  ownerId: string | null;
  owner: { id: string; name: string } | null;
  sourceUrl: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  subtasks?: Task[];
  // Board-list rows carry this instead of the full `subtasks` relation
  // (subtasks live with boardId: null, so a board query can't eager-load
  // them the way GET /tasks/:id does) — enough for the card's progress
  // bar/chevron without an N+1 fetch per card.
  subtaskStats?: { total: number; done: number } | null;
  // Epic rows carry progress over their tasks (not subtasks).
  epicStats?: { total: number; done: number } | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  author: { id: string; name: string };
  text: string;
  createdAt: string;
  reactions: Record<string, { id: string; name: string }[]>;
  replyTo: { id: string; text: string; author: { id: string; name: string } } | null;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  actorId: string;
  actor: { id: string; name: string };
  message: string;
  createdAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color: string | null;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  order: number;
  columns: Column[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  boards: Board[];
  // Mini-dashboard counts from the list endpoint — top-level tasks only
  // (subtasks excluded), "done" matched by column name (see
  // projects.service.ts), not a stored flag.
  taskCount: number;
  doneCount: number;
}
