import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// מצב הדגמה: אם אין מפתחות Supabase, האפליקציה רצה עם נתוני דוגמה בזיכרון.
export const hasSupabase = Boolean(url && key);

// קדימה יושבת בסכמה נפרדת בשם kadima. הסכמה public שייכת לאפליקציה
// אחרת באותו פרויקט Supabase — אין לגעת בה.
//
// PostgREST חושף רק את public, ולכן הגישה היא דרך views בשם מוקדם
// kadima_ שמצביעים על הטבלאות האמיתיות. הנתונים לעולם לא יושבים
// ב-public עצמה.
export const KADIMA_SCHEMA = "kadima";

export const TABLES = {
  tasks: "kadima_tasks",
  taskSteps: "kadima_task_steps",
  activityLog: "kadima_activity_log",
  departments: "kadima_departments"
} as const;

export const supabase = hasSupabase
  ? createClient(url as string, key as string)
  : null;
