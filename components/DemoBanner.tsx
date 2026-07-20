"use client";

import { useKadima } from "@/lib/store";

export default function DemoBanner() {
  const demoMode = useKadima((s) => s.demoMode);
  if (!demoMode) return null;
  return (
    <div className="mt-4 text-xs text-waiting bg-waitingBg border border-line rounded px-3 py-2">
      מצב הדגמה — הנתונים בזיכרון בלבד ואינם נשמרים. להפעלת שמירה קבועה בלי מסך התחברות:
      Supabase ← Authentication ← Providers ← Anonymous sign-ins ← Enable.
    </div>
  );
}
