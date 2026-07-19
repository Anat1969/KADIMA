# פרומפט ל-Claude Code — קדימה גרסה 2

השינוי המרכזי מהפרומפט הקודם: **הקוד כבר קיים בתיקייה**. Claude Code לא בונה מאפס — הוא ממשיך. הוא גם יקרא אוטומטית את `CLAUDE.md` שבשורש הפרויקט.

## הכנה חד-פעמית (לפני הפעם הראשונה)
1. Supabase: פרויקט חדש `kadima`, הריצי את `supabase/schema.sql` ב-SQL Editor.
2. העתיקי `.env.local.example` ל-`.env.local` ומלאי את המפתחות (Settings > API).
3. GitHub: repo חדש בשם `kadima`.

## פתיחת Claude Code
```
cd ~/projects/kadima
claude
```

מומלץ: לפני שמתחילים, בטרמינל בתוך התיקייה, הריצי `uipro init --ai claude` — זה מגדיר ל-Claude Code סטנדרט UI מקצועי לפרויקט.

## פרומפט הפתיחה — העתיקי והדביקי

```
זה פרויקט "קדימה" — אפליקציה עובדת. קראת את CLAUDE.md.

התחל כך:
1. הרץ npm install ואז npm run build. תקן כל שגיאה עד build נקי.
2. הרץ npm run dev ואשר שארבעת המסכים עובדים.
3. אתחל git, בצע commit ראשון "initial working version", חבר ל-remote בשם kadima ודחוף.

אחר כך עבוד לפי סדר "השלבים הבאים" ב-CLAUDE.md, שלב אחד בכל פעם:
- לפני כל שלב: הצג לי בקצרה מה תבנה ואיך, וחכה לאישור שלי.
- אחרי כל שלב: npm run build נקי, בדיקה ידנית, commit אטומי, ואז עצור לאישור.

כללי הברזל ב-CLAUDE.md מחייבים: RTL מלא, ללא אייקונים, עברית, מקור נתונים אחד, שמירה אוטומטית, עקביות סטטוסים דרך STATUS_MAP בלבד.

התחל בשלב 1: מסך רשומה בודדת app/task/[id]/page.tsx.
```

## מה לבקש בהמשך (פרומפטים מוכנים לכל שלב)

**Realtime:**
```
הוסף Supabase realtime subscription ל-lib/store.ts כך ששינוי בטבלת tasks או task_steps מעדכן את ה-store מיד. ודא שאין לולאת עדכון (שינוי מקומי לא מפעיל fetch מיותר).
```

**AI Ingestion:**
```
בנה app/api/ingest/route.ts: מקבל טקסט חופשי, שולח ל-Claude API (המפתח ANTHROPIC_API_KEY ב-env בצד שרת בלבד, לעולם לא בצד לקוח), ומחזיר JSON עם name, department, contact, start_date, due_date, next_step מוצעים. חבר לתיבת הקליטה במסך הזרימה: אחרי הקליטה מוצג כרטיס "הנה מה שהבנתי" עם אשר / תקן.
```

**Ghost Draft:**
```
במסך רשומה בודדת הוסף כפתור "נסחי טיוטה" עם שתי אפשרויות: מייל תשובה לאיש הקשר, וסיכום סטטוס למנכ"ל. הניסוח דרך app/api/draft/route.ts עם Claude API. התוצאה נפתחת בתיבת טקסט לעריכה + כפתור העתקה.
```

**פריסה ל-Vercel:**
```
ודא build נקי, ואז הנחה אותי צעד-צעד לחבר את ה-repo ל-Vercel כולל שני משתני הסביבה של Supabase.
```
