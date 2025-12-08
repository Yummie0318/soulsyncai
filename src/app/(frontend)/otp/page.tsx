// src/app/(frontend)/otp/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../hooks/useTranslation";
import { fixAppHeight } from "../../app-height-fix";

const defaultTexts = {
  subtitle: "Let’s find your person.",
  instruction: "Enter the 4-digit code sent to your email.",
  resend: "Resend Code",
  continue: "Continue",
};

export default function OtpPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // email used for reset flow (from /forgot)
  const [email, setEmail] = useState<string | null>(null);
  const [contextChecked, setContextChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const router = useRouter();

  const { texts, loading } = useTranslation(defaultTexts, "otpPage");

  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("instruction" in texts)
      ? defaultTexts
      : texts;

  useEffect(() => {
    fixAppHeight();
  }, []);

  // ✅ Reset-context guard: only allow /otp if we have ssai.reset.email
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("ssai.reset.email");

    if (stored) {
      setEmail(stored.trim().toLowerCase());
      setContextChecked(true);
    } else {
      // No reset email → user didn't come from /forgot → send them back
      router.replace("/forgot");
    }
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance
    if (value && index < otp.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (index > 0 && !otp[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);

    const code = otp.join("").trim();

    if (!email) {
      setError("We couldn’t find your email context. Please start again.");
      return;
    }

    if (code.length !== 4) {
      setError("Please enter the 4-digit code.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "User not found") {
          setError("We couldn’t find your email. Please sign up again.");
        } else if (data?.error === "OTP has expired") {
          setError("Your code has expired. Please request a new one.");
        } else if (data?.error === "Invalid code") {
          setError("That code doesn’t look right. Please try again.");
        } else if (data?.error === "No active OTP for this user") {
          setError("There is no active code for this email. Please resend.");
        } else {
          setError(data?.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Mark as verified (for the reset page to check later if you want)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ssai.reset.verified", "true");
      }

      setInfo("Code verified. You can now reset your password.");

      setTimeout(() => {
        router.push("/reset");
      }, 600);
    } catch (err) {
      console.error("Verify-otp error:", err);
      setError("Couldn’t verify the code right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);

    if (!email) {
      setError("We couldn’t find your email. Please start again.");
      return;
    }

    try {
      setResending(true);

      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "User not found") {
          setError("We couldn’t find this email. Please sign up again.");
        } else {
          setError(data?.error || "Couldn’t resend the code. Try again.");
        }
        return;
      }

      setInfo("We’ve sent you a new 4-digit code. Please check your email.");
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Couldn’t resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const canSubmit = otp.join("").trim().length === 4 && !submitting;

  // While translations OR reset-context are still being checked → skeleton
  if (loading || !contextChecked) {
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
            <div className="mt-8 flex justify-center gap-4 w-full">
              <div className="w-12 h-14 rounded-2xl bg-[#e5e5ea] animate-pulse" />
              <div className="w-12 h-14 rounded-2xl bg-[#e5e5ea] animate-pulse" />
              <div className="w-12 h-14 rounded-2xl bg-[#e5e5ea] animate-pulse" />
              <div className="w-12 h-14 rounded-2xl bg-[#e5e5ea] animate-pulse" />
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

            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>
            <p className="mt-2 text-[15px] sm:text-[16px] text-[#8e8e93]">
              {safeTexts.subtitle}
            </p>

            <p className="mt-4 text-[14px] sm:text-[15px] text-[#8e8e93]">
              {safeTexts.instruction}
            </p>

            {email && (
              <p className="mt-2 text-[12px] text-[#8e8e93]">
                Sending to: <span className="font-medium">{email}</span>
              </p>
            )}
          </header>

          {/* OTP Inputs */}
          <div className="mt-10 flex justify-center gap-4 apple-motion-text">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputs.current[index] = el;
                }}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") handleBackspace(index);
                }}
                type="text"
                inputMode="numeric"
                className="
                  w-14 h-16 sm:w-16 sm:h-18
                  rounded-2xl border border-[#e5e5ea]
                  bg-[#f9f9fb]
                  text-center text-[22px] sm:text-[24px] font-semibold text-[#1c1c1e]
                  outline-none
                  focus:bg-white
                  focus:border-[#007aff]
                  focus:ring-2 focus:ring-[#bfddff]
                  transition
                "
              />
            ))}
          </div>

          {/* Error / Info */}
          {error && (
            <p className="mt-4 text-[13px] text-[#ff3b30] text-center">
              {error}
            </p>
          )}
          {!error && info && (
            <p className="mt-4 text-[13px] text-[#34c759] text-center">
              {info}
            </p>
          )}

          {/* Resend Code */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="
              mt-5 text-[14px] font-medium text-[#007aff]
              hover:opacity-80 transition apple-motion-text
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {resending ? "Resending…" : safeTexts.resend}
          </button>

          {/* Continue */}
          <div className="mt-8 w-full apple-motion-buttons">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`
                w-full rounded-2xl
                bg-[#1c1c1e]
                py-3.5 text-[16px] font-semibold text-white
                tracking-tight transition
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
              {submitting ? "Verifying…" : safeTexts.continue}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
