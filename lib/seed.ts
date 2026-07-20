import type { Task } from "./types";
import { uid } from "./utils";

// שלוש הרשומות הפתיחה של המשתמשת. אין כאן נתוני הדגמה.
export function seedTasks(): Task[] {
  const today = new Date().toISOString().slice(0, 10);

  const t = (name: string): Task => ({
    id: uid(),
    name,
    department: "אגף נכסים",
    contact: "",
    category: "מדיניות",
    image_url: "",
    type: "external",
    status: "done",
    start_date: today,
    due_date: today,
    raw_material: "",
    deliverable: "",
    notes: "",
    next_step: "",
    steps: [],
    updated_at: new Date().toISOString()
  });

  return [
    t("מדיניות שילוט"),
    t("מדיניות סגירות חורף"),
    t("מדיניות פודטרקים")
  ];
}
