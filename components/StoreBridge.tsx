"use client";

import { useEffect } from "react";
import { useKadima } from "@/lib/store";

// טוען את הנתונים פעם אחת ומחזיק את מנוי ה-realtime לכל אורך חיי האפליקציה.
export default function StoreBridge() {
  const fetchTasks = useKadima((s) => s.fetchTasks);
  const subscribe = useKadima((s) => s.subscribe);

  useEffect(() => {
    fetchTasks();
    return subscribe();
  }, [fetchTasks, subscribe]);

  return null;
}
