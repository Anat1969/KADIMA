"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";

type Kind = "email" | "ceo";

const LABELS: Record<Kind, string> = {
  email: "מייל תשובה לאיש הקשר",
  ceo: "סיכום סטטוס למנכ\"ל"
};

export default function DraftBox({ task }: { task: Task }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate(kind: Kind) {
    setBusy(kind);
    setError("");
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, task })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה בניסוח.");
        return;
      }
      setDraft(data.text);
      setCopied(false);
    } catch {
      setError("לא הצלחתי להתחבר לשירות הניסוח.");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
  }

  return (
    <section className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-draft">נסחי טיוטה</h2>
        <div className="flex-1" />
        {(Object.keys(LABELS) as Kind[]).map((k) => (
          <button key={k} className="btn" disabled={busy !== null} onClick={() => generate(k)}>
            {busy === k ? "מנסחת…" : LABELS[k]}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-delayed">{error}</div>}

      {draft && (
        <div className="space-y-2">
          <textarea
            className="field min-h-40 resize-y"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setCopied(false);
            }}
          />
          <div className="flex justify-end">
            <button className="btn" onClick={copy}>
              {copied ? "הועתק" : "העתקה"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
