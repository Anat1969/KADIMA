"use client";

import { useEffect } from "react";
import { useKadima } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

// טוען את הנתונים, מחזיק את מנוי ה-realtime, ומרענן בכל שינוי התחברות.
export default function StoreBridge() {
  const fetchTasks = useKadima((s) => s.fetchTasks);
  const subscribe = useKadima((s) => s.subscribe);
  const reset = useKadima((s) => s.reset);

  useEffect(() => {
    fetchTasks();
    const unsubscribe = subscribe();

    if (!supabase) return unsubscribe;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        reset();
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchTasks();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      unsubscribe();
    };
  }, [fetchTasks, subscribe, reset]);

  return null;
}
