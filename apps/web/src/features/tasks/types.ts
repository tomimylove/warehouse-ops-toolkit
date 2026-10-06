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
  createdAt: string;
  updatedAt: string;
  subtasks?: Task[];
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
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
