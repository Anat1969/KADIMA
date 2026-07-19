import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const KINDS = {
  email:
    "נסחי מייל תשובה קצר ומקצועי לאיש הקשר של המשימה. פנייה מנומסת, עדכון על המצב, " +
    "והצעד הבא. בלי כותרות מיותרות — רק גוף המייל.",
  ceo:
    "נסחי סיכום סטטוס קצר למנכ\"ל. שורה או שתיים: מה המצב, מה נעשה, מה הצעד הבא. " +
    "ענייני, בלי הקדמות."
} as const;

type Kind = keyof typeof KINDS;

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "לא הוגדר מפתח API בצד השרת." }, { status: 503 });
  }

  const { kind, task } = await request.json();
  if (!kind || !(kind in KINDS) || !task) {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const details = [
    "משימה: " + task.name,
    task.department && "מינהל: " + task.department,
    task.contact && "איש קשר: " + task.contact,
    "סטטוס: " + task.status,
    task.due_date && "תאריך יעד: " + task.due_date,
    task.next_step && "הצעד הבא: " + task.next_step,
    task.raw_material && "חומר גלם: " + task.raw_material,
    task.deliverable && "תוצרים: " + task.deliverable,
    task.notes && "הערות: " + task.notes
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system:
        "את עוזרת של אדריכלית העיר וכותבת בשמה. הכל בעברית תקנית ועניינית. " +
        "בלי אימוג'י ובלי סימנים מיוחדים. " +
        KINDS[kind as Kind],
      messages: [{ role: "user", content: details }]
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "שגיאה בפנייה לשירות הניסוח." }, { status: 502 });
  }
}
