// src/app/(frontend)/forgot/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../hooks/useTranslation";

const defaultTexts = {
  subtitle: "Let’s find your person.",
  recover: "Recover your password.",
  emailLabel: "Email address",
  emailPlaceholder: "you@example.com",
  sendOtp: "Send OTP",
};

export default function ForgotPage() {
  // form state
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const router = useRouter();

  // 🆕 new namespace, so it ignores old cached translations
  const { texts, loading } = useTranslation(defaultTexts, "forgotPageV2");

  const safeTexts =
    !texts ||
    Object.keys(texts).length === 0 ||
    !("subtitle" in texts) ||
    !("recover" in texts) ||
    !("emailLabel" in texts) ||
    !("emailPlaceholder" in texts) ||
    !("sendOtp" in texts)
      ? defaultTexts
      : texts;

  // ✅ Just PREFILL email if we know it — do NOT block logged-out users
  useEffect(() => {
    if (typeof window === "undefined") return;

    let foundEmail: string | null = null;

    // 1) primary session key
    const rawUser = window.localStorage.getItem("soulsync.user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed?.email) {
          foundEmail = String(parsed.email).trim().toLowerCase();
        }
      } catch {
        // ignore parse error
      }
    }

    // 2) fallback to old keys if needed
    if (!foundEmail) {
      const fromSignup = window.localStorage.getItem("ssai.signup.email");
      const fromLogin = window.localStorage.getItem("ssai.login.email");
      const fallback = fromSignup || fromLogin;
      if (fallback) {
        foundEmail = String(fallback).trim().toLowerCase();
      }
    }

    if (foundEmail) {
      setEmail(foundEmail); // prefill only, no redirect
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "User not found") {
          setError("We couldn’t find this email. Please check it or sign up.");
        } else {
          setError(data?.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Save email for the /otp page
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ssai.reset.email", trimmedEmail);
      }

      setInfo("We’ve sent you a 4-digit code. Please check your email.");

      // Small delay so the user sees the message
      setTimeout(() => {
        router.push("/otp");
      }, 600);
    } catch (err) {
      console.error("Forgot-password error:", err);
      setError("Couldn’t send the code right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = email.trim() && !submitting;

  // While translations are running → skeleton only
  if (loading) {
    // Apple-style loading skeleton
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
            <div className="mb-6 h-24 w-24 rounded-full bg-[#f5f5f7] animate-pulse" />

            <div className="w-full max-w-xs mt-6 space-y-3">
              <div className="h-5 rounded-full bg-[#e5e5ea] animate-pulse" />
              <div className="h-4 rounded-full bg-[#e5e5ea] w-3/4 animate-pulse" />
            </div>

            <div className="mt-10 w-full space-y-4">
              <div className="h-11 rounded-2xl bg-[#e5e5ea] animate-pulse" />
            </div>

            <div className="mt-8 h-11 w-full rounded-2xl bg-[#e5e5ea] animate-pulse" />
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
          {/* Logo + app name + subtitle */}
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

            {/* Brand name (not translated) */}
            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>

            {/* Subtitle (translated) */}
            <p className="mt-2 text-[15px] sm:text-[16px] leading-snug text-[#8e8e93]">
              {safeTexts.subtitle}
            </p>

            {/* Recover password subtitle */}
            <p className="mt-4 text-[14px] sm:text-[15px] text-[#8e8e93]">
              {safeTexts.recover}
            </p>
          </header>

          {/* Form */}
          <form
            className="mt-8 w-full space-y-6 apple-motion-text"
            onSubmit={handleSubmit}
          >
            <div className="text-left">
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-[#8e8e93] mb-1"
              >
                {safeTexts.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-2xl border border-[#e5e5ea]
                  bg-[#f9f9fb]
                  px-4 py-3 text-[15px] text-[#1c1c1e]
                  outline-none
                  focus:bg-white
                  focus:border-[#007aff]
                  focus:ring-2 focus:ring-[#bfddff]
                  transition
                "
                placeholder={safeTexts.emailPlaceholder}
              />
            </div>

            {/* Error / info */}
            {error && (
              <p className="text-[13px] text-[#ff3b30] text-center mt-1">
                {error}
              </p>
            )}
            {!error && info && (
              <p className="text-[13px] text-[#34c759] text-center mt-1">
                {info}
              </p>
            )}

            {/* Send OTP */}
            <div className="pt-2 apple-motion-buttons">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`
                  w-full rounded-2xl
                  bg-[#1c1c1e]
                  py-3.5 text-[16px] font-semibold
                  text-white tracking-tight
                  transition
                  hover:bg-[#2c2c2e]
                  active:bg-[#000000]
                  active:scale-[0.97]
                  shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                  ${
                    !canSubmit
                      ? "opacity-60 cursor-not-allowed active:scale-100"
                      : ""
                  }
                `}
              >
                {submitting ? "Sending code…" : safeTexts.sendOtp}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
