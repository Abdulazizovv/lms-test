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

export default function QuizClient({ test }: { test: Test }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    toInitialAnswers(test.questions.length)
  );
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const finishedRef = useRef(false);

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

    if (test.timeLimitSec && !startedAt) {
      const now = Date.now();
      setStartedAt(now);
    }
  }, [test.id, test.timeLimitSec, total, startedAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKeys.answers(test.id), JSON.stringify(answers));
    localStorage.setItem(
      storageKeys.quizProgress(test.id),
      JSON.stringify({ current, startedAt })
    );
  }, [answers, current, startedAt, test.id]);

  useEffect(() => {
    if (!test.timeLimitSec || !startedAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remainingSec = Math.max((test.timeLimitSec ?? 0) - elapsed, 0);
      setRemaining(remainingSec);
      if (remainingSec <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        handleFinish(true);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, test.timeLimitSec]);

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
    const payload = {
      attemptId,
      createdAt: new Date().toISOString(),
      student,
      test: { id: test.id, title: test.title },
      score: { correct, total, percent },
      level: getLevel(percent),
      answers: answerRecords,
    };

    if (!submitted.includes(attemptId)) {
      try {
        await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        O‘quvchi ma’lumoti topilmadi. Iltimos, avval testni boshlang.
        <div className="mt-4">
          <button
            type="button"
            onClick={() => router.push(`/start/${test.id}`)}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>
            Savol {current + 1}/{total}
          </span>
          {test.timeLimitSec ? (
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
              {remaining !== null ? formatSeconds(remaining) : formatSeconds(test.timeLimitSec)}
            </span>
          ) : null}
          <span className="text-xs text-slate-500">Javoblar: {answeredCount}</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-slate-900 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
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
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
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
            onClick={() => router.push("/tests")}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
          >
            ← Testlar
          </button>
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((prev) => Math.max(prev - 1, 0))}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Orqaga
          </button>
        </div>
        <div className="flex items-center gap-3">
          {current < total - 1 ? (
            <button
              type="button"
              onClick={() => setCurrent((prev) => Math.min(prev + 1, total - 1))}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Keyingisi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowFinishConfirm(true)}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Yakunlash
            </button>
          )}
        </div>
      </div>

      {showExitConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              Chiqishni tasdiqlaysizmi?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Progress saqlanadi, ammo testdan chiqasiz.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Bosh sahifaga
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showFinishConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              Testni yakunlaysizmi?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Natija hisoblanadi va yuboriladi.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
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
