"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../../../hooks/useTranslation";
import { fixAppHeight } from "../../app-height-fix";
import { useRouter } from "next/navigation";

// ---------- Types ----------
type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "scale_1_5"
  | "text_short"
  | "text_long";

interface JourneyOption {
  id: string;
  label: string;
}

interface JourneyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string;
  options?: JourneyOption[];
  minWords?: number;
  maxWords?: number;
}

interface HistoryItem {
  questionId: string;
  question: string;
  answerSummary: string;
}

// ---------- UI translations ----------
const defaultTexts = {
  subtitle: "Let’s find your person.",
  skip: "Skip question",
  next: "Next question",
  loadingJourney: "Loading your journey…",
  noUser: "We couldn’t find your session. Please log in again.",
  errorGeneric: "We couldn’t load the next question. Please try again.",
  logout: "Log out",
  whyWeAsk: "Why we ask this question",

  // Match prompt modal
  matchPromptTitle: "We can already look for a match",
  matchPromptSubtitle:
    "Based on your answers so far, SoulSync AI can start looking for your best match. You can also continue your journey to improve the match.",
  matchPromptFindMatch: "Look for a match",
  matchPromptContinue: "Continue my journey",
};

export default function JourneyPage() {
  const router = useRouter();

  const { texts, loading } = useTranslation(defaultTexts, "journeyPage");
  const safeTexts = texts?.skip ? (texts as typeof defaultTexts) : defaultTexts;

  useEffect(() => {
    fixAppHeight();
  }, []);

  // 🔥 FIX HEIGHT ISSUES ON MOBILE
  useEffect(() => {
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Auth + user
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // ✅ we checked localStorage at least once

  // Browser language
  const [browserLang, setBrowserLang] = useState<string>("en");
  const [browserLanguages, setBrowserLanguages] = useState<string[]>(["en"]);

  // Question state
  const [currentQuestion, setCurrentQuestion] =
    useState<JourneyQuestion | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Answer state
  const [singleChoiceAnswer, setSingleChoiceAnswer] = useState<string | null>(
    null
  );
  const [multiChoiceAnswer, setMultiChoiceAnswer] = useState<string[]>([]);
  const [scaleAnswer, setScaleAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>("");

  // Account menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Match prompt modal state
  const [matchPromptOpen, setMatchPromptOpen] = useState(false);
  const [matchPromptShown, setMatchPromptShown] = useState(false); // so we don't annoy the user

  // Load user from localStorage (and mark authChecked)
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

      // Check if we already showed the match prompt before
      const matchPromptFlag = localStorage.getItem(
        "soulsync.matchPrompt.shown"
      );
      if (matchPromptFlag === "1") {
        setMatchPromptShown(true);
      }
    } catch {
      // ignore
    } finally {
      // we have checked localStorage at least once
      setAuthChecked(true);
    }
  }, []);

  // If no session after checking → redirect away (cannot proceed)
  useEffect(() => {
    if (!authChecked) return;
    if (!userEmail) {
      router.replace("/"); // send to landing / login
    }
  }, [authChecked, userEmail, router]);

  // Detect browser language
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lang = window.navigator.language || "en";
    const langs =
      window.navigator.languages && window.navigator.languages.length > 0
        ? Array.from(window.navigator.languages)
        : [lang];

    setBrowserLang(lang);
    setBrowserLanguages(langs);
  }, []);

  function resetAnswerState() {
    setSingleChoiceAnswer(null);
    setMultiChoiceAnswer([]);
    setScaleAnswer(null);
    setTextAnswer("");
  }

  function summarizeAnswer(q: JourneyQuestion): string {
    switch (q.type) {
      case "single_choice":
        return (
          q.options?.find((o) => o.id === singleChoiceAnswer)?.label ||
          singleChoiceAnswer ||
          ""
        );
      case "multi_choice":
        return (
          q.options
            ?.filter((o) => multiChoiceAnswer.includes(o.id))
            .map((o) => o.label)
            .join(", ") || ""
        );
      case "scale_1_5":
        return scaleAnswer ? String(scaleAnswer) : "";
      case "text_short":
      case "text_long":
        return textAnswer.trim();
      default:
        return "";
    }
  }

  function hasAnswer(q: JourneyQuestion | null): boolean {
    if (!q) return false;
    switch (q.type) {
      case "single_choice":
        return !!singleChoiceAnswer;
      case "multi_choice":
        return multiChoiceAnswer.length > 0;
      case "scale_1_5":
        return scaleAnswer != null;
      case "text_short":
      case "text_long":
        return textAnswer.trim().length > 0;
      default:
        return false;
    }
  }

  async function fetchNextQuestion(withAnswer: boolean) {
    if (!userEmail) {
      setError(safeTexts.noUser);
      return;
    }

    try {
      setCurrentQuestion(null);
      setLoadingQuestion(true);
      setError(null);

      let newHistory = history;
      let justAnswered = false;

      if (withAnswer && currentQuestion) {
        const summary = summarizeAnswer(currentQuestion);
        if (summary) {
          newHistory = [
            ...history,
            {
              questionId: currentQuestion.id,
              question: currentQuestion.text,
              answerSummary: summary,
            },
          ];
          setHistory(newHistory);
          justAnswered = true;
        }
      }

      const res = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          browserLang,
          browserLanguages,
          history: newHistory,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok || !data?.question) {
        setError(data?.error || safeTexts.errorGeneric);
        return;
      }

      setCurrentQuestion(data.question);
      resetAnswerState();

      // 🎯 After the user has answered at least 4 questions,
      // show the match modal ONCE (not every 4).
      if (
        justAnswered &&
        !matchPromptShown &&
        newHistory.length >= 4 // only counting answered (not skipped)
      ) {
        setMatchPromptOpen(true);
        setMatchPromptShown(true);
        try {
          localStorage.setItem("soulsync.matchPrompt.shown", "1");
        } catch {
          // ignore
        }
      }
    } catch {
      setError(safeTexts.errorGeneric);
    } finally {
      setLoadingQuestion(false);
    }
  }

  // Initial load – only when we first get the email
  useEffect(() => {
    if (!userEmail || currentQuestion) return;
    fetchNextQuestion(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Render Input
  function renderAnswerInput(q: JourneyQuestion) {
    switch (q.type) {
      case "single_choice":
        return (
          <div className="space-y-2">
            {q.options?.map((opt) => {
              const selected = singleChoiceAnswer === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSingleChoiceAnswer(opt.id)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 text-[15px]
                    flex items-center justify-between
                    ${
                      selected
                        ? "border-[#007aff] bg-[#f0f6ff] text-[#1c1c1e]"
                        : "border-[#e5e5ea] bg-[#f9f9fb] text-[#1c1c1e]"
                    }`}
                >
                  <span className="text-[#1c1c1e]">{opt.label}</span>
                </button>
              );
            })}
          </div>
        );

      case "multi_choice":
        return (
          <div className="space-y-2">
            {q.options?.map((opt) => {
              const checked = multiChoiceAnswer.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setMultiChoiceAnswer((prev) =>
                      prev.includes(opt.id)
                        ? prev.filter((i) => i !== opt.id)
                        : [...prev, opt.id]
                    )
                  }
                  className={`w-full rounded-2xl border px-4 py-3 text-[15px] text-[#1c1c1e]
                    flex items-center justify-between
                    ${
                      checked
                        ? "border-[#007aff] bg-[#f0f6ff]"
                        : "border-[#e5e5ea] bg-[#f9f9fb]"
                    }`}
                >
                  <span className="text-[#1c1c1e]">{opt.label}</span>

                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-xs
                      ${
                        checked
                          ? "bg-[#007aff] text-white"
                          : "bg-white text-[#8e8e93] border border-[#d1d1d6]"
                      }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        );

      case "scale_1_5":
        return (
          <div className="flex justify-between mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScaleAnswer(n)}
                className={`h-9 w-9 rounded-full border flex items-center justify-center
                  ${
                    scaleAnswer === n
                      ? "bg-[#007aff] text-white"
                      : "bg-[#f9f9fb] border-[#e5e5ea]"
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
        );

      case "text_short":
      case "text_long":
        return (
          <div className="relative">
            <textarea
              rows={q.type === "text_long" ? 5 : 3}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              className="w-full rounded-3xl border border-[#e5e5ea] bg-[#f9f9fb]
                px-4 py-3 text-[15px]
                focus:bg-white focus:border-[#007aff]
                focus:ring-2 focus:ring-[#bfddff]
                outline-none resize-none"
            />
            <div className="absolute bottom-2 right-4 text-[11px] text-[#8e8e93]">
              {textAnswer.trim().length} chars
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const Skeleton = () => (
    <div className="w-full animate-pulse">
      <div className="h-4 w-40 bg-[#e5e5ea] rounded-full mb-2" />
      <div className="h-4 w-56 bg-[#e5e5ea] rounded-full mb-2" />
      <div className="h-24 w-full bg-[#e5e5ea] rounded-3xl" />
    </div>
  );

  const handleLogout = () => {
    try {
      localStorage.removeItem("soulsync.user");
      localStorage.removeItem("ssai.signup.email");
      localStorage.removeItem("ssai.login.email");
    } catch {
      // ignore
    }
    setMenuOpen(false);
    window.location.href = "/"; // redirect
  };

  const displayName = userName || userEmail || "Guest";
  const initial =
    (displayName && displayName.trim().charAt(0).toUpperCase()) || "U";

  const handleGoToMatch = () => {
    setMatchPromptOpen(false);
    router.push("/soulsyncmatch");
  };

  // While we haven't checked auth yet, show nothing / tiny loader
  if (!authChecked) {
    return (
      <div className="p-10 text-center text-sm">
        {safeTexts.loadingJourney}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-sm">
        {safeTexts.loadingJourney}
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
          {/* TOP APP BAR: logo + title + burger */}
          <header className="mb-2">
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
                    SoulSync AI
                  </span>
                  <span className="text-[12px] sm:text-[13px] text-[#8e8e93] leading-tight truncate">
                    {safeTexts.subtitle}
                  </span>
                </div>
              </div>

              {/* Burger / account button – subtle Apple-style tap only */}
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

            {currentQuestion && (
              <div className="mt-1 flex w-full justify-center">
                <p className="text-[11px] text-[#8e8e93]">∞</p>
              </div>
            )}
          </header>

          {/* QUESTION AREA */}
          <section className="mt-1 flex-1 w-full overflow-y-auto pb-4 no-scrollbar">
            {loadingQuestion && <Skeleton />}

            <AnimatePresence mode="wait">
              {!loadingQuestion && currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <h2 className="text-[18px] sm:text-[19px] font-semibold text-[#1c1c1e] leading-snug">
                    {currentQuestion.text}
                  </h2>

                  <div className="pt-1 space-y-3">
                    {renderAnswerInput(currentQuestion)}
                  </div>

                  {/* Why we ask – small and below choices, translated like other UI texts */}
                  {currentQuestion.explanation && (
                    <p className="pt-1 text-[11px] leading-snug text-[#8e8e93]">
                      <span className="font-medium">
                        {safeTexts.whyWeAsk}:
                      </span>{" "}
                      {currentQuestion.explanation}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="mt-4 text-[12px] text-[#ff3b30] text-center">
                {error}
              </p>
            )}
          </section>

          {/* BUTTONS */}
          <div className="mt-1 pt-2 border-t border-[#f2f2f7] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fetchNextQuestion(false)}
              disabled={loadingQuestion}
              className={`
                w-full rounded-2xl border border-[#e5e5ea] bg-white py-3
                text-[14px] sm:text-[15px] font-medium text-[#1c1c1e]
                transition
                hover:bg-[#f5f5f7]
                active:bg-[#e5e5ea] active:scale-[0.97]
                shadow-sm
                ${
                  loadingQuestion
                    ? "opacity-60 cursor-not-allowed active:scale-100"
                    : ""
                }
              `}
            >
              {safeTexts.skip}
            </button>

            <button
              type="button"
              onClick={() => fetchNextQuestion(true)}
              disabled={
                !currentQuestion || !hasAnswer(currentQuestion) || loadingQuestion
              }
              className={`
                w-full rounded-2xl bg-[#1c1c1e] py-3
                text-[15px] sm:text-[16px] font-semibold text-white
                transition
                hover:bg-[#2c2c2e]
                active:bg:black active:scale-[0.97]
                shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                ${
                  !currentQuestion || loadingQuestion
                    ? "opacity-60 cursor-not-allowed active:scale-100"
                    : ""
                }
              `}
            >
              {loadingQuestion ? "…" : safeTexts.next}
            </button>
          </div>
        </div>
      </div>

      {/* ACCOUNT MODAL */}
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

      {/* MATCH PROMPT MODAL */}
      <AnimatePresence>
        {matchPromptOpen && (
          <motion.div
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-[86%] max-w-[360px] rounded-[28px] bg-[#f9f9fb] border border-[#e5e5ea] shadow-[0_22px_55px_rgba(0,0,0,0.25)] p-5"
            >
              <div className="flex flex-col gap-2">
                <h2 className="text-[17px] font-semibold text-[#1c1c1e] leading-snug">
                  {safeTexts.matchPromptTitle}
                </h2>
                <p className="text-[13px] text-[#6e6e73] leading-snug">
                  {safeTexts.matchPromptSubtitle}
                </p>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleGoToMatch}
                  className="
                    w-full rounded-2xl bg-[#1c1c1e] py-3
                    text-[15px] font-semibold text-white
                    shadow-[0_10px_24px_rgba(0,0,0,0.22)]
                    active:scale-[0.97] transition
                    hover:bg-[#2c2c2e]
                  "
                >
                  {safeTexts.matchPromptFindMatch}
                </button>
                <button
                  type="button"
                  onClick={() => setMatchPromptOpen(false)}
                  className="
                    w-full rounded-2xl border border-[#e5e5ea] bg-white py-3
                    text-[14px] font-medium text-[#1c1c1e]
                    active:scale-[0.97] transition
                    hover:bg-[#f5f5f7]
                  "
                >
                  {safeTexts.matchPromptContinue}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
