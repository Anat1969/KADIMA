# קדימה — הנחיות ל-Claude Code

אפליקציית ניהול משימות ויוזמות לאדריכלית העיר. המשתמשת זורקת חומר גלם, האפליקציה מארגנת, מנסחת ומדווחת למנכ"ל. המשתמשת רק מאשרת.

## מצב הפרויקט
הקוד כאן הוא **גרסה 1 עובדת**: ארבעה מסכים (זרימה, טבלה, מפת עבודה, דוח למנכ"ל), Zustand store כמקור נתונים מרכזי, חיבור Supabase עם fallback למצב הדגמה. אל תבני מחדש — הרחיבי.

## הרצה
```
npm install
npm run dev
```
בלי `.env.local` האפליקציה רצה במצב הדגמה (נתוני seed בזיכרון). לחיבור אמיתי: העתיקי את `.env.local.example` ל-`.env.local`, מלאי מפתחות מ-Supabase, והריצי את `supabase/schema.sql` ב-SQL Editor.

## ארכיטקטורה
- `lib/store.ts` — מקור האמת היחיד. כל CRUD עובר דרכו. סלקטורים: `selectVisibleTasks`, `selectStats`, `selectDepartments`.
- `lib/types.ts`, `lib/constants.ts` — טיפוסים ומיפוי סטטוסים. **כל שינוי סטטוס/צבע — רק כאן.**
- `lib/supabase/client.ts` — `hasSupabase` קובע מצב הדגמה/אמיתי.
- `app/` — ארבעה מסכים. כולם קוראים מה-store, אף אחד לא מחזיק נתונים משלו.
- `tailwind.config.ts` — כל ה-tokens (צבעים, פונט). אין צבעים קשיחים בקומפוננטות.

## כללי ברזל — אין לחרוג
1. RTL מלא. `dir="rtl"` ב-html, בלי `ml/mr` — רק `ms/me` או padding סימטרי.
2. ללא אייקונים ואימוג'י — טקסט בלבד.
3. עברית בכל טקסט ממשק.
4. מקור נתונים אחד (store). שינוי במקום אחד מתעדכן בכל המסכים.
5. כל שדה ניתן לעריכה, שמירה אוטומטית (אין כפתור "שמור").
6. עקביות סטטוסים: אותו צבע ואותה מילה בכל מסך — דרך `STATUS_MAP` בלבד.
7. פונט: Noto Sans Hebrew.
8. אין `console.log` בפרודקשן.
9. commit אטומי, הודעות באנגלית בזמן הווה ("add report export").
10. לא דורסים עיצוב קיים — מרחיבים.

## מה נבנה (שלבים 1–5 הושלמו)
1. **מסך רשומה בודדת** — `app/task/[id]/page.tsx`: כל השדות, שלבי ביניים עם הוספה/עריכה/מחיקה, חומר גלם ותוצרים.
2. **Realtime** — `subscribe()` ב-store, עם שמירה מפני לולאת הד (`markLocal`/`isEcho`). מותקן פעם אחת ב-`components/StoreBridge.tsx`.
3. **AI Ingestion** — `app/api/ingest/route.ts`. תיבת הקליטה מציגה כרטיס "הנה מה שהבנתי" לאישור או תיקון. בלי `ANTHROPIC_API_KEY` נופלת אוטומטית לקליטה הפשוטה.
4. **Ghost Draft** — `components/DraftBox.tsx` + `app/api/draft/route.ts`: מייל תשובה / סיכום למנכ"ל, עריכה והעתקה.
5. **Auth** — `components/AuthGate.tsx` + מדיניות RLS לפי משתמש ב-`supabase/schema.sql`.

## השלב הבא
**פריסה** — GitHub repo בשם `kadima`, חיבור Vercel, ושלושה משתני סביבה ב-Vercel:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.

## הפרדת מסד הנתונים — קריטי
פרויקט ה-Supabase (`neo-gallery-spark`) **משותף עם אפליקציה אחרת** שיושבת בסכמה `public`
ויש לה טבלת `tasks` משלה עם מבנה שונה. קדימה יושבת בסכמה נפרדת בשם `kadima`.
- `lib/supabase/client.ts` מגדיר `db: { schema: KADIMA_SCHEMA }` — אל תסירי.
- מנוי ה-realtime ב-`lib/store.ts` מסנן לפי `KADIMA_SCHEMA` — אל תחזירי ל-`public`.
- `supabase/schema.sql` כותב רק ל-`kadima`. אל תשני אותו כך שיכתוב ל-`public`.

## הערות תחזוקה
- `ANTHROPIC_API_KEY` — צד שרת בלבד, לעולם לא בקומפוננטת לקוח ולא עם קידומת `NEXT_PUBLIC_`.
- מסכי ה-AI מתוכננים לעבוד גם בלי מפתח — אל תשברי את מסלול הנפילה הזה.
- הרצת `supabase/schema.sql` מחדש בטוחה: כל ההגדרות אידמפוטנטיות.

## בדיקה לפני כל commit
`npm run build` חייב לעבור נקי. בדקי את ארבעת המסכים ידנית ב-RTL.
