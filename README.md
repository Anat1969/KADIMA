# קדימה

אפליקציית ניהול משימות ויוזמות לאדריכלית העיר — קולטת חומר גלם, מארגנת, מנסחת ומדווחת למנכ"ל.

## הרצה מקומית

```
npm install
npm run dev
```

נפתח ב-http://localhost:3000. בלי הגדרת Supabase האפליקציה רצה **במצב הדגמה** עם נתוני דוגמה.

## חיבור Supabase (שמירה קבועה)

1. פרויקט חדש ב-supabase.com בשם `kadima`.
2. SQL Editor — הדביקי את `supabase/schema.sql` והריצי.
3. העתיקי `.env.local.example` ל-`.env.local` ומלאי URL ו-anon key מ-Settings > API.
4. הפעילי מחדש `npm run dev`.

## פריסה

1. GitHub: repo חדש `kadima`, push.
2. Vercel: Import מה-repo, הוסיפי את שני משתני הסביבה, Deploy.

## מבנה

- `app/` — ארבעה מסכים: זרימה, טבלה, מפת עבודה, דוח למנכ"ל
- `components/` — רכיבים משותפים
- `lib/store.ts` — מקור הנתונים המרכזי (Zustand + Supabase)
- `supabase/schema.sql` — סכמת מסד הנתונים
- `CLAUDE.md` — הנחיות ל-Claude Code להמשך פיתוח
- `docs/` — אפיון ופרומפט בנייה
