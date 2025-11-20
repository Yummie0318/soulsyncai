// src/app/(frontend)/looking/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../hooks/useTranslation";

const defaultTexts = {
  tagline: "Let's find your person.",
  questionTitle: "What kind of person are you looking for?",
  questionNote: "Feel free to describe them in any language you like.",
  continue: "Continue",
};

export default function LookingPage() {
  const [text, setText] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const router = useRouter();

  const { texts, loading } = useTranslation(defaultTexts, "lookingPage");

  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("questionTitle" in texts)
      ? defaultTexts
      : texts;

  // Load email once (could come from signup or login flow)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fromSignup = window.localStorage.getItem("ssai.signup.email");
    const fromLogin = window.localStorage.getItem("ssai.login.email");

    if (fromSignup) {
      setEmail(fromSignup);
    } else if (fromLogin) {
      setEmail(fromLogin);
    }
  }, []);

  // Skeleton (Apple-style)
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4">
        <div className="w-full max-w-[430px]">
          <div className="rounded-[40px] bg-white border px-6 py-10 shadow animate-pulse">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[#e5e5ea]" />
            <div className="h-6 w-40 bg-[#e5e5ea] mx-auto rounded-full" />
            <div className="h-4 w-52 bg-[#e5e5ea] mx-auto rounded-full mt-2" />

            <div className="mt-10 h-5 w-64 bg-[#e5e5ea] rounded-full mx-auto" />
            <div className="h-4 w-52 bg-[#e5e5ea] rounded-full mx-auto mt-3" />
            <div className="mt-6 h-28 w-full bg-[#e5e5ea] rounded-3xl" />

            <div className="mt-10 h-12 w-full bg-[#e5e5ea] rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  const handleContinue = async () => {
    const trimmed = text.trim();
    setError(null);
    setInfo(null);

    if (!trimmed) {
      setError("Please tell us a little about the person you’re looking for.");
      return;
    }

    if (trimmed.length < 20) {
      setError("Add a bit more detail so SoulSync can understand you better.");
      return;
    }

    if (!email) {
      setError("We couldn’t find your email. Please log in or sign up again.");
      return;
    }

    try {
      setSubmitting(true);

      const normalizedEmail = String(email).trim().toLowerCase();

      const res = await fetch("/api/looking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          lookingForText: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "User not found") {
          setError("We couldn’t find your profile. Please log in or sign up again.");
        } else {
          setError(data?.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Save unified user object for Journey page
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "soulsync.user",
          JSON.stringify({ email: normalizedEmail })
        );
      }

      // Optional info text (will show very briefly)
      setInfo("Saved. SoulSync will use this to find your person.");

      // Go to the journey flow
      router.push("/journey");
    } catch (err) {
      console.error("[looking] save error:", err);
      setError("Couldn’t save right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canContinue = text.trim().length >= 20 && !submitting;

  return (
    <main
      className="min-h-screen bg-[#f2f2f7] flex items-center justify-center px-4"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="w-full max-w-[430px]">
        <div
          className="
            flex flex-col items-center
            rounded-[40px] bg-white
            border border-[#f1f1f4]
            shadow-[0_18px_40px_rgba(0,0,0,0.04)]
            px-6 py-10 sm:px-8 sm:py-12
            apple-motion-card
          "
        >
          {/* Logo + app name + tagline */}
          <header className="flex flex-col items-center text-center apple-motion-logo">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f5f7]">
              <Image
                src="/logo-removebg-preview.png"
                alt="SoulSync Logo"
                width={64}
                height={64}
                priority
                className="object-contain"
              />
            </div>

            {/* Brand name — NOT translated */}
            <h1 className="text-[24px] sm:text-[26px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>

            {/* Translated tagline */}
            <p className="mt-1 text-[14px] sm:text-[15px] text-[#8e8e93]">
              {safeTexts.tagline}
            </p>
          </header>

          {/* Question + textarea */}
          <section className="mt-8 w-full apple-motion-text">
            <h2 className="text-[20px] sm:text-[21px] font-semibold text-[#1c1c1e] leading-snug">
              {safeTexts.questionTitle}
            </h2>

            <p className="mt-2 text-[14px] sm:text-[15px] text-[#8e8e93]">
              {safeTexts.questionNote}
            </p>

            <div className="mt-4 relative">
              <textarea
                rows={4}
                maxLength={200}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(null);
                  setInfo(null);
                }}
                className="
                  w-full rounded-3xl border border-[#e5e5ea]
                  bg-[#f9f9fb]
                  px-4 py-3 text-[15px] text-[#1c1c1e]
                  outline-none resize-none
                  focus:bg-white
                  focus:border-[#007aff]
                  focus:ring-2 focus:ring-[#bfddff]
                  transition
                "
                placeholder="Kind, family-oriented, loves traveling, enjoys deep conversations late at night…"
              />

              <div className="absolute bottom-2 right-4 text-[12px] text-[#8e8e93]">
                {text.length} / 200
              </div>
            </div>
          </section>

          {/* Error / info */}
          {error && (
            <p className="mt-4 text-[13px] text-[#ff3b30] text-center px-4">
              {error}
            </p>
          )}
          {info && !error && (
            <p className="mt-4 text-[13px] text-[#34c759] text-center px-4">
              {info}
            </p>
          )}

          {/* Continue button */}
          <div className="mt-8 w-full apple-motion-buttons">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={`
                w-full rounded-2xl
                bg-[#1c1c1e]
                py-3.5 text-[16px] font-semibold text-white
                tracking-tight transition
                hover:bg-[#2c2c2e]
                active:bg-black active:scale-[0.97]
                shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                ${
                  !canContinue
                    ? "opacity-60 cursor-not-allowed active:scale-100"
                    : ""
                }
              `}
            >
              {submitting ? "Saving…" : safeTexts.continue}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
