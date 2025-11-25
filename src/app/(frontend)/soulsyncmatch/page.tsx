"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fixAppHeight } from "../../app-height-fix";
import { useTranslation } from "../../../hooks/useTranslation";

interface Match {
  userId: string;
  displayName: string;
  similarity: number;
  certaintyPercent: number;
}

interface MatchResponse {
  ok: boolean;
  userId?: string;
  matches?: Match[];
  error?: string;
}

// 🔹 UI translations for the match page
const defaultTexts = {
  title: "SoulSync AI",
  subtitle: "Your best match right now",

  loadingMatch: "Loading your match…",

  lookingTitle: "Looking for your best match…",
  lookingSubtitle:
    "SoulSync AI is comparing your journey with others right now.",

  notEnoughSignalTitle: "Not enough signal yet",
  notEnoughSignalBody:
    "We couldn’t find a match yet. Please continue your journey.",

  genericMatchError:
    "Something went wrong while looking for your match. Please try again.",

  continueJourney: "Continue my journey",
  tryAgain: "Try again",

  matchConfidenceLabel: "Match confidence",

  // NEW: fully localizable text around the match card + paragraph
  matchCardLine1: "This is the best match we can find for you right now.",
  matchCardCertPrefix: "SoulSync AI is",
  matchCardCertSuffix: "sure this is the person you're looking for.",
  matchLongDescription:
    "This is the best match we can find based on your journey so far. You can contact this match now, or continue your journey to refine future matches even more.",

  contactMatch: "Contact match",
  contactMatchAlert:
    "Contact match will be implemented later. For now, continue your journey to improve and unlock more matches.",

  logout: "Log out",
};

