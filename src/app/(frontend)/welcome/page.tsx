// src/app/(frontend)/welcome/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "../../../hooks/useTranslation";

const defaultTexts = {
  subtitle: "Let’s find your person.",
  continueJourney: "Continue my journey",
  startNewJourney: "Start a new journey",
};

export default function WelcomePage() {
  const { texts, loading } = useTranslation(defaultTexts, "welcomePage");

  // Defensive fallback (same pattern as your other app)
  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("subtitle" in texts)
      ? defaultTexts
      : texts;

  if (loading) {
    // Skeleton: no real text, just shapes
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
            {/* Logo skeleton */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#f5f5f7] animate-pulse" />
            </div>

            {/* Text skeleton */}
            <div className="w-full max-w-xs space-y-3">
              <div className="h-6 rounded-full bg-[#e5e5ea] animate-pulse" />
              <div className="h-4 rounded-full bg-[#e5e5ea] w-3/4 animate-pulse" />
            </div>

            {/* Buttons skeleton */}
            <div className="mt-8 w-full flex flex-col gap-3">
              <div className="h-11 rounded-2xl bg-[#e5e5ea] animate-pulse" />
              <div className="h-11 rounded-2xl bg-[#e5e5ea] animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

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
          {/* Logo */}
          <div className="mb-6 flex justify-center apple-motion-logo">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#f5f5f7]">
              <Image
                src="/logo-removebg-preview.png"
                alt="SoulSync Logo"
                width={90}
                height={90}
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Title (NOT translated) + subtitle (translated) */}
          <div className="text-center apple-motion-text">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>
            <p className="mt-2 text-[16px] leading-snug text-[#8e8e93]">
              {safeTexts.subtitle}
            </p>
          </div>

          {/* Buttons (translated) */}
          <div className="mt-8 w-full flex flex-col gap-3 apple-motion-buttons">
            {/* Continue button → /login */}
            <Link href="/login" className="w-full">
              <button
                className="
                  w-full rounded-2xl border border-[#e5e5ea]
                  bg-white py-3.5 text-[16px]
                  font-medium text-[#1c1c1e]
                  tracking-tight transition
                  hover:bg-[#f5f5f7]
                  active:bg-[#e5e5ea]
                  active:scale-[0.97]
                  hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]
                "
              >
                {safeTexts.continueJourney}
              </button>
            </Link>

            {/* Start new journey → /new */}
            <Link href="/new" className="w-full">
              <button
                className="
                  w-full rounded-2xl border border-[#e5e5ea]
                  bg-white py-3.5 text-[16px]
                  font-medium text-[#1c1c1e]
                  tracking-tight transition
                  hover:bg-[#f5f5f7]
                  active:bg-[#e5e5ea]
                  active:scale-[0.97]
                  hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]
                "
              >
                {safeTexts.startNewJourney}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
