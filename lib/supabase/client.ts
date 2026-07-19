import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// מצב הדגמה: אם אין מפתחות Supabase, האפליקציה רצה עם נתוני דוגמה בזיכרון.
export const hasSupabase = Boolean(url && key);

// קדימה יושבת בסכמה נפרדת משלה. הסכמה public שייכת לאפליקציה אחרת
// באותו פרויקט Supabase — אין לגעת בה.
export const KADIMA_SCHEMA = "kadima";

// הטיפוס נגזר מהקריאה כדי לשמר את הסכמה הלא-דיפולטית.
export const supabase = hasSupabase
  ? createClient(url as string, key as string, { db: { schema: KADIMA_SCHEMA } })
  : null;
