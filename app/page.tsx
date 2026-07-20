"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useKadima, selectStats } from "@/lib/store";
import { daysLeft, daysLeftLabel } from "@/lib/utils";
import Badge from "@/components/Badge";
import { TYPE_MAP, CATEGORIES } from "@/lib/constants";
import type { Task, TaskType } from "@/lib/types";

interface Understood {
  name: string;
  department: string;
  contact: string;
  start_date: string;
  due_date: string;
  next_step: string;
  type: TaskType;
  category: string;
  raw_material: string;
}

export default function FeedPage() {
  const { tasks, fetchTasks, addTask, updateTask } = useKadima();
  const stats = useKadima(selectStats);
  const [drop, setDrop] = useState("");
  const [reading, setReading] = useState(false);
  const [understood, setUnderstood] = useState<Understood | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const attention = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => daysLeft(a.due_date) - daysLeft(b.due_date))
    .slice(0, 5);

  function fallbackTask(text: string): Partial<Task> {
    return {
      name: text.split("\n")[0].slice(0, 60),
      raw_material: text,
      status: "draft",
      next_step: "לאשר את פרטי הרשומה"
    };
  }

  async function handleDrop() {
    const text = drop.trim();
    if (!text) return;
    setReading(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) {
        // אין מפתח API או תקלה בשירות — נופלים לקליטה הפשוטה.
        await addTask(fallbackTask(text));
        setDrop("");
        return;
      }
      const data = (await res.json()) as Understood;
      setUnderstood({ ...data, raw_material: text });
    } catch {
      await addTask(fallbackTask(text));
      setDrop("");
    } finally {
      setReading(false);
    }
  }

  async function confirmUnderstood() {
    if (!understood) return;
    const today = new Date().toISOString().slice(0, 10);
    await addTask({
      name: understood.name || understood.raw_material.split("\n")[0].slice(0, 60),
      department: understood.department,
      contact: understood.contact,
      type: understood.type,
      start_date: understood.start_date || today,
      due_date: understood.due_date || today,
      next_step: understood.next_step,
      category: understood.category,
      raw_material: understood.raw_material,
      status: "draft"
    });
    setUnderstood(null);
    setDrop("");
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-draft mb-3">תדריך בוקר</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat label="פעילות" value={stats.total} />
          <Stat label="מתאחרות" value={stats.delayed} warn={stats.delayed > 0} />
          <Stat label="מוכנות לשליחה" value={stats.ready} good={stats.ready > 0} />
          <Stat label="יעד קרוב" value={stats.dueSoon} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-draft mb-3">תיבת קליטה — זרקי כל דבר</h2>
        <textarea
          value={drop}
          onChange={(e) => setDrop(e.target.value)}
          placeholder="טקסט, מייל שהועבר, קישור, סיכום פגישה... שורה ראשונה תהפוך לשם המשימה"
          className="w-full h-24 field border-line resize-none"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={handleDrop} className="btn-primary" disabled={reading}>
            {reading ? "קוראת…" : "צרי רשומה"}
          </button>
        </div>

        {understood && (
          <div className="mt-4 border-t border-line pt-4">
            <h3 className="text-sm font-semibold text-draft mb-3">הנה מה שהבנתי</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Understanding label="שם" value={understood.name} onChange={(v) => setUnderstood({ ...understood, name: v })} />
              <Understanding label="מינהל" value={understood.department} onChange={(v) => setUnderstood({ ...understood, department: v })} />
              <Understanding label="איש קשר" value={understood.contact} onChange={(v) => setUnderstood({ ...understood, contact: v })} />
              <label className="block">
                <span className="block text-xs text-draft mb-1">סוג</span>
                <select
                  className="field"
                  value={understood.type}
                  onChange={(e) => setUnderstood({ ...understood, type: e.target.value as TaskType })}
                >
                  {Object.entries(TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs text-draft mb-1">קטגוריה</span>
                <select
                  className="field"
                  value={understood.category}
                  onChange={(e) => setUnderstood({ ...understood, category: e.target.value })}
                >
                  <option value="">ללא</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <Understanding label="תאריך התחלה" type="date" value={understood.start_date} onChange={(v) => setUnderstood({ ...understood, start_date: v })} />
              <Understanding label="תאריך יעד" type="date" value={understood.due_date} onChange={(v) => setUnderstood({ ...understood, due_date: v })} />
              <div className="sm:col-span-2">
                <Understanding label="הצעד הבא" value={understood.next_step} onChange={(v) => setUnderstood({ ...understood, next_step: v })} />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn" onClick={() => setUnderstood(null)}>
                ביטול
              </button>
              <button className="btn-primary" onClick={confirmUnderstood}>
                אשרי וצרי רשומה
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-draft">דורש את תשומת ליבך</h2>
        {attention.map((t) => (
          <div key={t.id} className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48">
              <Link href={"/task/" + t.id} className="font-medium hover:text-accent">
                {t.name}
              </Link>
              <div className="text-xs text-draft mt-1">
                {t.department || "ללא מינהל"} · {TYPE_MAP[t.type]} · {daysLeftLabel(t.due_date)}
              </div>
              {t.next_step && <div className="text-sm mt-2">הצעד הבא: {t.next_step}</div>}
            </div>
            <Badge status={t.status} />
            {t.status === "ready" && (
              <button className="btn" onClick={() => updateTask(t.id, { status: "done" })}>
                סמני כהושלם
              </button>
            )}
          </div>
        ))}
        {attention.length === 0 && <div className="text-sm text-draft">אין משימות פעילות.</div>}
      </section>
    </div>
  );
}

function Understanding({
  label,
  value,
  onChange,
  type
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-draft mb-1">{label}</span>
      <input type={type} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Stat({ label, value, warn, good }: { label: string; value: number; warn?: boolean; good?: boolean }) {
  return (
    <div className={"rounded-lg py-3 " + (warn ? "bg-delayedBg" : good ? "bg-readyBg" : "bg-paper")}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-draft mt-1">{label}</div>
    </div>
  );
}
