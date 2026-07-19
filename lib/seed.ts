import type { Task } from "./types";
import { uid } from "./utils";

function steps(taskId: string, items: [string, boolean][]) {
  return items.map(([title, done], i) => ({
    id: uid(), task_id: taskId, title, done, note: "", order_index: i
  }));
}

export function seedTasks(): Task[] {
  const t = (partial: Omit<Task, "id" | "steps" | "updated_at">, s: [string, boolean][]): Task => {
    const id = uid();
    return { ...partial, id, steps: steps(id, s), updated_at: new Date().toISOString() };
  };
  return [
    t({ name: "תכנית מתאר רובע מערבי", department: "מינהל תכנון", contact: "רונית כהן", type: "external", status: "waiting",
        start_date: "2026-06-15", due_date: "2026-07-22", raw_material: "פרוגרמה + סקר תנועה", deliverable: "חוות דעת אדריכל העיר",
        notes: "", next_step: "לתאם פגישת עבודה עם צוות התנועה" },
      [["קריאת חומר רקע", true], ["סיור בשטח", true], ["טיוטת חוות דעת", false], ["תיאום עם מהנדס העיר", false]]),
    t({ name: "מדיניות חזיתות מסחריות", department: "יוזמה עצמית", contact: "", type: "initiative", status: "in_progress",
        start_date: "2026-06-01", due_date: "2026-07-30", raw_material: "צילומי רחוב + דוגמאות מהעולם", deliverable: "מסמך מדיניות + מצגת",
        notes: "פרק שילוט כמעט מוכן", next_step: "השלמת פרק תאורה והצללה" },
      [["איסוף דוגמאות", true], ["מבנה המסמך", true], ["כתיבת פרקים", false], ["מצגת להנהלה", false]]),
    t({ name: "אישור חזות בניין עירייה", department: "מינהל הנדסה", contact: "אבי לוי", type: "external", status: "ready",
        start_date: "2026-07-01", due_date: "2026-07-20", raw_material: "הדמיות אדריכל הפרויקט", deliverable: "אישור חזות חתום",
        notes: "", next_step: "שליחת האישור למינהל הנדסה" },
      [["בדיקת הדמיות", true], ["הערות לאדריכל", true], ["גרסה מתוקנת", true], ["חתימה ושליחה", false]]),
    t({ name: "תב\"ע נקודתית שכונת הפארק", department: "מינהל תכנון", contact: "דנה שפירא", type: "external", status: "delayed",
        start_date: "2026-06-20", due_date: "2026-07-18", raw_material: "מסמכי התב\"ע + התנגדויות", deliverable: "המלצה לוועדה המקומית",
        notes: "ממתינה לתשובת יועמ\"ש", next_step: "תזכורת ליועמ\"ש — 5 ימים ללא מענה" },
      [["ניתוח התנגדויות", true], ["פניה ליועמ\"ש", true], ["טיוטת המלצה", false]]),
    t({ name: "סקר מבנים לשימור ברובע הישן", department: "מינהל תרבות", contact: "מיכל ברון", type: "initiative", status: "draft",
        start_date: "2026-07-10", due_date: "2026-08-15", raw_material: "רשימת מבנים ראשונית", deliverable: "מתודולוגיית סקר + תקציב",
        notes: "", next_step: "ניסוח הצעת יוזמה למנכ\"ל" },
      [["הגדרת מתודולוגיה", false], ["אומדן תקציב", false], ["הצעה למנכ\"ל", false]]),
    t({ name: "הנחיות מרחב ציבורי — שכונה חדשה", department: "מינהל תכנון", contact: "יוסי אלון", type: "external", status: "in_progress",
        start_date: "2026-07-05", due_date: "2026-08-01", raw_material: "תכנית בינוי מאושרת", deliverable: "מסמך הנחיות מחייב",
        notes: "", next_step: "טיוטה ראשונה לפרק ריהוט רחוב" },
      [["לימוד תכנית הבינוי", true], ["מבנה מסמך ההנחיות", true], ["כתיבת פרקים", false], ["תיאום עם גורמי ביצוע", false]])
  ];
}
