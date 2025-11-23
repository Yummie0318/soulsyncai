"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fixAppHeight } from "../../app-height-fix";

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

export default function SoulSyncMatchPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [loadingMatch, setLoadingMatch] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [bestMatch, setBestMatch] = useState<Match | null>(null);

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
          setMatchError(
            data.error ||
              "We couldn’t find a match yet. Please continue your journey."
          );
          setBestMatch(null);
          return;
        }

        const first = data.matches && data.matches[0];
        if (!first) {
          setMatchError(
            "We couldn’t find a match yet. Please continue your journey."
          );
          setBestMatch(null);
          return;
        }

        setBestMatch(first);
      } catch (err) {
        console.error("Match error:", err);
        setMatchError(
          "Something went wrong while looking for your match. Please try again."
        );
        setBestMatch(null);
      } finally {
        setLoadingMatch(false);
      }
    };

    fetchMatch();
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

  if (!authChecked) {
    return (
      <div className="p-10 text-center text-sm text-[#3c3c43]">
        Loading your match…
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
                    SoulSync AI
                  </span>
                  <span className="text-[12px] sm:text-[13px] text-[#8e8e93] leading-tight truncate">
                    Your best match right now
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBackToJourney}
                className="text-[12px] sm:text-[13px] px-3 py-1 rounded-full bg-[#f2f2f7] border border-[#e5e5ea] text-[#3c3c43] active:scale-[0.96] transition"
              >
                Back
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
                      Looking for your best match…
                    </p>
                    <p className="mt-1 text-[13px] text-[#6e6e73]">
                      SoulSync AI is comparing your journey with others right
                      now.
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
                      Not enough signal yet
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
                      Continue my journey
                    </button>
                    <button
                      type="button"
                      onClick={handleTryAgain}
                      className="w-full rounded-2xl border border-[#e5e5ea] bg-white py-3 text-[13px] font-medium text-[#1c1c1e] hover:bg-[#f5f5f7] active:scale-[0.97] transition"
                    >
                      Try again
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
                        {bestMatch.displayName
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[16px] font-semibold text-[#1c1c1e]">
                          {bestMatch.displayName}
                        </span>
                        <span className="mt-[2px] text-left text-[12px] text-[#6e6e73]">
                          This is the best match we can find for you right now.{" "}
                          <span className="font-semibold text-[#1c1c1e]">
                            SoulSync AI is {bestMatch.certaintyPercent}% sure
                          </span>{" "}
                          this is the person you&apos;re looking for.
                        </span>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[#8e8e93] mb-1">
                        <span>Match confidence</span>
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
                    This is the best match we can find based on your journey so
                    far. You can contact this match now, or continue your
                    journey to refine future matches even more.
                  </p>

                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    <button
                      type="button"
                      className="w-full rounded-2xl bg-[#1c1c1e] py-3 text-[14px] font-semibold text-white hover:bg-[#2c2c2e] active:scale-[0.97] transition shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                      // TODO: wire to real chat / contact flow later
                      onClick={() => {
                        alert(
                          "Contact match will be implemented later. For now, continue your journey to improve and unlock more matches."
                        );
                      }}
                    >
                      Contact match
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToJourney}
                      className="w-full rounded-2xl border border-[#e5e5ea] bg-white py-3 text-[13px] font-medium text-[#1c1c1e] hover:bg-[#f5f5f7] active:scale-[0.97] transition"
                    >
                      Continue my journey
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}
