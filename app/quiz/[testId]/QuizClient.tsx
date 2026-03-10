'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnswerRecord, StudentInfo, Test } from "@/lib/types";
import { storageKeys } from "@/lib/storage";
import { getLevel } from "@/lib/score";

const toInitialAnswers = (length: number) =>
  Array.from({ length }, () => null as number | null);

function formatSeconds(total: number) {
  const min = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(total % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
}

function formatElapsed(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function QuizClient({
  test,
  branch,
}: {
  test: Test;
  branch: { id: string; name: string };
}) {
  const router = useRouter();
  const focusRef = useRef<HTMLDivElement | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    toInitialAnswers(test.questions.length)
  );
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitTo, setExitTo] = useState<string>("");
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const finishedRef = useRef(false);

  const defaultExitPath = `/tests?branch=${encodeURIComponent(branch.id)}`;

  const total = test.questions.length;
  const answeredCount = useMemo(
    () => answers.filter((item) => item !== null).length,
    [answers]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedStudent = localStorage.getItem(storageKeys.student);
    if (storedStudent) {
      try {
        setStudent(JSON.parse(storedStudent));
      } catch {
        setStudent(null);
      }
    }

    const storedAnswers = localStorage.getItem(storageKeys.answers(test.id));
    if (storedAnswers) {
      try {
        const parsed = JSON.parse(storedAnswers) as (number | null)[];
        if (Array.isArray(parsed) && parsed.length === total) {
          setAnswers(parsed);
        }
      } catch {
        setAnswers(toInitialAnswers(total));
      }
    }

    const storedProgress = localStorage.getItem(storageKeys.quizProgress(test.id));
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress) as {
          current: number;
          startedAt?: number;
        };
        if (typeof parsed.current === "number") {
          setCurrent(parsed.current);
        }
        if (parsed.startedAt) {
          setStartedAt(parsed.startedAt);
        }
      } catch {
        setCurrent(0);
      }
    }
    if (!startedAt) setStartedAt(Date.now());
  }, [test.id, test.timeLimitSec, total, startedAt]);

  useEffect(() => {
    focusRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKeys.answers(test.id), JSON.stringify(answers));
    localStorage.setItem(
      storageKeys.quizProgress(test.id),
      JSON.stringify({ current, startedAt })
    );
  }, [answers, current, startedAt, test.id]);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (finishedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finishedRef.current) return;

    const handlePopState = () => {
      if (finishedRef.current) return;
      setExitTo(defaultExitPath);
      setShowExitConfirm(true);
      // Keep user on the quiz until they confirm.
      history.pushState(null, "", window.location.href);
    };

    history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultExitPath]);

  const requestExit = (to: string) => {
    setExitTo(to);
    setShowExitConfirm(true);
  };

  const handleAnswer = (index: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = index;
      return next;
    });
  };

  const handleFinish = async (auto = false) => {
    if (!student) return;
    if (submitting) return;
    setSubmitting(true);

    const attemptKey = storageKeys.attempt(test.id);
    const attemptId =
      localStorage.getItem(attemptKey) ?? crypto.randomUUID();
    localStorage.setItem(attemptKey, attemptId);

    const submittedKey = storageKeys.submittedAttempts;
    const submittedRaw = localStorage.getItem(submittedKey);
    const submitted = submittedRaw ? (JSON.parse(submittedRaw) as string[]) : [];

    const answerRecords: AnswerRecord[] = test.questions.map((question, idx) => {
      const selectedIndex = answers[idx];
      const isCorrect = selectedIndex === question.answerIndex;
      return {
        questionId: question.id,
        selectedIndex,
        isCorrect,
      } as AnswerRecord;
    });

    const correct = answerRecords.filter((item) => item.isCorrect).length;
    const percent = Math.round((correct / total) * 100);
    const durationSec = startedAt ? Math.max(Math.floor((Date.now() - startedAt) / 1000), 0) : undefined;
    const payload = {
      attemptId,
      createdAt: new Date().toISOString(),
      student,
      branch,
      test: { id: test.id, title: test.title },
      durationSec,
      score: { correct, total, percent },
      level: getLevel(percent),
      answers: answerRecords,
    };

    if (!submitted.includes(attemptId)) {
      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; telegram?: { ok: boolean; skipped?: boolean; description?: string } }
          | null;
        if (body?.telegram && body.telegram.ok === false) {
          console.warn("Telegram notification failed:", body.telegram.description);
        }
        localStorage.setItem(
          submittedKey,
          JSON.stringify([...submitted, attemptId])
        );
      } catch {
        // ignore network errors, still allow local result
      }
    }

    localStorage.setItem(
      storageKeys.result(attemptId),
      JSON.stringify(payload)
    );

    finishedRef.current = true;
    router.push(`/result/${attemptId}${auto ? "?auto=1" : ""}`);
  };

  if (!student) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        O‘quvchi ma’lumoti topilmadi. Iltimos, avval testni boshlang.
        <div className="mt-4">
          <button
            type="button"
            onClick={() =>
              router.push(`/start/${test.id}?branch=${encodeURIComponent(branch.id)}`)
            }
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Ma’lumotni kiritish
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[current];
  const progressPercent = Math.round(((current + 1) / total) * 100);

  return (
    <div className="space-y-6" ref={focusRef} tabIndex={-1}>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Savol {current + 1}/{total}
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            ⏱ {formatElapsed(elapsedSec)}
          </span>
          <span className="text-xs text-muted-foreground">Javoblar: {answeredCount}</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {currentQuestion.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentQuestion.imageUrl}
            alt=""
            className="mb-4 w-full rounded-xl border border-border object-cover"
            loading="lazy"
          />
        ) : null}
        <h2 className="text-lg font-semibold text-foreground">
          {currentQuestion.question}
        </h2>
        <div className="mt-4 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const selected = answers[current] === idx;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswer(idx)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-border ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-muted-foreground"
                }`}
                aria-pressed={selected}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => requestExit(defaultExitPath)}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:opacity-90"
          >
            ← Testlar
          </button>
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((prev) => Math.max(prev - 1, 0))}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Orqaga
          </button>
        </div>
        <div className="flex items-center gap-3">
          {current < total - 1 ? (
            <button
              type="button"
              onClick={() => setCurrent((prev) => Math.min(prev + 1, total - 1))}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Keyingisi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowFinishConfirm(true)}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Yakunlash
            </button>
          )}
        </div>
      </div>

      {showExitConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Chiqishni tasdiqlaysizmi?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Progress saqlanadi, ammo testdan chiqasiz.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:opacity-90"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => router.push(exitTo || defaultExitPath)}
                className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showFinishConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Testni yakunlaysizmi?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Natija hisoblanadi va yuboriladi.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:opacity-90"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                disabled={submitting}
              >
                {submitting ? "Yuborilmoqda..." : "Yakunlash"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
