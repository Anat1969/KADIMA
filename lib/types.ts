export type TaskType = "external" | "initiative";
export type TaskStatus = "waiting" | "in_progress" | "ready" | "delayed" | "draft" | "done";

export interface TaskStep {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  note: string;
  order_index: number;
}

export interface Task {
  id: string;
  user_id?: string;
  name: string;
  department: string;
  contact: string;
  type: TaskType;
  status: TaskStatus;
  start_date: string;
  due_date: string;
  raw_material: string;
  deliverable: string;
  notes: string;
  next_step: string;
  steps: TaskStep[];
  updated_at: string;
}

export type SortKey = "name" | "department" | "contact" | "type" | "status" | "start_date" | "due_date";
