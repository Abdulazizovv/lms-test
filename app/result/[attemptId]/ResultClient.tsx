'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ResultRecord } from "@/lib/types";
import { storageKeys } from "@/lib/storage";

const levelColors: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-rose-50 text-rose-700 border-rose-200",
};

const levelText: Record<string, string> = {
  Beginner: "Asosiy tushunchalarni o'zlashtirdingiz. Davom eting!",
  Intermediate: "Yaxshi natija! Bir oz amaliyot kerak.",
  Advanced: "A'lo! Siz bu sohani yaxshi bilasiz.",
};

export default function ResultClient({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<ResultRecord | null>(null);
  const searchParams = useSearchParams();
  const isAuto = searchParams?.get("auto") === "1";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKeys.result(attemptId));
    if (!raw) return;
    try {
      setResult(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, [attemptId]);

  if (!result) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Natija topilmadi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-900"
      >
        ← Bosh sahifa
      </Link>
      {isAuto ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          ⏱ Vaqt tugadi. Test avtomatik yakunlandi.
        </div>
      ) : null}

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Natija tayyor</h1>
        <p className="text-sm text-slate-600">
          {result.student.name} ({result.student.age} yosh) —{" "}
          {result.test.title}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-slate-500">To'g'ri javoblar</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">
            {result.score.correct}
            <span className="text-sm text-slate-500">/{result.score.total}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-slate-500">Foiz</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">
            {result.score.percent}%
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs text-slate-500">Daraja</div>
          <div className="mt-1">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                levelColors[result.level] ?? "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {result.level}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Fikr</h2>
        <p className="mt-2 text-sm text-slate-600">
          {levelText[result.level] ?? "Natija qayd etildi."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/tests"
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          Yana test yechish
        </Link>
        <Link
          href="/"
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
