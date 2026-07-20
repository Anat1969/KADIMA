"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useKadima, selectVisibleTasks, selectDepartments } from "@/lib/store";
import { useRef, useState } from "react";
import { STATUS_MAP, TYPE_MAP, CATEGORIES } from "@/lib/constants";
import type { SortKey, TaskStatus, TaskType, Task } from "@/lib/types";

const HEADERS: { key: SortKey | "next_step" | "image"; label: string; sortable: boolean }[] = [
  { key: "image", label: "תמונה", sortable: false },
  { key: "name", label: "משימה", sortable: true },
  { key: "category", label: "קטגוריה", sortable: true },
  { key: "department", label: "מינהל", sortable: true },
  { key: "contact", label: "איש קשר", sortable: true },
  { key: "type", label: "סוג", sortable: true },
  { key: "status", label: "סטטוס", sortable: true },
  { key: "start_date", label: "התחלה", sortable: true },
  { key: "due_date", label: "יעד", sortable: true },
  { key: "next_step", label: "הצעד הבא", sortable: false }
];

export default function TablePage() {
  const { fetchTasks, addTask, updateTask, deleteTask, setSort, setFilter, sortKey, sortAsc, filters } = useKadima();
  const tasks = useKadima(selectVisibleTasks);
  const departments = useKadima(selectDepartments);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="field border-line max-w-56"
          placeholder="חיפוש חופשי"
          value={filters.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <select
          className="field border-line max-w-40"
          value={filters.status}
          onChange={(e) => setFilter({ status: e.target.value as TaskStatus | "all" })}
        >
          <option value="all">כל הסטטוסים</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          className="field border-line max-w-44"
          value={filters.department}
          onChange={(e) => setFilter({ department: e.target.value })}
        >
          <option value="">כל המינהלים</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="field border-line max-w-40"
          value={filters.category}
          onChange={(e) => setFilter({ category: e.target.value })}
        >
          <option value="">כל הקטגוריות</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex-1" />
        <Link href="/gallery" className="btn">גלריה</Link>
        <button className="btn-primary" onClick={() => addTask()}>רשומה חדשה</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-line text-right">
              {HEADERS.map((h) => (
                <th
                  key={h.key}
                  className={"px-3 py-2 font-medium text-draft whitespace-nowrap " + (h.sortable ? "cursor-pointer select-none hover:text-ink" : "")}
                  onClick={() => h.sortable && setSort(h.key as SortKey)}
                >
                  {h.label}
                  {sortKey === h.key && <span className="mr-1">{sortAsc ? "↑" : "↓"}</span>}
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 align-top">
                <td className="px-2 py-1">
                  <TableImageCell task={t} />
                </td>
                <td className="px-2 py-1 min-w-52">
                  <input className="field font-medium" value={t.name} onChange={(e) => updateTask(t.id, { name: e.target.value })} />
                </td>
                <td className="px-2 py-1 min-w-32">
                  <select
                    className="field"
                    value={t.category}
                    onChange={(e) => updateTask(t.id, { category: e.target.value })}
                  >
                    <option value="">ללא</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1 min-w-36">
                  <input className="field" value={t.department} onChange={(e) => updateTask(t.id, { department: e.target.value })} />
                </td>
                <td className="px-2 py-1 min-w-32">
                  <input className="field" value={t.contact} onChange={(e) => updateTask(t.id, { contact: e.target.value })} />
                </td>
                <td className="px-2 py-1 min-w-24">
                  <select className="field" value={t.type} onChange={(e) => updateTask(t.id, { type: e.target.value as TaskType })}>
                    {Object.entries(TYPE_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1 min-w-28">
                  <select
                    className={"field font-medium " + STATUS_MAP[t.status].fg}
                    value={t.status}
                    onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
                  >
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input type="date" className="field" value={t.start_date} onChange={(e) => updateTask(t.id, { start_date: e.target.value })} />
                </td>
                <td className="px-2 py-1">
                  <input type="date" className="field" value={t.due_date} onChange={(e) => updateTask(t.id, { due_date: e.target.value })} />
                </td>
                <td className="px-2 py-1 min-w-52">
                  <input className="field" value={t.next_step} onChange={(e) => updateTask(t.id, { next_step: e.target.value })} />
                </td>
                <td className="px-2 py-1 text-left whitespace-nowrap">
                  <Link href={"/task/" + t.id} className="text-xs text-accent hover:underline">
                    פתיחה
                  </Link>
                  <button className="text-xs text-draft hover:text-delayed ms-3" onClick={() => deleteTask(t.id)}>
                    מחיקה
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && <div className="p-6 text-sm text-draft text-center">אין רשומות תואמות.</div>}
      </div>
    </div>
  );
}

function TableImageCell({ task }: { task: Task }) {
  const setTaskImage = useKadima((s) => s.setTaskImage);
  const demoMode = useKadima((s) => s.demoMode);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    await setTaskImage(task.id, file);
    setBusy(false);
  }

  return (
    <div className="w-14">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <button
        onClick={() => input.current?.click()}
        disabled={demoMode || busy}
        title={demoMode ? "העלאת תמונות דורשת התחברות" : "החלפת תמונה"}
        className="block w-14 h-14 rounded border border-line overflow-hidden bg-paper hover:border-ink transition-colors disabled:cursor-not-allowed"
      >
        {task.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={task.image_url} alt={task.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-draft">{busy ? "טוען" : "הוספה"}</span>
        )}
      </button>
    </div>
  );
}
