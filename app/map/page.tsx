"use client";

import { useEffect } from "react";
import { useKadima } from "@/lib/store";
import Badge from "@/components/Badge";
import { daysLeftLabel } from "@/lib/utils";
import { TYPE_MAP } from "@/lib/constants";

export default function MapPage() {
  const { tasks, fetchTasks, toggleStep } = useKadima();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const departments = Array.from(new Set(tasks.map((t) => t.department).filter(Boolean)));

  return (
    <div className="space-y-8">
      {departments.map((dep) => (
        <section key={dep}>
          <h2 className="text-sm font-semibold text-draft mb-3">{dep}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tasks
              .filter((t) => t.department === dep)
              .map((t) => (
                <div key={t.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-draft mt-1">
                        {TYPE_MAP[t.type]} · {t.contact || "ללא איש קשר"} · {daysLeftLabel(t.due_date)}
                      </div>
                    </div>
                    <Badge status={t.status} />
                  </div>
                  {t.steps.length > 0 && (
                    <ol className="mt-3 space-y-1">
                      {t.steps.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 text-sm">
                          <button
                            onClick={() => toggleStep(t.id, s.id)}
                            className={
                              "w-4 h-4 rounded-full border shrink-0 transition-colors " +
                              (s.done ? "bg-accent border-accent" : "border-line bg-surface")
                            }
                            aria-label={s.done ? "בטלי סימון" : "סמני כבוצע"}
                          />
                          <span className={s.done ? "text-draft line-through" : ""}>{s.title}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {t.next_step && (
                    <div className="mt-3 text-sm bg-accentSoft text-accent rounded px-3 py-2">
                      הצעד הבא: {t.next_step}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
      {departments.length === 0 && <div className="text-sm text-draft">אין רשומות עם מינהל.</div>}
    </div>
  );
}
