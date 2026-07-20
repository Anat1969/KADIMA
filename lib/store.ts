"use client";

import { create } from "zustand";
import type { Task, TaskStep, TaskStatus, SortKey, Attachment } from "./types";
import { supabase, hasSupabase, KADIMA_SCHEMA, TABLES } from "./supabase/client";
import { seedTasks } from "./seed";
import { uid, daysLeft } from "./utils";
import { STATUS_ORDER, STORAGE_BUCKET } from "./constants";

// שמות קבצים בעברית שוברים נתיבי אחסון — משאירים תווים בטוחים בלבד.
function sanitizeName(name: string): string {
  const clean = name.normalize("NFC").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_");
  return clean.length > 1 ? clean.slice(-80) : "file";
}

interface Filters {
  status: TaskStatus | "all";
  department: string;
  category: string;
  search: string;
}

interface KadimaState {
  tasks: Task[];
  attachments: Attachment[];
  loaded: boolean;
  demoMode: boolean;
  filters: Filters;
  sortKey: SortKey;
  sortAsc: boolean;

  fetchTasks: () => Promise<void>;
  addTask: (partial?: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleStep: (taskId: string, stepId: string) => Promise<void>;
  addStep: (taskId: string, title?: string) => Promise<void>;
  updateStep: (taskId: string, stepId: string, patch: Partial<TaskStep>) => Promise<void>;
  deleteStep: (taskId: string, stepId: string) => Promise<void>;
  uploadAttachment: (taskId: string, file: File) => Promise<Attachment | null>;
  deleteAttachment: (id: string) => Promise<void>;
  setTaskImage: (taskId: string, file: File) => Promise<void>;
  setFilter: (patch: Partial<Filters>) => void;
  setSort: (key: SortKey) => void;
  subscribe: () => () => void;
  reset: () => void;
}

// מזהי רשומות שנכתבו מקומית ממש עכשיו — כדי שאירוע realtime חוזר לא ידרוס עריכה פעילה.
const localWrites = new Map<string, number>();
const ECHO_MS = 2000;

function markLocal(id: string) {
  localWrites.set(id, Date.now());
}

// כתיבה בהקלדה: צוברים את השינויים ושולחים אחרי הפסקה קצרה, כדי שלא
// תישלח פנייה לשרת בכל תו. השדות האחרונים תמיד מנצחים.
const pendingWrites = new Map<string, Partial<Task>>();
const writeTimers = new Map<string, ReturnType<typeof setTimeout>>();
const WRITE_DELAY_MS = 600;

// מנוי חיצוני למצב השמירה, כדי שהממשק יוכל להציג "נשמר".
type SaveState = "idle" | "saving" | "saved" | "error";
let saveState: SaveState = "idle";
const saveListeners = new Set<(s: SaveState) => void>();

function setSaveState(next: SaveState) {
  saveState = next;
  saveListeners.forEach((fn) => fn(next));
}

export function getSaveState() {
  return saveState;
}

export function onSaveStateChange(fn: (s: SaveState) => void) {
  saveListeners.add(fn);
  return () => {
    saveListeners.delete(fn);
  };
}

async function flushWrite(id: string) {
  const patch = pendingWrites.get(id);
  pendingWrites.delete(id);
  writeTimers.delete(id);
  if (!patch || !supabase) return;
  markLocal(id);
  setSaveState("saving");
  const { error } = await supabase.from(TABLES.tasks).update(patch).eq("id", id);
  setSaveState(error ? "error" : "saved");
}

// שמירה מיידית של כל מה שממתין — לפני סגירת הדף.
export async function flushPendingWrites() {
  await Promise.all(Array.from(pendingWrites.keys()).map(flushWrite));
}

function isEcho(id: string): boolean {
  const at = localWrites.get(id);
  if (at === undefined) return false;
  if (Date.now() - at > ECHO_MS) {
    localWrites.delete(id);
    return false;
  }
  return true;
}

function emptyTask(): Task {
  const id = uid();
  const today = new Date().toISOString().slice(0, 10);
  return {
    id, name: "משימה חדשה", department: "", contact: "", category: "", image_url: "",
    type: "external", status: "draft",
    start_date: today, due_date: today, raw_material: "", deliverable: "", notes: "",
    next_step: "", steps: [], updated_at: new Date().toISOString()
  };
}

export const useKadima = create<KadimaState>((set, get) => ({
  tasks: [],
  attachments: [],
  loaded: false,
  demoMode: !hasSupabase,
  filters: { status: "all", department: "", category: "", search: "" },
  sortKey: "due_date",
  sortAsc: true,

  fetchTasks: async () => {
    if (get().loaded) return;
    if (!supabase) {
      set({ tasks: seedTasks(), loaded: true });
      return;
    }
    try {
      // אין מסך התחברות. אם אין עדיין session, מנסים כניסה אנונימית —
      // היא נותנת זהות אמיתית ל-RLS בלי שהמשתמשת תראה מסך כניסה.
      // כשהיא כבויה ב-Supabase נופלים לנתוני התחלה בזיכרון, ו-demoMode
      // מדליק את הבאנר שמסביר שהנתונים לא נשמרים.
      let { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        await supabase.auth.signInAnonymously();
        ({ data: auth } = await supabase.auth.getUser());
      }
      if (!auth.user) {
        set({ tasks: seedTasks(), attachments: [], loaded: true, demoMode: true });
        return;
      }
      set({ demoMode: false });
      const { data: tasks } = await supabase.from(TABLES.tasks).select("*").order("due_date");
      const { data: steps } = await supabase.from(TABLES.taskSteps).select("*").order("order_index");
      const { data: files } = await supabase
        .from(TABLES.attachments).select("*").order("created_at");
      const byTask = new Map<string, TaskStep[]>();
      (steps ?? []).forEach((s: TaskStep) => {
        if (!byTask.has(s.task_id)) byTask.set(s.task_id, []);
        byTask.get(s.task_id)!.push(s);
      });
      set({
        tasks: (tasks ?? []).map((t: Task) => ({ ...t, steps: byTask.get(t.id) ?? [] })),
        attachments: (files ?? []) as Attachment[],
        loaded: true
      });
    } catch {
      // תקלת רשת — משאירים loaded=false כדי שננסה שוב.
    }
  },

  addTask: async (partial = {}) => {
    const task = { ...emptyTask(), ...partial };
    markLocal(task.id);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    if (supabase && !get().demoMode) {
      const { steps, ...row } = task;
      const { data: auth } = await supabase.auth.getUser();
      await supabase.from(TABLES.tasks).insert({ ...row, user_id: auth.user?.id });
    }
    return task;
  },

  updateTask: async (id, patch) => {
    markLocal(id);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t))
    }));
    // במצב הדגמה אין למי לכתוב — לא מתזמנים שמירה ולא מציגים "נשמר".
    if (supabase && !get().demoMode) {
      const { steps, ...row } = patch as Partial<Task>;
      pendingWrites.set(id, { ...pendingWrites.get(id), ...row });
      const timer = writeTimers.get(id);
      if (timer) clearTimeout(timer);
      writeTimers.set(id, setTimeout(() => flushWrite(id), WRITE_DELAY_MS));
    }
  },

  deleteTask: async (id) => {
    markLocal(id);
    // ביטול כתיבה שממתינה, כדי שלא תישלח אחרי המחיקה.
    const timer = writeTimers.get(id);
    if (timer) clearTimeout(timer);
    writeTimers.delete(id);
    pendingWrites.delete(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    if (supabase && !get().demoMode) await supabase.from(TABLES.tasks).delete().eq("id", id);
  },

  toggleStep: async (taskId, stepId) => {
    markLocal(taskId);
    let newDone = false;
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((st) => {
            if (st.id !== stepId) return st;
            newDone = !st.done;
            return { ...st, done: newDone };
          })
        };
      })
    }));
    if (supabase && !get().demoMode) await supabase.from(TABLES.taskSteps).update({ done: newDone }).eq("id", stepId);
  },

  addStep: async (taskId, title = "שלב חדש") => {
    markLocal(taskId);
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const step: TaskStep = {
      id: uid(), task_id: taskId, title, done: false, note: "", order_index: task.steps.length
    };
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, steps: [...t.steps, step] } : t))
    }));
    if (supabase && !get().demoMode) await supabase.from(TABLES.taskSteps).insert(step);
  },

  updateStep: async (taskId, stepId, patch) => {
    markLocal(taskId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, steps: t.steps.map((st) => (st.id === stepId ? { ...st, ...patch } : st)) }
          : t
      )
    }));
    if (supabase && !get().demoMode) await supabase.from(TABLES.taskSteps).update(patch).eq("id", stepId);
  },

  deleteStep: async (taskId, stepId) => {
    markLocal(taskId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, steps: t.steps.filter((st) => st.id !== stepId) } : t
      )
    }));
    if (supabase && !get().demoMode) await supabase.from(TABLES.taskSteps).delete().eq("id", stepId);
  },

  uploadAttachment: async (taskId, file) => {
    if (!supabase) return null;
    const path = `${taskId}/${Date.now()}-${sanitizeName(file.name)}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
    if (error) return null;

    const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const row: Attachment = {
      id: uid(), task_id: taskId, name: file.name, path, url: pub.publicUrl,
      mime_type: file.type, size_bytes: file.size
    };
    markLocal(row.id);
    const { error: insertError } = await supabase.from(TABLES.attachments).insert(row);
    if (insertError) {
      // ניקוי הקובץ כדי שלא יישאר יתום באחסון.
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      return null;
    }
    set((s) => ({ attachments: [...s.attachments, row] }));
    return row;
  },

  deleteAttachment: async (id) => {
    markLocal(id);
    const item = get().attachments.find((a) => a.id === id);
    set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) }));
    if (supabase && item) {
      await supabase.storage.from(STORAGE_BUCKET).remove([item.path]);
      await supabase.from(TABLES.attachments).delete().eq("id", id);
    }
  },

  setTaskImage: async (taskId, file) => {
    const uploaded = await get().uploadAttachment(taskId, file);
    if (uploaded) await get().updateTask(taskId, { image_url: uploaded.url });
  },

  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),

  setSort: (key) =>
    set((s) => (s.sortKey === key ? { sortAsc: !s.sortAsc } : { sortKey: key, sortAsc: true })),

  reset: () => set({ tasks: [], loaded: false }),

  subscribe: () => {
    if (!supabase) return () => {};
    const client = supabase;

    async function refetchSteps(taskId: string) {
      const { data } = await client.from(TABLES.taskSteps).select("*").eq("task_id", taskId).order("order_index");
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, steps: (data ?? []) as TaskStep[] } : t))
      }));
    }

    const channel = client
      .channel("kadima")
      .on("postgres_changes", { event: "*", schema: KADIMA_SCHEMA, table: "tasks" }, (payload) => {
        const row = (payload.new ?? payload.old) as Task;
        if (!row?.id || isEcho(row.id)) return;
        if (payload.eventType === "DELETE") {
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== row.id) }));
          return;
        }
        set((s) => {
          const existing = s.tasks.find((t) => t.id === row.id);
          if (existing) {
            return { tasks: s.tasks.map((t) => (t.id === row.id ? { ...row, steps: t.steps } : t)) };
          }
          return { tasks: [{ ...row, steps: [] }, ...s.tasks] };
        });
      })
      .on("postgres_changes", { event: "*", schema: KADIMA_SCHEMA, table: "task_steps" }, (payload) => {
        const row = (payload.new ?? payload.old) as TaskStep;
        if (!row?.task_id || isEcho(row.task_id)) return;
        refetchSteps(row.task_id);
      })
      .on("postgres_changes", { event: "*", schema: KADIMA_SCHEMA, table: "attachments" }, (payload) => {
        const row = (payload.new ?? payload.old) as Attachment;
        if (!row?.id || isEcho(row.id)) return;
        if (payload.eventType === "DELETE") {
          set((s) => ({ attachments: s.attachments.filter((a) => a.id !== row.id) }));
          return;
        }
        set((s) => {
          const exists = s.attachments.some((a) => a.id === row.id);
          return {
            attachments: exists
              ? s.attachments.map((a) => (a.id === row.id ? row : a))
              : [...s.attachments, row]
          };
        });
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }
}));

export function selectVisibleTasks(s: KadimaState): Task[] {
  const { tasks, filters, sortKey, sortAsc } = s;
  let out = tasks.filter((t) => {
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.department && t.department !== filters.department) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.search) {
      const q = filters.search;
      const hay = [t.name, t.department, t.contact, t.category, t.next_step, t.notes].join(" ");
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  out = [...out].sort((a, b) => {
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    const cmp = sortKey === "status"
      ? STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      : av.localeCompare(bv, "he");
    return sortAsc ? cmp : -cmp;
  });
  return out;
}

export function selectStats(s: KadimaState) {
  const active = s.tasks.filter((t) => t.status !== "done");
  return {
    total: active.length,
    delayed: active.filter((t) => t.status === "delayed" || daysLeft(t.due_date) < 0).length,
    ready: active.filter((t) => t.status === "ready").length,
    dueSoon: active.filter((t) => {
      const d = daysLeft(t.due_date);
      return d >= 0 && d <= 3;
    }).length,
    initiatives: active.filter((t) => t.type === "initiative").length
  };
}

export function selectDepartments(s: KadimaState): string[] {
  return Array.from(new Set(s.tasks.map((t) => t.department).filter(Boolean)));
}

export function selectTaskAttachments(taskId: string) {
  return (s: KadimaState): Attachment[] => s.attachments.filter((a) => a.task_id === taskId);
}

// כל התמונות של קטגוריה — התמונה הראשית של כל רשומה והקבצים המצורפים לה.
export function selectCategoryImages(category: string) {
  return (s: KadimaState) => {
    const tasks = s.tasks.filter((t) => t.category === category);
    const ids = new Set(tasks.map((t) => t.id));
    const byTask = new Map(tasks.map((t) => [t.id, t.name]));
    const fromAttachments = s.attachments
      .filter((a) => ids.has(a.task_id) && a.mime_type.startsWith("image/"))
      .map((a) => ({ url: a.url, name: a.name, taskId: a.task_id, taskName: byTask.get(a.task_id) ?? "" }));
    const fromCovers = tasks
      .filter((t) => t.image_url && !fromAttachments.some((f) => f.url === t.image_url))
      .map((t) => ({ url: t.image_url, name: t.name, taskId: t.id, taskName: t.name }));
    return [...fromCovers, ...fromAttachments];
  };
}
