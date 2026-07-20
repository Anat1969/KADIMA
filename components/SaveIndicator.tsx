"use client";

import { useEffect, useState } from "react";
import { getSaveState, onSaveStateChange } from "@/lib/store";

const LABELS = {
  idle: "",
  saving: "שומר…",
  saved: "נשמר",
  error: "השמירה נכשלה"
} as const;

export default function SaveIndicator() {
  const [state, setState] = useState(getSaveState());

  useEffect(() => onSaveStateChange(setState), []);

  // "נשמר" נעלם לבד; "השמירה נכשלה" נשאר עד השמירה הבאה.
  useEffect(() => {
    if (state !== "saved") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  if (state === "idle") return null;

  return (
    <span className={"text-xs " + (state === "error" ? "text-delayed" : "text-draft")}>
      {LABELS[state]}
    </span>
  );
}
