"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SignOut() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setEmail(s?.user.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!email) return null;

  return (
    <div className="text-xs text-draft text-left">
      <div>{email}</div>
      <button
        className="hover:text-ink mt-1"
        onClick={async () => {
          await supabase?.auth.signOut();
        }}
      >
        התנתקות
      </button>
    </div>
  );
}