export default function SoulSyncMatchPage() {
  const router = useRouter();

  // 🔹 translations (auto language via useTranslation hook)
  const { texts, loading: i18nLoading } = useTranslation(
    defaultTexts,
    "matchPage"
  );
  const safeTexts = texts?.loadingMatch
    ? ({ ...defaultTexts, ...(texts as any) } as typeof defaultTexts)
    : defaultTexts;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [loadingMatch, setLoadingMatch] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [bestMatch, setBestMatch] = useState<Match | null>(null);

  // account menu state (burger)
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fixAppHeight();
  }, []);

  // Load user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("soulsync.user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) setUserEmail(parsed.email);
        if (parsed?.displayName || parsed?.name) {
          setUserName(parsed.displayName || parsed.name);
        }
      }
    } catch {
      // ignore
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // If no session after checking → redirect away
  useEffect(() => {
    if (!authChecked) return;
    if (!userEmail) {
      router.replace("/");
    }
  }, [authChecked, userEmail, router]);

  // Fetch match once we have email
  useEffect(() => {
    if (!userEmail) return;

    const fetchMatch = async () => {
      try {
        setLoadingMatch(true);
        setMatchError(null);

        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });

        const data: MatchResponse = await res.json();

        if (!res.ok || !data.ok) {
          setMatchError(data.error || safeTexts.notEnoughSignalBody);
          setBestMatch(null);
          return;
        }

        const first = data.matches && data.matches[0];
        if (!first) {
          setMatchError(safeTexts.notEnoughSignalBody);
          setBestMatch(null);
          return;
        }

        setBestMatch(first);
      } catch (err) {
        console.error("Match error:", err);
        setMatchError(safeTexts.genericMatchError);
        setBestMatch(null);
      } finally {
        setLoadingMatch(false);
      }
    };

    fetchMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const displayName = userName || userEmail || "Guest";
  const initial =
    (displayName && displayName.trim().charAt(0).toUpperCase()) || "U";

  const handleBackToJourney = () => {
    router.push("/journey");
  };

  const handleTryAgain = () => {
    if (!userEmail) return;
    setLoadingMatch(true);
    setMatchError(null);
    setBestMatch(null);

    setTimeout(() => {
      window.location.reload();
    }, 10);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("soulsync.user");
      localStorage.removeItem("ssai.signup.email");
      localStorage.removeItem("ssai.login.email");
    } catch {
      // ignore
    }
    setMenuOpen(false);
    window.location.href = "/";
  };

  // While we haven't checked auth or translations yet
  if (!authChecked || i18nLoading) {
    return (
      <div className="p-10 text-center text-sm text-[#3c3c43]">
        {safeTexts.loadingMatch}
      </div>
    );
  }

  return (
    <main
      className="flex items-center justify-center px-4 bg-[#f2f2f7]"
      style={{
        height: "var(--app-height)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="w-full max-w-[430px] h-full flex">
        <div
          className="
            flex flex-col flex-1 h-full
            rounded-[32px] sm:rounded-[40px]
            bg-white
            border border-[#f1f1f4]
            shadow-[0_18px_40px_rgba(0,0,0,0.04)]
            px-5 py-5 sm:px-6 sm:py-7
            overflow-hidden
          "
        >
          {/* TOP APP BAR */}
          <header className="mb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f7] shrink-0">
                  <Image
                    src="/logo-removebg-preview.png"
                    alt="SoulSync Logo"
                    width={40}
                    height={40}
                    priority
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[17px] sm:text-[18px] font-semibold text-[#3c3c43] leading-tight truncate">
                    {safeTexts.title}
                  </span>
                  <span className="text-[12px] sm:text-[13px] text-[#8e8e93] leading-tight truncate">
                    {safeTexts.subtitle}
                  </span>
                </div>
              </div>

              {/* Burger / account button – same style as journey page */}
              <button
                type="button"
                aria-label="Account menu"
                onClick={() => setMenuOpen(true)}
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-full bg-[#f2f2f7]
                  border border-[#e5e5ea]
                  shadow-[0_4px_10px_rgba(0,0,0,0.06)]
                  active:scale-[0.94]
                  transition
                "
              >
                <span className="flex flex-col gap-[3px]">
                  <span className="h-[1.6px] w-4 rounded-full bg-[#3c3c43]" />
                  <span className="h-[1.6px] w-4 rounded-full bg-[#3c3c43]" />
                  <span className="h-[1.6px] w-4 rounded-full bg-[#3c3c43]" />
                </span>
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <section className="flex-1 w-full flex flex-col items-center justify-center text-center px-2">
            <AnimatePresence mode="wait">
              {loadingMatch && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full bg-[#f2f2f7]" />
                    <motion.div
                      className="absolute inset-2 rounded-full bg-[#1c1c1e]"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-[22px]">
                      ♥
                    </div>
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#1c1c1e]">
                      {safeTexts.lookingTitle}
                    </p>
                    <p className="mt-1 text-[13px] text-[#6e6e73]">
                      {safeTexts.lookingSubtitle}
                    </p>
                  </div>
                </motion.div>
              )}

              {!loadingMatch && matchError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="h-16 w-16 rounded-full bg-[#fff2f2] flex items-center justify-center text-[#ff3b30] text-[26px]">
                    !
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1c1c1e]">
                      {safeTexts.notEnoughSignalTitle}
                    </p>
                    <p className="mt-1 text-[13px] text-[#6e6e73]">
                      {matchError}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 w-full max-w-[260px]">
                    <button
                      type="button"
                      onClick={handleBackToJourney}
                      className="w-full rounded-2xl bg-[#1c1c1e] py-3 text-[14px] font-semibold text-white hover:bg-[#2c2c2e] active:scale-[0.97] transition shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                    >
                      {safeTexts.continueJourney}
                    </button>
                    <button
                      type="button"
                      onClick={handleTryAgain}
                      className="w-full rounded-2xl border border-[#e5e5ea] bg-white py-3 text-[13px] font-medium text-[#1c1c1e] hover:bg-[#f5f5f7] active:scale-[0.97] transition"
                    >
                      {safeTexts.tryAgain}
                    </button>
                  </div>
                </motion.div>
              )}

              {!loadingMatch && !matchError && bestMatch && (
                <motion.div
                  key="match"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col items-center gap-5 w-full"
                >
                  {/* Match avatar card */}
                  <div className="w-full max-w-[320px] rounded-[26px] bg-[#f9f9fb] border border-[#e5e5ea] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-[#1c1c1e] flex items-center justify-center text-[24px] font-semibold text-white">
                        {bestMatch.displayName.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[16px] font-semibold text-[#1c1c1e]">
                          {bestMatch.displayName}
                        </span>
                        <span className="mt-[2px] text-left text-[12px] text-[#6e6e73]">
                          {safeTexts.matchCardLine1}{" "}
                          <span className="font-semibold text-[#1c1c1e]">
                            {safeTexts.matchCardCertPrefix}{" "}
                            {bestMatch.certaintyPercent}%
                          </span>{" "}
                          {safeTexts.matchCardCertSuffix}
                        </span>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[#8e8e93] mb-1">
                        <span>{safeTexts.matchConfidenceLabel}</span>
                        <span>{bestMatch.certaintyPercent}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#e5e5ea] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1c1c1e] transition-all"
                          style={{
                            width: `${Math.max(
                              10,
                              Math.min(bestMatch.certaintyPercent, 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[13px] text-[#6e6e73] max-w-[300px]">
                    {safeTexts.matchLongDescription}
                  </p>

                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    <button
                      type="button"
                      className="w-full rounded-2xl bg-[#1c1c1e] py-3 text-[14px] font-semibold text-white hover:bg-[#2c2c2e] active:scale-[0.97] transition shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                      // TODO: wire to real chat / contact flow later
                      onClick={() => {
                        alert(safeTexts.contactMatchAlert);
                      }}
                    >
                      {safeTexts.contactMatch}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToJourney}
                      className="w-full rounded-2xl border border-[#e5e5ea] bg-white py-3 text-[13px] font-medium text-[#1c1c1e] hover:bg-[#f5f5f7] active:scale-[0.97] transition"
                    >
                      {safeTexts.continueJourney}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>

      {/* ACCOUNT MODAL (same style as journey page) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-[86%] max-w-[360px] rounded-[28px] bg-[#f9f9fb] border border-[#e5e5ea] shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#e5e5ea] flex items-center justify-center text-[18px] font-semibold text-[#3c3c43]">
                    {initial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-[#1c1c1e]">
                      {displayName}
                    </span>
                    {userEmail && (
                      <span className="text-[12px] text-[#8e8e93]">
                        {userEmail}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="h-7 w-7 flex items-center justify-center rounded-full bg-[#f2f2f7] text-[#3c3c43] text-sm border border-[#e5e5ea] active:scale-[0.94] transition"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    w-full rounded-2xl bg-[#ff3b30]/8 border border-[#ff3b30]/40
                    py-3 text-[14px] font-semibold text-[#ff3b30]
                    active:scale-[0.97] transition
                    hover:bg-[#ff3b30]/10
                  "
                >
                  {safeTexts.logout}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
