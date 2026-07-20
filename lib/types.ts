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

export interface Attachment {
  id: string;
  task_id: string;
  name: string;
  path: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  name: string;
  department: string;
  contact: string;
  category: string;
  image_url: string;
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

export type SortKey =
  | "name" | "department" | "contact" | "category"
  | "type" | "status" | "start_date" | "due_date";
