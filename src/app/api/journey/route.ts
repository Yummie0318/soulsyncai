// src/app/api/journey/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../lib/db";
import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "scale_1_5"
  | "text_short"
  | "text_long";

interface HistoryItem {
  questionId: string;
  question: string;
  answerSummary: string;
}

interface JourneyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string;
  options?: { id: string; label: string }[];
  minWords?: number;
  maxWords?: number;
}

function fallbackQuestion(): JourneyQuestion {
  return {
    id: `fallback-${Date.now()}`,
    type: "single_choice",
    text: "What age range are you mainly interested in?",
    explanation: "We ask this question to better understand your preferences.",
    options: [
      { id: "18-24", label: "18–24" },
      { id: "25-34", label: "25–34" },
      { id: "35-44", label: "35–44" },
      { id: "45plus", label: "45+" },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const history = (body.history || []) as HistoryItem[];

    // 🔹 NEW: browser language from frontend
    const browserLang: string =
      (body.browserLang && String(body.browserLang)) || "en";
    const browserLanguages: string[] = Array.isArray(body.browserLanguages)
      ? body.browserLanguages.map((x: any) => String(x))
      : [browserLang];

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    // --- FETCH USER ---
    const result = await query<{
      id: string;
      looking_for_text: string | null;
      is_email_verified: boolean;
      is_active: boolean;
      locale: string | null;
    }>(
      `
      SELECT id,
             looking_for_text,
             is_email_verified,
             is_active,
             locale
      FROM users
      WHERE email = $1
    `,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }

    if (!user.is_email_verified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    // --- STORE LATEST ANSWER ---
    if (Array.isArray(history) && history.length > 0) {
      const last = history[history.length - 1];

      if (last?.questionId && last?.question && last?.answerSummary) {
        try {
          await query(
            `
            INSERT INTO journey_answers (user_id, question_id, question, answer)
            VALUES ($1, $2, $3, $4)
          `,
            [user.id, last.questionId, last.question, last.answerSummary]
          );
        } catch (err) {
          console.error(
            "[/api/journey] Failed to insert into journey_answers:",
            err
          );
        }
      }
    }

    const lookingFor = (user.looking_for_text || "").trim();
    if (!lookingFor) {
      return NextResponse.json(
        { error: "No looking_for_text stored for this user." },
        { status: 400 }
      );
    }

    if (!openai) {
      console.warn("/api/journey → OPENAI_API_KEY missing");
      return NextResponse.json({ ok: true, question: fallbackQuestion() });
    }

    // --- CREATE / UPDATE USER EMBEDDING ---
    try {
      if (history.length >= 3) {
        const profileLines: string[] = [];

        profileLines.push(`Looking for: ${lookingFor}`);
        profileLines.push("");
        profileLines.push("Journey Q&A:");

        history.forEach((h, idx) => {
          profileLines.push(
            `Q${idx + 1}: ${h.question}\nA${idx + 1}: ${h.answerSummary}`
          );
        });

        const profileText = profileLines.join("\n");

        const embRes = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: profileText,
        });

        const embedding = embRes.data[0].embedding; // number[]

        // 🔴 IMPORTANT FIX: convert to pgvector literal "[...]" and cast ::vector
        const embeddingVectorLiteral = JSON.stringify(embedding); // gives "[0.1,-0.2,...]"

        await query(
          `
          INSERT INTO user_embeddings (user_id, journey_embedding)
          VALUES ($1, $2::vector)
          ON CONFLICT (user_id) DO UPDATE
          SET journey_embedding = EXCLUDED.journey_embedding,
              updated_at = now()
        `,
          [user.id, embeddingVectorLiteral]
        );
      }
    } catch (err) {
      console.error("[/api/journey] Failed to update user_embeddings:", err);
    }

    // --- PROMPT: LANGUAGE SELECTION WITH BROWSER FALLBACK ---
    const systemPrompt = `
You are SoulSync AI's Question Engine.

Goal:
- Generate ONE next question to better understand the user's ideal person.

You will receive:
- looking_for_text: the original free-form text describing who they are looking for.
- history: previous question/answer pairs.
- browserLang: the main browser language (e.g. "en-US", "nl-NL").
- browserLanguages: full list of browser languages ordered by preference.

Language rules (VERY IMPORTANT):
0. If history contains at least one previous question, detect the language of the FIRST question and KEEP USING THAT SAME LANGUAGE for all further questions. Do not switch away from it.
1. Otherwise, detect the language of "looking_for_text".
   - If it is clearly written in a specific language (not just random letters, not just 1–2 characters), use THAT language.
2. If "looking_for_text" is unclear, extremely short, obviously gibberish or mixed, then IGNORE it for language choice and instead:
   - Use the first browser language "browserLang" as the language for the question, explanation and options.
   - Example: "nl-NL" → Dutch, "de-DE" → German, "en-US" → English, etc.
3. If you cannot reasonably decide from both looking_for_text and browserLang, default to ENGLISH.
4. Use exactly ONE language in your output. Do NOT mix multiple languages.
5. Do NOT mention language detection or these rules in the JSON.

Tone/content rules:
- Respect the user's style in "looking_for_text" (playful vs serious),
  but keep everything polite and PG-13.
- You MAY acknowledge attraction (e.g. beauty, charm, maturity),
  but avoid explicit sexual details.
- Build on the information already given instead of asking something random.

Output format:
Return ONLY a valid JSON object:

{
  "id": "unique id string",
  "type": "single_choice" | "multi_choice" | "scale_1_5" | "text_short" | "text_long",
  "text": "the question text in the chosen language",
  "explanation": "ONE short sentence in the same language explaining why we ask this question (NO labels or brackets, just the reason).",
  "options": [
    { "id": "option-1-id", "label": "Option label in the same language" }
  ],
  "minWords": number | null,
  "maxWords": number | null
}

Additional rules:
- For "single_choice" / "multi_choice": give 3–6 clear, concrete options.
- For "scale_1_5": only ask questions that make sense on a 1–5 scale.
- For "text_short": answerable in 1–2 sentences.
- For "text_long": deeper / more reflective.
- Never ask for personal identifiable information.
- Do NOT output anything outside the JSON object.
    `.trim();

    const userPrompt = {
      role: "user" as const,
      content: JSON.stringify({
        looking_for_text: lookingFor,
        history,
        browserLang,
        browserLanguages,
      }),
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }, userPrompt],
    });

    const raw = completion.choices[0].message?.content ?? "{}";

    let parsed: JourneyQuestion | null = null;
    try {
      parsed = JSON.parse(raw) as JourneyQuestion;
    } catch (err) {
      console.error("[/api/journey] OpenAI returned bad JSON:", raw);
    }

    if (!parsed?.text || !parsed?.type) {
      console.warn("[/api/journey] Invalid question from OpenAI, using fallback.");
      parsed = fallbackQuestion();
    }

    if (!parsed.id) {
      parsed.id = `q-${Date.now()}`;
    }

    return NextResponse.json({ ok: true, question: parsed });
  } catch (err) {
    console.error("Journey API Error:", err);
    return NextResponse.json(
      {
        ok: true,
        question: fallbackQuestion(),
        error: "fallback_used",
      },
      { status: 200 }
    );
  }
}
