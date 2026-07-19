import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// מצב הדגמה: אם אין מפתחות Supabase, האפליקציה רצה עם נתוני דוגמה בזיכרון.
export const hasSupabase = Boolean(url && key);
export const supabase: SupabaseClient | null = hasSupabase ? createClient(url as string, key as string) : null;
