"use client";

import { useEffect, useRef, useState } from "react";
import { useKadima, selectTaskAttachments } from "@/lib/store";
import type { Attachment } from "@/lib/types";

function sizeLabel(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " בייט";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

export default function Attachments({ taskId }: { taskId: string }) {
  const files = useKadima(selectTaskAttachments(taskId));
  const uploadAttachment = useKadima((s) => s.uploadAttachment);
  const deleteAttachment = useKadima((s) => s.deleteAttachment);
  const demoMode = useKadima((s) => s.demoMode);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const images = files.filter((f) => f.mime_type.startsWith("image/"));
  const docs = files.filter((f) => !f.mime_type.startsWith("image/"));

  async function upload(list: FileList | File[] | null) {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    if (demoMode) {
      setError("במצב הדגמה אי אפשר להעלות קבצים — יש להתחבר.");
      return;
    }
    setBusy(true);
    setError("");
    for (const file of files) {
      const done = await uploadAttachment(taskId, file);
      if (!done) setError("העלאה נכשלה: " + file.name);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  // הדבקה מהלוח (Ctrl+V) — צילומי מסך ותמונות שהועתקו.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const files = items
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length > 0) {
        e.preventDefault();
        upload(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, demoMode]);

  return (
    <section
      className={
        "card p-4 space-y-4 transition-colors " + (dragging ? "border-accent bg-accentSoft" : "")
      }
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-draft">מסמכים ותמונות</h2>
        <input
          ref={input}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <button
          className="btn"
          disabled={demoMode || busy}
          onClick={() => input.current?.click()}
          title={demoMode ? "העלאת קבצים דורשת התחברות" : undefined}
        >
          {busy ? "מעלה…" : "העלאת קבצים"}
        </button>
      </div>

      {demoMode && (
        <div className="text-xs text-waiting bg-waitingBg rounded px-3 py-2">
          במצב הדגמה אי אפשר להעלות קבצים — הנתונים אינם נשמרים.
        </div>
      )}
      {error && <div className="text-sm text-delayed">{error}</div>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((f) => (
            <figure key={f.id} className="space-y-1">
              <a href={f.url} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.name}
                  className="w-full h-28 object-cover rounded border border-line hover:border-ink transition-colors"
                />
              </a>
              <figcaption className="flex items-center justify-between gap-2">
                <span className="text-xs text-draft truncate" title={f.name}>{f.name}</span>
                <button
                  className="text-xs text-draft hover:text-delayed shrink-0"
                  onClick={() => deleteAttachment(f.id)}
                >
                  מחיקה
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((f) => (
            <li key={f.id} className="flex items-center gap-3 text-sm">
              <a href={f.url} target="_blank" rel="noreferrer" className="text-accent hover:underline flex-1 truncate">
                {f.name}
              </a>
              <span className="text-xs text-draft shrink-0">{sizeLabel(f.size_bytes)}</span>
              <button
                className="text-xs text-draft hover:text-delayed shrink-0"
                onClick={() => deleteAttachment(f.id)}
              >
                מחיקה
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length === 0 && !demoMode && (
        <div className="text-sm text-draft">
          אין קבצים עדיין. אפשר לגרור לכאן קבצים, להדביק תמונה מהלוח, או ללחוץ על העלאת קבצים.
        </div>
      )}
    </section>
  );
}
