export async function translateTexts<T extends Record<string, string>>(
  texts: T,
  targetLang: string
): Promise<T> {
  console.log("[translateTexts] Called with targetLang =", targetLang, {
    textKeys: Object.keys(texts),
  });

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, targetLang }),
    });

    console.log("[translateTexts] Response status from /api/translate =", res.status);

    if (!res.ok) {
      console.error("translateTexts: /api/translate returned status", res.status);
      return texts; // fallback to original
    }

    let data: any = null;
    try {
      data = await res.json();
      console.log("[translateTexts] Parsed JSON from /api/translate:", data);
    } catch (jsonErr) {
      console.error("translateTexts: failed to parse JSON", jsonErr);
      return texts;
    }

    const remote = data?.translated;
    if (!remote || typeof remote !== "object") {
      console.warn("translateTexts: invalid 'translated' payload, using defaults", data);
      return texts;
    }

    console.log("[translateTexts] 'translated' keys:", Object.keys(remote));

    // Merge to avoid losing any keys
    const merged = { ...texts, ...(remote as T) };
    console.log("[translateTexts] Merged texts sample:", Object.fromEntries(Object.entries(merged).slice(0, 3)));
    return merged;
  } catch (err) {
    console.error("translateTexts: request failed", err);
    return texts;
  }
}
