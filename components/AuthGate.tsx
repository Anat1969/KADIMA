"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, hasSupabase } from "@/lib/supabase/client";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // במצב הדגמה אין התחברות — האפליקציה פתוחה עם נתוני seed.
  if (!hasSupabase) return <>{children}</>;

  if (checking) {
    return <div className="mt-10 text-sm text-draft text-center">טוען…</div>;
  }

  if (session) return <>{children}</>;

  async function submit(mode: "in" | "up") {
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const fn = mode === "in" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn.call(supabase.auth, { email, password });
    if (error) {
      setMessage(error.message);
    } else if (mode === "up") {
      setMessage("נשלח מייל אימות. אשרי אותו ואז התחברי.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-10 max-w-sm mx-auto card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-draft">התחברות</h2>
      <label className="block">
        <span className="block text-xs text-draft mb-1">כתובת מייל</span>
        <input
          type="email"
          className="field border-line"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="block text-xs text-draft mb-1">סיסמה</span>
        <input
          type="password"
          className="field border-line"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {message && <div className="text-sm text-delayed">{message}</div>}
      <div className="flex justify-end gap-2">
        <button className="btn" disabled={busy} onClick={() => submit("up")}>
          הרשמה
        </button>
        <button className="btn-primary" disabled={busy} onClick={() => submit("in")}>
          {busy ? "רגע…" : "כניסה"}
        </button>
      </div>
    </div>
  );
}
