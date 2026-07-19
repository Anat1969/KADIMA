"use client";

import { useEffect, useState } from "react";
import { useKadima, selectStats } from "@/lib/store";
import { daysLeft, daysLeftLabel } from "@/lib/utils";
import Badge from "@/components/Badge";
import { TYPE_MAP } from "@/lib/constants";

export default function FeedPage() {
  const { tasks, fetchTasks, addTask, updateTask } = useKadima();
  const stats = useKadima(selectStats);
  const [drop, setDrop] = useState("");

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const attention = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => daysLeft(a.due_date) - daysLeft(b.due_date))
    .slice(0, 5);

  async function handleDrop() {
    const text = drop.trim();
    if (!text) return;
    const firstLine = text.split("\n")[0].slice(0, 60);
    await addTask({ name: firstLine, raw_material: text, status: "draft", next_step: "לאשר את פרטי הרשומה" });
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
          <button onClick={handleDrop} className="btn-primary">
            צרי רשומה
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-draft">דורש את תשומת ליבך</h2>
        {attention.map((t) => (
          <div key={t.id} className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48">
              <div className="font-medium">{t.name}</div>
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

function Stat({ label, value, warn, good }: { label: string; value: number; warn?: boolean; good?: boolean }) {
  return (
    <div className={"rounded-lg py-3 " + (warn ? "bg-delayedBg" : good ? "bg-readyBg" : "bg-paper")}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-draft mt-1">{label}</div>
    </div>
  );
}
