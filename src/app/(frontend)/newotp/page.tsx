// src/app/(frontend)/newotp/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../hooks/useTranslation";

const defaultTexts = {
  subtitle: "Let’s find your person.",
  instruction: "Enter the 4-digit code we sent to your email to verify it.",
  resend: "Resend code",
  verify: "Verify email",
};

export default function NewOtpPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // email from signup flow
  const [email, setEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // ✅ did we check localStorage?

  const [submitting, setSubmitting] = useState(false); // for verify
  const [resending, setResending] = useState(false); // for resend
  const [resendCooldown, setResendCooldown] = useState(0); // seconds left

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const router = useRouter();

  const { texts, loading } = useTranslation(defaultTexts, "newOtpPage");

  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("instruction" in texts)
      ? defaultTexts
      : texts;

  // ✅ Load email from localStorage (saved during signup) and mark authChecked
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedEmail = window.localStorage.getItem("ssai.signup.email");
    if (storedEmail) {
      setEmail(storedEmail);
    }

    setAuthChecked(true); // we have checked at least once
  }, []);

  // ✅ If we checked and there's NO signup email → redirect (cannot access /newotp)
  useEffect(() => {
    if (!authChecked) return;
    if (!email) {
      router.replace("/"); // or "/signup" if you have that
    }
  }, [authChecked, email, router]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const id = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Allow only 0–9, and only a single digit
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);
    setInfo(null);

    // Auto-advance focus
    if (value && index < otp.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (index > 0 && !otp[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("").trim();

    if (code.length !== 4) {
      setError("Please enter the 4-digit code.");
      setInfo(null);
      return;
    }

    if (!email) {
      setError("We couldn’t find your email. Please sign up again.");
      setInfo(null);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setInfo(null);

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "OTP has expired") {
          setError("This code has expired. Please request a new one.");
        } else if (data?.error === "Invalid code") {
          setError("The code you entered is not correct.");
        } else if (data?.error === "No active OTP for this user") {
          setError("There is no active code for this email. Please sign up again.");
        } else if (data?.error === "User not found") {
          setError("We couldn’t find your email. Please sign up again.");
        } else {
          setError(data?.error || "Something went wrong. Please try again.");
        }
        return;
      }

      if (data?.alreadyVerified) {
        setInfo("Your email is already verified. Continuing…");
      } else {
        setInfo("Your email is verified. Let’s continue.");
      }

      setTimeout(() => {
        router.push("/looking");
      }, 600);
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("Couldn’t verify right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("We couldn’t find your email. Please sign up again.");
      setInfo(null);
      return;
    }

    if (resendCooldown > 0 || resending) {
      return;
    }

    try {
      setResending(true);
      setError(null);
      setInfo(null);

      const res = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "User not found") {
          setError("We couldn’t find your email. Please sign up again.");
        } else if (data?.error === "Email is already verified") {
          setError("This email is already verified. Try logging in.");
        } else {
          setError(data?.error || "Couldn’t resend code. Please try again.");
        }
        return;
      }

      setInfo("We’ve sent you a new 4-digit code. Please check your email.");
      setResendCooldown(60); // e.g. 60s cooldown
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Couldn’t resend right now. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const codeComplete = otp.join("").trim().length === 4;

  // While translations OR auth-check are running → skeleton
  if (loading || !authChecked) {
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
              <p className="mt-1 text-[12px] text-[#8e8e93]">
                {email}
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

          {/* Error / info messages */}
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

          {/* Resend Code */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className={`
              mt-5 text-[14px] font-medium
              hover:opacity-80 transition apple-motion-text
              ${
                resending || resendCooldown > 0
                  ? "text-[#8e8e93] cursor-not-allowed"
                  : "text-[#007aff]"
              }
            `}
          >
            {resendCooldown > 0
              ? `${safeTexts.resend} (${resendCooldown}s)`
              : safeTexts.resend}
          </button>

          {/* Verify button */}
          <div className="mt-8 w-full apple-motion-buttons">
            <button
              type="button"
              onClick={handleVerify}
              disabled={submitting || !codeComplete}
              className={`
                w-full rounded-2xl
                bg-[#1c1c1e]
                py-3.5 text-[16px] font-semibold text-white
                tracking-tight transition
                hover:bg-[#2c2c2e]
                active:bg-black active:scale-[0.97]
                shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                ${
                  submitting || !codeComplete
                    ? "opacity-60 cursor-not-allowed active:scale-100"
                    : ""
                }
              `}
            >
              {submitting ? "Verifying…" : safeTexts.verify}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
