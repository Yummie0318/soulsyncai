import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// simple in-memory cache per server process
const cache = new Map<string, Record<string, string>>();

interface TranslateRequest {
  texts: Record<string, string>;
  targetLang: string;
}

export async function POST(req: NextRequest) {
  let texts: Record<string, string> = {};

  try {
    console.log("[/api/translate] Incoming request");

    const body: TranslateRequest = await req.json();
    texts = body.texts || {};
    const { targetLang } = body;

    console.log("[/api/translate] Parsed body:", {
      targetLang,
      textKeys: Object.keys(texts),
      textSample: Object.fromEntries(Object.entries(texts).slice(0, 3)),
    });

    // Safety: if texts is empty, just return it so we don't do extra work
    if (!texts || Object.keys(texts).length === 0) {
      console.warn("[/api/translate] Empty texts payload");
      return NextResponse.json({ translated: texts });
    }

    if (!targetLang) {
      console.warn("[/api/translate] No targetLang provided, returning original texts");
      return NextResponse.json({ translated: texts });
    }

    // If English – return original
    if (targetLang.startsWith("en")) {
      console.log("[/api/translate] English targetLang detected, skipping translation");
      return NextResponse.json({ translated: texts });
    }

    const cacheKey = `${targetLang}::${JSON.stringify(texts)}`;
    if (cache.has(cacheKey)) {
      console.log("[/api/translate] Using cache for", targetLang);
      return NextResponse.json({ translated: cache.get(cacheKey) });
    }

    console.log("[/api/translate] Calling OpenAI.chat.completions.create...", {
      model: "gpt-4o-mini",
      targetLang,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a translator.
Translate ALL values in the JSON object into ${targetLang}.
Keep the keys exactly the same.
Respond with ONLY valid JSON.`,
        },
        {
          role: "user",
          content: JSON.stringify(texts),
        },
      ],
    });

    console.log("[/api/translate] OpenAI response meta:", {
      id: response.id,
      model: response.model,
      usage: response.usage,
    });

    const rawContent = response.choices[0].message?.content ?? "";
    console.log("[/api/translate] Raw content from OpenAI:", rawContent);

    let translated: Record<string, string> | null = null;

    try {
      translated = rawContent
        ? (JSON.parse(rawContent) as Record<string, string>)
        : null;
    } catch (jsonErr) {
      console.error(
        "[/api/translate] Failed to parse JSON from OpenAI:",
        jsonErr
      );
      console.error("[/api/translate] Content that failed to parse:", rawContent);
      translated = null;
    }

    if (!translated || typeof translated !== "object") {
      console.warn(
        "[/api/translate] OpenAI returned invalid translation, falling back to original texts"
      );
      translated = texts;
    } else {
      console.log("[/api/translate] Successfully parsed translations. Keys:", Object.keys(translated));
    }

    cache.set(cacheKey, translated);

    return NextResponse.json({ translated });
  } catch (error) {
    console.error("[/api/translate] Error in handler:", error);
    // fallback: return original English
    return NextResponse.json({ translated: texts });
  }
}
