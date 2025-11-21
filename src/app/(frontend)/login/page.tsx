// src/app/(frontend)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../hooks/useTranslation";
import { fixAppHeight } from "../../app-height-fix";

const defaultTexts = {
  subtitle: "Let’s find your person.",
  labelEmail: "Email",
  labelPassword: "Password",
  placeholderEmail: "you@example.com",
  placeholderPassword: "••••••••",
  forgotPassword: "Forgot password?",
  continueButton: "Continue",
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const { texts, loading } = useTranslation(defaultTexts, "loginPage");

  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("continueButton" in texts)
      ? defaultTexts
      : texts;

      useEffect(() => {
        fixAppHeight();
      }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        return;
      }

      const user = data.user || {};

      // Save minimal user to localStorage for now (no real session yet)
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("soulsync.user", JSON.stringify(user));
        } catch {
          // ignore storage errors
        }
      }

      // 🔍 Check if this user already has looking_for_text
      // support both snake_case and camelCase just in case
      const lookingForText: string =
        (user.looking_for_text as string | undefined) ??
        (user.lookingForText as string | undefined) ??
        "";

      const hasLookingFor =
        typeof lookingForText === "string" &&
        lookingForText.trim().length > 0;

      // 🔀 Redirect based on whether they already have a journey description
      if (hasLookingFor) {
        router.push("/journey");
      } else {
        router.push("/looking");
      }
    } catch (err) {
      console.error("[login] Network error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    // Apple-style skeleton while translations load
    return (
      <main
      className="bg-[#f2f2f7] flex items-center justify-center px-4"
      style={{
        height: "var(--app-height)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        overflow: "hidden",
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
            <div className="mb-6 flex h-24 w-24 rounded-full bg-[#f5f5f7] animate-pulse" />
            <div className="w-full max-w-xs space-y-3 mt-4">
              <div className="h-6 rounded-full bg-[#e5e5ea] animate-pulse" />
              <div className="h-4 rounded-full bg-[#e5e5ea] w-3/4 animate-pulse" />
            </div>
            <div className="mt-8 w-full space-y-4">
              <div className="h-11 rounded-2xl bg-[#e5e5ea] animate-pulse" />
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
    className="bg-[#f2f2f7] flex items-center justify-center px-4"
    style={{
      height: "var(--app-height)",
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
      overflow: "hidden",
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

            {/* Brand name (NOT translated) */}
            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>

            {/* Subtitle (translated) */}
            <p className="mt-2 text-[15px] sm:text-[16px] leading-snug text-[#8e8e93]">
              {safeTexts.subtitle}
            </p>
          </header>

          {/* Form */}
          <form
            className="mt-8 w-full space-y-5 apple-motion-text"
            onSubmit={handleSubmit}
          >
            {/* Email */}
            <div className="text-left">
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-[#8e8e93] mb-1"
              >
                {safeTexts.labelEmail}
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
                placeholder={safeTexts.placeholderEmail}
              />
            </div>

            {/* Password + forgot + eye */}
            <div className="text-left space-y-1">
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-[#8e8e93]"
              >
                {safeTexts.labelPassword}
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full rounded-2xl border border-[#e5e5ea]
                    bg-[#f9f9fb]
                    px-4 pr-12 py-3 text-[15px] text-[#1c1c1e]
                    outline-none
                    focus:bg-white
                    focus:border-[#007aff]
                    focus:ring-2 focus:ring-[#bfddff]
                    transition
                  "
                  placeholder={safeTexts.placeholderPassword}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="
                    absolute inset-y-0 right-4 flex items-center
                    text-[#8e8e93] hover:text-[#007aff] transition
                  "
                >
                  {showPassword ? (
                    <EyeOff size={22} strokeWidth={1.7} />
                  ) : (
                    <Eye size={22} strokeWidth={1.7} />
                  )}
                </button>
              </div>

              <div className="mt-1 flex justify-end">
                <Link
                  href="/forgot"
                  className="text-[13px] font-medium text-[#007aff] hover:opacity-80 transition"
                >
                  {safeTexts.forgotPassword}
                </Link>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[13px] text-red-500 mt-2 text-center">
                {error}
              </p>
            )}

            {/* Continue button */}
            <div className="pt-2 apple-motion-buttons">
              <button
                type="submit"
                disabled={submitting}
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
                  ${submitting ? "opacity-70 cursor-not-allowed" : ""}
                `}
              >
                {submitting ? "…" : safeTexts.continueButton}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
