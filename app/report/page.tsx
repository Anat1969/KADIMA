"use client";

import { useEffect, useMemo } from "react";
import { useKadima } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { STATUS_MAP, TYPE_MAP } from "@/lib/constants";

export default function ReportPage() {
  const { tasks, fetchTasks } = useKadima();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const now = new Date();
  const doneRecently = tasks.filter((t) => t.status === "done");
  const atRisk = tasks.filter((t) => t.status === "delayed");
  const inMotion = tasks.filter((t) => ["in_progress", "waiting", "ready"].includes(t.status));
  const initiatives = tasks.filter((t) => t.type === "initiative" && t.status !== "done");

  const reportText = useMemo(() => {
    const lines: string[] = [];
    lines.push("עדכון שבועי — אדריכלית העיר");
    lines.push("תאריך: " + now.toLocaleDateString("he-IL"));
    lines.push("");
    if (doneRecently.length) {
      lines.push("הושלם:");
      doneRecently.forEach((t) => lines.push("- " + t.name + " (" + t.department + ")"));
      lines.push("");
    }
    lines.push("בתנועה:");
    inMotion.forEach((t) =>
      lines.push("- " + t.name + " — " + STATUS_MAP[t.status].label + ", יעד " + formatDate(t.due_date) + (t.next_step ? ". הצעד הבא: " + t.next_step : ""))
    );
    if (atRisk.length) {
      lines.push("");
      lines.push("בסיכון / דורש החלטה:");
      atRisk.forEach((t) => lines.push("- " + t.name + " — " + (t.notes || "מתאחר מול היעד")));
    }
    if (initiatives.length) {
      lines.push("");
      lines.push("יוזמות שלי:");
      initiatives.forEach((t) => lines.push("- " + t.name + " — " + STATUS_MAP[t.status].label));
    }
    return lines.join("\n");
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-draft">כך זה ייראה אצל המנכ"ל</h2>
        <button className="btn-primary" onClick={() => navigator.clipboard.writeText(reportText)}>
          העתקה למייל
        </button>
      </div>

      <div className="card p-6 leading-7">
        <h3 className="font-semibold text-lg">עדכון שבועי — אדריכלית העיר</h3>
        <p className="text-xs text-draft mb-4">{now.toLocaleDateString("he-IL")}</p>

        {doneRecently.length > 0 && (
          <ReportSection title="הושלם">
            {doneRecently.map((t) => (
              <li key={t.id}>{t.name} <span className="text-draft">({t.department})</span></li>
            ))}
          </ReportSection>
        )}

        <ReportSection title="בתנועה">
          {inMotion.map((t) => (
            <li key={t.id}>
              {t.name} — {STATUS_MAP[t.status].label}, יעד {formatDate(t.due_date)}
              {t.next_step && <span className="text-draft">. הצעד הבא: {t.next_step}</span>}
            </li>
          ))}
        </ReportSection>

        {atRisk.length > 0 && (
          <ReportSection title="בסיכון / דורש החלטה">
            {atRisk.map((t) => (
              <li key={t.id}>{t.name} — {t.notes || "מתאחר מול היעד"}</li>
            ))}
          </ReportSection>
        )}

        {initiatives.length > 0 && (
          <ReportSection title="יוזמות שלי">
            {initiatives.map((t) => (
              <li key={t.id}>{t.name} — {STATUS_MAP[t.status].label} <span className="text-draft">({TYPE_MAP[t.type]})</span></li>
            ))}
          </ReportSection>
        )}
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="font-medium mb-1">{title}</h4>
      <ul className="list-disc pr-5 space-y-1 text-sm">{children}</ul>
    </div>
  );
}
