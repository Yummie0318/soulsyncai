// src/app/(frontend)/resetsuccess/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "../../../hooks/useTranslation";

const defaultTexts = {
  subtitle: "Let’s find your person.",
  success: "Your password has been successfully reset!",
  continue: "Continue Journey",
};

export default function ResetSuccessPage() {
  const { texts, loading } = useTranslation(defaultTexts, "resetSuccessPage");

  // Safe fallback if translation fails
  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("success" in texts)
      ? defaultTexts
      : texts;

  if (loading) {
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
            {/* Skeleton Logo */}
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f5f5f7] animate-pulse" />

            {/* Text Skeleton */}
            <div className="w-full max-w-xs space-y-3 mt-6">
              <div className="h-6 rounded-full bg-[#e5e5ea] animate-pulse" />
              <div className="h-4 rounded-full bg-[#e5e5ea] w-3/4 animate-pulse" />
            </div>

            {/* Button Skeleton */}
            <div className="mt-10 h-12 rounded-2xl bg-[#e5e5ea] w-full animate-pulse" />
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
          <header className="flex flex-col items-center text-center apple-motion-logo">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f5f5f7]">
              <Image
                src="/logo-removebg-preview.png"
                alt="SoulSync Logo"
                width={80}
                height={80}
                priority
                className="object-contain"
              />
            </div>

            {/* App Name (NOT translated) */}
            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>

            {/* Tagline */}
            <p className="mt-2 text-[15px] sm:text-[16px] text-[#8e8e93]">
              {safeTexts.subtitle}
            </p>

            {/* Success Message */}
            <p className="mt-6 text-[16px] sm:text-[17px] text-[#1c1c1e] font-medium apple-motion-text">
              {safeTexts.success}
            </p>
          </header>

          {/* Continue Button */}
          <div className="mt-10 w-full apple-motion-buttons">
            <Link href="/login" className="w-full">
              <button
                type="button"
                className="
                  w-full rounded-2xl
                  bg-[#1c1c1e]
                  py-3.5 text-[16px] font-semibold text-white
                  tracking-tight transition
                  hover:bg-[#2c2c2e]
                  active:bg-black active:scale-[0.97]
                  shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                "
              >
                {safeTexts.continue}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
