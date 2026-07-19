import type { TaskStatus, TaskType } from "./types";

export const STATUS_MAP: Record<TaskStatus, { label: string; fg: string; bg: string }> = {
  waiting:     { label: "ממתין",   fg: "text-waiting",  bg: "bg-waitingBg" },
  in_progress: { label: "בעבודה",  fg: "text-progress", bg: "bg-progressBg" },
  ready:       { label: "מוכן",    fg: "text-ready",    bg: "bg-readyBg" },
  delayed:     { label: "מתאחר",   fg: "text-delayed",  bg: "bg-delayedBg" },
  draft:       { label: "טיוטה",   fg: "text-draft",    bg: "bg-draftBg" },
  done:        { label: "הושלם",   fg: "text-accent",   bg: "bg-accentSoft" }
};

export const TYPE_MAP: Record<TaskType, string> = {
  external: "משימה",
  initiative: "יוזמה"
};

export const STATUS_ORDER: TaskStatus[] = ["delayed", "ready", "in_progress", "waiting", "draft", "done"];
