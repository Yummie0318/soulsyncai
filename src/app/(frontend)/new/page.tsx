// src/app/(frontend)/new/page.tsx
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
  createAccount: "Create your SoulSync account.",
  labelDisplayName: "Display name",
  placeholderDisplayName: "Your name",
  labelEmail: "Email address",
  placeholderEmail: "you@example.com",
  labelPassword: "Password",
  placeholderPassword: "••••••••",
  signupButton: "Sign up",
  alreadyAccount: "Already have an account?",
  login: "Log in",
};

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [locale, setLocale] = useState("en");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const router = useRouter();

  const { texts, loading } = useTranslation(defaultTexts, "signupPage");

  const safeTexts =
    !texts || Object.keys(texts).length === 0 || !("signupButton" in texts)
      ? defaultTexts
      : texts;

      useEffect(() => {
        fixAppHeight();
      }, []);


  // detect browser locale once (optional)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const navLang = window.navigator.language || "en";
    setLocale(navLang);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    // 🔐 require at least 8 characters
    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
          displayName: trimmedName,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "Email is already registered and verified.") {
          setError("This email is already registered. Try logging in instead.");
        } else {
          setError(data?.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Save email for OTP page
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ssai.signup.email", trimmedEmail);
      }

      setInfo("We’ve sent you a 4-digit code. Please check your email.");
      setTimeout(() => {
        router.push("/newotp");
      }, 600);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Couldn’t sign you up right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    // Apple-style skeleton while translations load
    return (
     <main
  className="flex items-center justify-center px-4 bg-[#f2f2f7]"
  style={{
    height: "var(--app-height)",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)"
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
              <div className="h-4 rounded-full bg-[#e5e5ea] w-2/3 animate-pulse" />
            </div>
            <div className="mt-8 w-full space-y-4">
              <div className="h-11 rounded-2xl bg-[#e5e5ea] animate-pulse" />
              <div className="h-11 rounded-2xl bg-[#e5e5ea] animate-pulse" />
              <div className="h-11 rounded-2xl bg-[#e5e5ea] animate-pulse" />
            </div>
            <div className="mt-8 h-11 w-full rounded-2xl bg-[#e5e5ea] animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  const canSubmit =
    displayName.trim() &&
    email.trim() &&
    password.trim().length >= 8 && // 🔐 also enforce here
    !submitting;

  return (
    <main
    className="flex items-center justify-center px-4 bg-[#f2f2f7]"
    style={{
      height: "var(--app-height)",
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)"
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

            {/* Brand title (not translated) */}
            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-[#3c3c43]">
              SoulSync AI
            </h1>

            {/* Translated subtitle + description */}
            <p className="mt-2 text-[15px] sm:text-[16px] text-[#8e8e93]">
              {safeTexts.subtitle}
            </p>

            <p className="mt-4 text-[14px] sm:text-[15px] text-[#8e8e93]">
              {safeTexts.createAccount}
            </p>
          </header>

          {/* Form */}
          <form
            className="mt-8 w-full space-y-6 apple-motion-text"
            onSubmit={handleSubmit}
          >
            {/* Display Name */}
            <div className="text-left">
              <label
                htmlFor="name"
                className="block text-[13px] font-medium text-[#8e8e93] mb-1"
              >
                {safeTexts.labelDisplayName}
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
                placeholder={safeTexts.placeholderDisplayName}
              />
            </div>

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

            {/* Password + Eye */}
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
                  placeholder={safeTexts.placeholderPassword}
                  minLength={8}
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

              {/* Small helper text under password */}
              <p className="mt-1 text-[12px] text-[#8e8e93]">
                Password must be at least 8 characters.
              </p>
            </div>

            {/* Error / info (Apple-style) */}
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

            {/* Signup Button */}
            <div className="pt-2 apple-motion-buttons">
              <button
                type="submit"
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
                {submitting ? "Sending code…" : safeTexts.signupButton}
              </button>
            </div>
          </form>

          {/* Already have an account? */}
          <p className="mt-6 text-[14px] text-[#8e8e93] apple-motion-text">
            {safeTexts.alreadyAccount}{" "}
            <Link href="/login" className="text-[#007aff] font-medium">
              {safeTexts.login}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
