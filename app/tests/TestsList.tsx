'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Test } from "@/lib/types";

const difficultyColors: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatTime(seconds?: number) {
  if (!seconds) return "—";
  const mins = Math.ceil(seconds / 60);
  return `${mins} min`;
}

export default function TestsList({ tests }: { tests: Test[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((test) =>
      test.title.toLowerCase().includes(q)
    );
  }, [query, tests]);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-900"
      >
        ← Bosh sahifa
      </Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Testlar ro‘yxati</h1>
          <p className="text-sm text-slate-600">
            Mos testni toping va darhol boshlang.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <label className="sr-only" htmlFor="search">
            Qidiruv
          </label>
          <input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Test nomi bo‘yicha qidirish"
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Hech narsa topilmadi.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((test) => (
            <div
              key={test.id}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      difficultyColors[test.difficulty] ??
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {test.difficulty}
                  </span>
                  <span className="text-xs text-slate-500">
                    {test.questions.length} savol
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {test.title}
                </h3>
                <p className="text-sm text-slate-600">
                  Taxminiy vaqt: {formatTime(test.timeLimitSec)}
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href={`/start/${test.id}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Boshlash
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
