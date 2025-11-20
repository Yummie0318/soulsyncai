"use client";

import { useEffect, useState } from "react";
import { translateTexts } from "../utils/translate";

// bump version so we ignore old cached objects
const LS_PREFIX = "ssai.translations.v2";

function getLang() {
  if (typeof navigator === "undefined") return "en";
  return navigator.language || "en";
}

/** 
 * defaultTexts = English base object
 * namespace = unique id per screen/component, e.g. "welcome", "signupForm"
 */
export function useTranslation<T extends Record<string, string>>(
  defaultTexts: T,
  namespace = "global"
) {
  const [texts, setTexts] = useState<T>(defaultTexts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lang = getLang();
    console.log("[useTranslation] Detected lang =", lang, "namespace =", namespace);

    if (lang.startsWith("en")) {
      console.log("[useTranslation] English detected, skipping translation");
      setTexts(defaultTexts);
      setLoading(false);
      return;
    }

    const cacheKey = `${LS_PREFIX}:${namespace}:${lang}`;
    let cached: T | null = null;

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(cacheKey);
      if (raw) {
        try {
          cached = JSON.parse(raw);
          console.log("[useTranslation] Using cached translation for", lang, {
            cacheKey,
            cachedKeys: Object.keys(cached || {}),
          });
        } catch (e) {
          console.error("[useTranslation] Failed to parse cache", e);
        }
      } else {
        console.log("[useTranslation] No cache entry found for", cacheKey);
      }
    }

    if (cached && Object.keys(cached).length > 0) {
      setTexts(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        console.log("[useTranslation] Fetching translations from /api/translate...", {
          namespace,
          lang,
        });
        const translated = await translateTexts(defaultTexts, lang);
        if (cancelled) {
          console.log("[useTranslation] Cancelled, ignoring translation result");
          return;
        }

        console.log("[useTranslation] Received translations:", {
          keys: Object.keys(translated),
          sample: Object.fromEntries(Object.entries(translated).slice(0, 3)),
        });

        if (!translated || Object.keys(translated).length === 0) {
          console.warn("[useTranslation] Translated object empty, falling back to defaultTexts");
          setTexts(defaultTexts);
        } else {
          setTexts(translated);
        }
        setLoading(false);

        if (typeof window !== "undefined") {
          localStorage.setItem(cacheKey, JSON.stringify(translated));
          console.log("[useTranslation] Stored translations in localStorage under", cacheKey);
        }
      } catch (err) {
        console.error("[useTranslation] Translation failed:", err);
        if (!cancelled) {
          setTexts(defaultTexts); // fallback to English
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [defaultTexts, namespace]);

  return { texts, loading };
}
