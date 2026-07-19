"use client";

import { create } from "zustand";
import type { Task, TaskStep, TaskStatus, SortKey } from "./types";
import { supabase, hasSupabase } from "./supabase/client";
import { seedTasks } from "./seed";
import { uid, daysLeft } from "./utils";
import { STATUS_ORDER } from "./constants";

interface Filters {
  status: TaskStatus | "all";
  department: string;
  search: string;
}

interface KadimaState {
  tasks: Task[];
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
  setFilter: (patch: Partial<Filters>) => void;
  setSort: (key: SortKey) => void;
  subscribe: () => () => void;
}

// מזהי רשומות שנכתבו מקומית ממש עכשיו — כדי שאירוע realtime חוזר לא ידרוס עריכה פעילה.
const localWrites = new Map<string, number>();
const ECHO_MS = 2000;

function markLocal(id: string) {
  localWrites.set(id, Date.now());
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
    id, name: "משימה חדשה", department: "", contact: "", type: "external", status: "draft",
    start_date: today, due_date: today, raw_material: "", deliverable: "", notes: "",
    next_step: "", steps: [], updated_at: new Date().toISOString()
  };
}

export const useKadima = create<KadimaState>((set, get) => ({
  tasks: [],
  loaded: false,
  demoMode: !hasSupabase,
  filters: { status: "all", department: "", search: "" },
  sortKey: "due_date",
  sortAsc: true,

  fetchTasks: async () => {
    if (get().loaded) return;
    if (!supabase) {
      set({ tasks: seedTasks(), loaded: true });
      return;
    }
    const { data: tasks } = await supabase.from("tasks").select("*").order("due_date");
    const { data: steps } = await supabase.from("task_steps").select("*").order("order_index");
    const byTask = new Map<string, TaskStep[]>();
    (steps ?? []).forEach((s: TaskStep) => {
      if (!byTask.has(s.task_id)) byTask.set(s.task_id, []);
      byTask.get(s.task_id)!.push(s);
    });
    set({
      tasks: (tasks ?? []).map((t: Task) => ({ ...t, steps: byTask.get(t.id) ?? [] })),
      loaded: true
    });
  },

  addTask: async (partial = {}) => {
    const task = { ...emptyTask(), ...partial };
    markLocal(task.id);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    if (supabase) {
      const { steps, ...row } = task;
      await supabase.from("tasks").insert(row);
    }
    return task;
  },

  updateTask: async (id, patch) => {
    markLocal(id);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t))
    }));
    if (supabase) {
      const { steps, ...row } = patch as Partial<Task>;
      await supabase.from("tasks").update(row).eq("id", id);
    }
  },

  deleteTask: async (id) => {
    markLocal(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    if (supabase) await supabase.from("tasks").delete().eq("id", id);
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
    if (supabase) await supabase.from("task_steps").update({ done: newDone }).eq("id", stepId);
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
    if (supabase) await supabase.from("task_steps").insert(step);
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
    if (supabase) await supabase.from("task_steps").update(patch).eq("id", stepId);
  },

  deleteStep: async (taskId, stepId) => {
    markLocal(taskId);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, steps: t.steps.filter((st) => st.id !== stepId) } : t
      )
    }));
    if (supabase) await supabase.from("task_steps").delete().eq("id", stepId);
  },

  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),

  setSort: (key) =>
    set((s) => (s.sortKey === key ? { sortAsc: !s.sortAsc } : { sortKey: key, sortAsc: true })),

  subscribe: () => {
    if (!supabase) return () => {};
    const client = supabase;

    async function refetchSteps(taskId: string) {
      const { data } = await client.from("task_steps").select("*").eq("task_id", taskId).order("order_index");
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, steps: (data ?? []) as TaskStep[] } : t))
      }));
    }

    const channel = client
      .channel("kadima")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
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
      .on("postgres_changes", { event: "*", schema: "public", table: "task_steps" }, (payload) => {
        const row = (payload.new ?? payload.old) as TaskStep;
        if (!row?.task_id || isEcho(row.task_id)) return;
        refetchSteps(row.task_id);
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
    if (filters.search) {
      const q = filters.search;
      const hay = [t.name, t.department, t.contact, t.next_step, t.notes].join(" ");
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
