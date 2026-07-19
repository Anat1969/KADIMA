import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "שם קצר וברור למשימה, עד 60 תווים" },
    department: { type: "string", description: "המינהל האחראי, או מחרוזת ריקה אם לא ידוע" },
    contact: { type: "string", description: "שם איש הקשר, או מחרוזת ריקה אם לא ידוע" },
    start_date: { type: "string", description: "תאריך התחלה בפורמט YYYY-MM-DD, או מחרוזת ריקה" },
    due_date: { type: "string", description: "תאריך יעד בפורמט YYYY-MM-DD, או מחרוזת ריקה" },
    next_step: { type: "string", description: "הצעד הבא הקונקרטי שצריך לעשות" },
    type: { type: "string", enum: ["external", "initiative"], description: "משימה חיצונית או יוזמה" }
  },
  required: ["name", "department", "contact", "start_date", "due_date", "next_step", "type"],
  additionalProperties: false
} as const;

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "לא הוגדר מפתח API בצד השרת." }, { status: 503 });
  }

  const { text } = await request.json();
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "לא התקבל טקסט." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const client = new Anthropic({ apiKey: key });
    const response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      system:
        "את עוזרת של אדריכלית העיר. מהחומר הגולמי שמועבר אלייך חלצי את פרטי המשימה. " +
        "כל הטקסט בעברית. אם פרט אינו מופיע בחומר, החזירי מחרוזת ריקה — אל תמציאי. " +
        "תאריכים יחסיים (\"בשבוע הבא\", \"עד סוף החודש\") חשבי ביחס לתאריך היום: " +
        today +
        ". יוזמה היא משימה שהאדריכלית יזמה בעצמה; משימה חיצונית הגיעה מגורם אחר.",
      messages: [{ role: "user", content: text }]
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      return NextResponse.json({ error: "לא הצלחתי לפענח את החומר." }, { status: 502 });
    }
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "שגיאה בפנייה לשירות הניסוח." }, { status: 502 });
  }
}
