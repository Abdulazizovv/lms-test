'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ResultRecord } from "@/lib/types";
import { storageKeys } from "@/lib/storage";

const levelColors: Record<string, string> = {
  Beginner:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
  Intermediate:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  Advanced:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900",
};

const levelText: Record<string, string> = {
  Beginner: "Asosiy tushunchalarni o'zlashtirdingiz. Davom eting!",
  Intermediate: "Yaxshi natija! Bir oz amaliyot kerak.",
  Advanced: "A'lo! Siz bu sohani yaxshi bilasiz.",
};

function formatDuration(totalSec?: number) {
  if (typeof totalSec !== "number" || !Number.isFinite(totalSec)) return "—";
  const sec = Math.max(Math.floor(totalSec), 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ResultClient({ attemptId }: { attemptId: string }) {
  const [result, setResult] = useState<ResultRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const isAuto = searchParams?.get("auto") === "1";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKeys.result(attemptId));
    if (raw) {
      try {
        setResult(JSON.parse(raw));
        setLoading(false);
        return;
      } catch {
        // ignore parse errors
      }
    }

    fetch(`/api/results/${encodeURIComponent(attemptId)}`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = data as { ok?: boolean; result?: ResultRecord };
        if (parsed?.ok && parsed.result) setResult(parsed.result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [attemptId]);

  if (!result && loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Natija yuklanmoqda...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Natija topilmadi.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
      >
        ← Bosh sahifa
      </Link>
      {isAuto ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          ⏱ Vaqt tugadi. Test avtomatik yakunlandi.
        </div>
      ) : null}

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">Natija tayyor</h1>
        <p className="text-sm text-muted-foreground">
          {result.student.name} ({result.student.age} yosh) —{" "}
          {result.test.title}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-xs text-muted-foreground">To'g'ri javoblar</div>
          <div className="mt-1 text-3xl font-semibold text-foreground">
            {result.score.correct}
            <span className="text-sm text-muted-foreground">/{result.score.total}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-xs text-muted-foreground">Foiz</div>
          <div className="mt-1 text-3xl font-semibold text-foreground">
            {result.score.percent}%
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-xs text-muted-foreground">Daraja</div>
          <div className="mt-1">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                levelColors[result.level] ??
                "bg-muted text-muted-foreground border-border"
              }`}
            >
              {result.level}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-xs text-muted-foreground">Sarflangan vaqt</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {formatDuration(result.durationSec)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-xs text-muted-foreground">Filial</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {result.branch?.name ?? "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Fikr</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {levelText[result.level] ?? "Natija qayd etildi."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={
            result.branch?.id
              ? `/tests?branch=${encodeURIComponent(result.branch.id)}`
              : "/branches"
          }
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Yana test yechish
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:opacity-90"
        >
          Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
