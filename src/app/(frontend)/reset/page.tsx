// src/app/(frontend)/reset/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../hooks/useTranslation";

const defaultTexts = {
  subtitle: "Let’s find your person.",
  resetInstruction: "Reset your password to continue.",
  labelPassword: "New password",
  resetButton: "Reset password",
};

export default function ResetPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const [email, setEmail] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [needsRestart, setNeedsRestart] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const router = useRouter();

  const { texts, loading } = useTranslation(defaultTexts, "resetPage");

  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("resetButton" in texts)
      ? defaultTexts
      : texts;

  // Check localStorage for email + verified flag
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedEmail = window.localStorage.getItem("ssai.reset.email");
    const verifiedFlag = window.localStorage.getItem("ssai.reset.verified");

    if (!storedEmail || verifiedFlag !== "true") {
      setNeedsRestart(true);
      return;
    }

    setEmail(storedEmail);
    setVerified(true);
  }, []);

  const passwordTooShort = password.trim().length < 8;
  const canSubmit = !passwordTooShort && !submitting && verified;

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);

    if (!email || !verified) {
      setNeedsRestart(true);
      setError("We couldn’t confirm your reset session. Please start again.");
      return;
    }

    if (passwordTooShort) {
      setError("Please choose a password with at least 8 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "User not found") {
          setError("We couldn’t find your account. Please sign up again.");
        } else {
          setError(data?.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Clear reset state
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("ssai.reset.email");
        window.localStorage.removeItem("ssai.reset.verified");
      }

      setInfo("Your password has been updated.");

      // Small delay for the user to see success message
      setTimeout(() => {
        router.push("/resetsuccess");
      }, 600);
    } catch (err) {
      console.error("[reset-page] submit error:", err);
      setError("We couldn’t update your password right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Skeleton while translations load
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
            <div className="mb-6 flex h-24 w-24 rounded-full bg-[#f5f5f7] animate-pulse" />
            <div className="w-full max-w-xs space-y-3 mt-6">
              <div className="h-6 rounded-full bg-[#e5e5ea] animate-pulse" />
              <div className="h-4 rounded-full bg-[#e5e5ea] w-3/4 animate-pulse" />
              <div className="h-4 rounded-full bg-[#e5e5ea] w-2/3 animate-pulse" />
            </div>
            <div className="mt-10 h-12 rounded-2xl bg-[#e5e5ea] w-full animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  // If we lost context (no email / not verified), show a soft error screen
  if (needsRestart) {
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

              <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#3c3c43]">
                SoulSync AI
              </h1>

              <p className="mt-3 text-[14px] sm:text-[15px] text-[#8e8e93] max-w-xs">
                We couldn’t confirm your reset session. Please start the
                password recovery flow again.
              </p>
            </header>

            <div className="mt-8 w-full apple-motion-buttons">
              <button
                type="button"
                onClick={() => router.push("/forgot")}
                className="
                  w-full rounded-2xl
                  bg-[#1c1c1e]
                  py-3.5 text-[16px] font-semibold
                  text-white tracking-tight
                  transition
                  hover:bg-[#2c2c2e]
                  active:bg-black active:scale-[0.97]
                  shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                "
              >
                Back to “Forgot password”
              </button>
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

            {/* Title (NOT translated) */}
            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>

            {/* Translated text */}
            <p className="mt-2 text-[15px] sm:text-[16px] text-[#8e8e93]">
              {safeTexts.subtitle}
            </p>

            <p className="mt-4 text-[14px] sm:text-[15px] text-[#8e8e93]">
              {safeTexts.resetInstruction}
            </p>

            {email && (
              <p className="mt-2 text-[12px] text-[#8e8e93]">
                For account: <span className="font-medium">{email}</span>
              </p>
            )}
          </header>

          {/* Form */}
          <form
            className="mt-8 w-full space-y-6 apple-motion-text"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) handleSubmit();
            }}
          >
            <div className="text-left">
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-[#8e8e93] mb-1"
              >
                {safeTexts.labelPassword}
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
                  placeholder="••••••••"
                />

                {/* Eye icon */}
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="
                    absolute inset-y-0 right-4 flex items-center justify-center
                    text-[#8e8e93]
                    hover:text-[#007aff]
                    transition
                  "
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={1.8} />
                  ) : (
                    <Eye size={20} strokeWidth={1.8} />
                  )}
                </button>
              </div>

              {password.length > 0 && passwordTooShort && (
                <p className="mt-1 text-[12px] text-[#ff3b30]">
                  Password should be at least 8 characters.
                </p>
              )}
            </div>

            {/* Error / Info */}
            {error && (
              <p className="text-[13px] text-[#ff3b30] text-center">{error}</p>
            )}
            {!error && info && (
              <p className="text-[13px] text-[#34c759] text-center">{info}</p>
            )}

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
                  active:bg-black active:scale-[0.97]
                  shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                  ${
                    !canSubmit
                      ? "opacity-60 cursor-not-allowed active:scale-100"
                      : ""
                  }
                `}
              >
                {submitting ? "Updating…" : safeTexts.resetButton}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
