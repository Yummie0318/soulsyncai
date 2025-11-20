"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../../../hooks/useTranslation";

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
};

export default function JourneyPage() {
  const { texts, loading } = useTranslation(defaultTexts, "journeyPage");
  const safeTexts = texts?.skip ? texts : defaultTexts;

  // User from localStorage
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Browser language
  const [browserLang, setBrowserLang] = useState<string>("en");
  const [browserLanguages, setBrowserLanguages] = useState<string[]>(["en"]);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState<JourneyQuestion | null>(
    null
  );
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

  // Load user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("soulsync.user");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.email) setUserEmail(parsed.email);
    } catch {
      // ignore
    }
  }, []);

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

  // Reset answers
  function resetAnswerState() {
    setSingleChoiceAnswer(null);
    setMultiChoiceAnswer([]);
    setScaleAnswer(null);
    setTextAnswer("");
  }

  // Summaries for sending back
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

  // Check if we have an answer
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

  // Fetch next question
  async function fetchNextQuestion(withAnswer: boolean) {
    if (!userEmail) {
      setError(safeTexts.noUser);
      return;
    }

    try {
      setCurrentQuestion(null); // hide old question immediately
      setLoadingQuestion(true);
      setError(null);

      let newHistory = history;

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
    } catch {
      setError(safeTexts.errorGeneric);
    } finally {
      setLoadingQuestion(false);
    }
  }

  // Initial load
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
            {q.options?.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceAnswer(opt.id)}
                className={`w-full text-left rounded-2xl border px-4 py-3 text-[15px]
                  ${
                    singleChoiceAnswer === opt.id
                      ? "border-[#007aff] bg-[#f0f6ff]"
                      : "border-[#e5e5ea] bg-[#f9f9fb]"
                  }`}
              >
                {opt.label}
              </button>
            ))}
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
                  className={`w-full rounded-2xl border px-4 py-3 text-[15px]
                    flex items-center justify-between
                    ${
                      checked
                        ? "border-[#007aff] bg-[#f0f6ff]"
                        : "border-[#e5e5ea] bg-[#f9f9fb]"
                    }`}
                >
                  <span>{opt.label}</span>
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

  // Skeleton UI
  const Skeleton = () => (
    <div className="w-full animate-pulse">
      <div className="h-4 w-40 bg-[#e5e5ea] rounded-full mb-2" />
      <div className="h-4 w-56 bg-[#e5e5ea] rounded-full mb-2" />
      <div className="h-24 w-full bg-[#e5e5ea] rounded-3xl" />
    </div>
  );

  if (loading) {
    return <div className="p-10 text-center text-sm">{safeTexts.loadingJourney}</div>;
  }

  return (
    <main
      className="min-h-screen bg-[#f2f2f7] flex items-stretch justify-center px-4"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="w-full max-w-[430px] flex">
        <div
          className="
            flex flex-col flex-1
            rounded-[32px] sm:rounded-[40px]
            bg-white
            border border-[#f1f1f4]
            shadow-[0_18px_40px_rgba(0,0,0,0.04)]
            px-5 py-6 sm:px-6 sm:py-8
          "
        >
          {/* HEADER (compact, iPhone style) */}
          <header className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f7]">
              <Image
                src="/logo-removebg-preview.png"
                alt="SoulSync Logo"
                width={56}
                height={56}
                priority
              />
            </div>

            <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#3c3c43] leading-tight">
              SoulSync AI
            </h1>
            <p className="mt-1 text-[13px] sm:text-[14px] text-[#8e8e93] leading-tight">
              {safeTexts.subtitle}
            </p>

            {currentQuestion && (
              <p className="mt-1 text-[11px] text-[#8e8e93]">∞</p>
            )}
          </header>

          {/* QUESTION AREA (flex-1, small internal scroll on overflow) */}
          <section className="mt-4 flex-1 w-full overflow-y-auto pb-4">
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

                  {currentQuestion.explanation && (
                    <p className="text-[12px] sm:text-[13px] text-[#8e8e93]">
                      <span className="font-medium">
                        {(() => {
                          const l = browserLang.toLowerCase();
                          if (l.startsWith("fil"))
                            return "Bakit namin tinatanong ito";
                          if (l.startsWith("de"))
                            return "Warum wir diese Frage stellen";
                          if (l.startsWith("ru"))
                            return "Почему мы задаём этот вопрос";
                          if (l.startsWith("zh"))
                            return "我们为什么问这个问题";
                          if (l.startsWith("es"))
                            return "Por qué hacemos esta pregunta";
                          if (l.startsWith("fr"))
                            return "Pourquoi posons-nous cette question";
                          return "Why we ask this question";
                        })()}
                        :
                      </span>{" "}
                      {currentQuestion.explanation}
                    </p>
                  )}

                  <div className="pt-1 space-y-3">
                    {renderAnswerInput(currentQuestion)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="mt-4 text-[12px] text-[#ff3b30] text-center">
                {error}
              </p>
            )}
          </section>

          {/* BOTTOM BUTTONS (padded, big tap targets) */}
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
                ${loadingQuestion ? "opacity-60 cursor-not-allowed active:scale-100" : ""}
              `}
            >
              {safeTexts.skip}
            </button>

            <button
              type="button"
              onClick={() => fetchNextQuestion(true)}
              disabled={!currentQuestion || !hasAnswer(currentQuestion) || loadingQuestion}
              className={`
                w-full rounded-2xl bg-[#1c1c1e] py-3
                text-[15px] sm:text-[16px] font-semibold text-white
                transition
                hover:bg-[#2c2c2e]
                active:bg-black active:scale-[0.97]
                shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                ${!currentQuestion || loadingQuestion ? "opacity-60 cursor-not-allowed active:scale-100" : ""}
              `}
            >
              {loadingQuestion ? "…" : safeTexts.next}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
