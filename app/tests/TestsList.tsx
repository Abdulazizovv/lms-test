'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Test } from "@/lib/types";

const difficultyColors: Record<string, string> = {
  Beginner:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
  Intermediate:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  Advanced:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900",
};

function formatTime(seconds?: number) {
  if (!seconds) return "—";
  const mins = Math.ceil(seconds / 60);
  return `${mins} min`;
}

export default function TestsList({
  tests,
  branch,
}: {
  tests: Test[];
  branch: { id: string; name: string };
}) {
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
        href="/branches"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
      >
        ← Filiallar
      </Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Testlar ro‘yxati</h1>
          <p className="text-sm text-muted-foreground">
            Filial: <span className="font-medium text-foreground">{branch.name}</span>
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
            className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-muted-foreground"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Hech narsa topilmadi.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((test) => (
            <div
              key={test.id}
              className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      difficultyColors[test.difficulty] ??
                      "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {test.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {test.questions.length} savol
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {test.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Taxminiy vaqt: {formatTime(test.timeLimitSec)}
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href={`/start/${test.id}?branch=${encodeURIComponent(branch.id)}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
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
