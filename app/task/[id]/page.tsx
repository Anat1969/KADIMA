"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useKadima } from "@/lib/store";
import Badge from "@/components/Badge";
import DraftBox from "@/components/DraftBox";
import Attachments from "@/components/Attachments";
import { STATUS_MAP, TYPE_MAP, CATEGORIES } from "@/lib/constants";
import { daysLeftLabel } from "@/lib/utils";
import type { TaskStatus, TaskType } from "@/lib/types";

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { fetchTasks, updateTask, deleteTask, toggleStep, addStep, updateStep, deleteStep, loaded } =
    useKadima();
  const task = useKadima((s) => s.tasks.find((t) => t.id === id));

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (!loaded) {
    return <div className="text-sm text-draft">טוען…</div>;
  }

  if (!task) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-draft">הרשומה לא נמצאה.</div>
        <Link href="/table" className="text-sm text-accent hover:underline">
          חזרה לטבלה
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Link href="/table" className="text-xs text-draft hover:text-ink">
            חזרה לטבלה
          </Link>
          <input
            className="field text-xl font-semibold mt-1"
            value={task.name}
            onChange={(e) => updateTask(task.id, { name: e.target.value })}
          />
          <div className="text-xs text-draft mt-1">
            {TYPE_MAP[task.type]} · {daysLeftLabel(task.due_date)}
          </div>
        </div>
        <Badge status={task.status} />
      </div>

      <section className="card p-4 grid gap-4 sm:grid-cols-2">
        <Field label="מינהל">
          <input
            className="field"
            value={task.department}
            onChange={(e) => updateTask(task.id, { department: e.target.value })}
          />
        </Field>
        <Field label="איש קשר">
          <input
            className="field"
            value={task.contact}
            onChange={(e) => updateTask(task.id, { contact: e.target.value })}
          />
        </Field>
        <Field label="קטגוריה">
          <select
            className="field"
            value={task.category}
            onChange={(e) => updateTask(task.id, { category: e.target.value })}
          >
            <option value="">ללא</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="סוג">
          <select
            className="field"
            value={task.type}
            onChange={(e) => updateTask(task.id, { type: e.target.value as TaskType })}
          >
            {Object.entries(TYPE_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="סטטוס">
          <select
            className={"field font-medium " + STATUS_MAP[task.status].fg}
            value={task.status}
            onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
          >
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="תאריך התחלה">
          <input
            type="date"
            className="field"
            value={task.start_date}
            onChange={(e) => updateTask(task.id, { start_date: e.target.value })}
          />
        </Field>
        <Field label="תאריך יעד">
          <input
            type="date"
            className="field"
            value={task.due_date}
            onChange={(e) => updateTask(task.id, { due_date: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="הצעד הבא">
            <input
              className="field"
              value={task.next_step}
              onChange={(e) => updateTask(task.id, { next_step: e.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-draft">שלבי ביניים</h2>
          <button className="text-xs text-accent hover:underline" onClick={() => addStep(task.id)}>
            הוספת שלב
          </button>
        </div>
        {task.steps.length === 0 ? (
          <div className="text-sm text-draft">אין שלבים עדיין.</div>
        ) : (
          <ol className="space-y-2">
            {task.steps.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <button
                  onClick={() => toggleStep(task.id, s.id)}
                  className={
                    "w-4 h-4 mt-2 rounded-full border shrink-0 transition-colors " +
                    (s.done ? "bg-accent border-accent" : "border-line bg-surface")
                  }
                  aria-label={s.done ? "בטלי סימון" : "סמני כבוצע"}
                />
                <div className="flex-1">
                  <input
                    className={"field " + (s.done ? "text-draft line-through" : "")}
                    value={s.title}
                    onChange={(e) => updateStep(task.id, s.id, { title: e.target.value })}
                  />
                  <input
                    className="field text-xs text-draft"
                    placeholder="הערה"
                    value={s.note}
                    onChange={(e) => updateStep(task.id, s.id, { note: e.target.value })}
                  />
                </div>
                <button
                  className="text-xs text-draft hover:text-delayed mt-2"
                  onClick={() => deleteStep(task.id, s.id)}
                >
                  מחיקה
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card p-4 space-y-4">
        <Field label="חומר גלם">
          <textarea
            className="field min-h-24 resize-y"
            value={task.raw_material}
            onChange={(e) => updateTask(task.id, { raw_material: e.target.value })}
          />
        </Field>
        <Field label="תוצרים">
          <textarea
            className="field min-h-24 resize-y"
            value={task.deliverable}
            onChange={(e) => updateTask(task.id, { deliverable: e.target.value })}
          />
        </Field>
        <Field label="הערות">
          <textarea
            className="field min-h-24 resize-y"
            value={task.notes}
            onChange={(e) => updateTask(task.id, { notes: e.target.value })}
          />
        </Field>
      </section>

      <Attachments taskId={task.id} />

      <DraftBox task={task} />

      <div className="flex justify-end">
        <button
          className="text-xs text-draft hover:text-delayed"
          onClick={async () => {
            await deleteTask(task.id);
            router.push("/table");
          }}
        >
          מחיקת הרשומה
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-draft mb-1">{label}</span>
      {children}
    </label>
  );
}
