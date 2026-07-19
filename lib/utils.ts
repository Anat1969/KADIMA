export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });
}

export function daysLeft(due: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((new Date(due).getTime() - now.getTime()) / 86400000);
}

export function daysLeftLabel(due: string): string {
  const n = daysLeft(due);
  if (n < 0) return "באיחור " + Math.abs(n) + " ימים";
  if (n === 0) return "היום";
  if (n === 1) return "מחר";
  return "בעוד " + n + " ימים";
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
}
