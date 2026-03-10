'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ResultRecord, Test } from "@/lib/types";

function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("admin_password") ?? "";
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; result: ResultRecord; test: Test | null };

export default function AdminResultDetailPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId ?? "";

  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const run = async () => {
      if (!attemptId) return;
      setState({ status: "loading" });
      try {
        const res = await fetch(`/api/results/${encodeURIComponent(attemptId)}`);
        const data = (await res.json()) as
          | { ok: true; result: ResultRecord }
          | { ok: false; error: string };
        if (!res.ok || !data.ok) {
          setState({ status: "error", message: "Natija topilmadi" });
          return;
        }

        const testsRes = await fetch("/api/admin/tests", {
          headers: { "x-admin-password": getAdminPassword() },
        });
        const testsData = (await testsRes.json()) as
          | { ok: true; tests: Test[] }
          | { ok: false; error: string };
        const test =
          testsRes.ok && testsData.ok
            ? testsData.tests.find((t) => t.id === data.result.test.id) ?? null
            : null;

        setState({ status: "ready", result: data.result, test });
      } catch {
        setState({ status: "error", message: "Tarmoq xatosi" });
      }
    };
    run();
  }, [attemptId]);

  const rows = useMemo(() => {
    if (state.status !== "ready") return [];
    const { result, test } = state;
    return result.answers.map((ans) => {
      const q = test?.questions.find((qq) => qq.id === ans.questionId);
      const selectedText =
        typeof ans.selectedIndex === "number" && q?.options?.[ans.selectedIndex]
          ? q.options[ans.selectedIndex]
          : ans.selectedIndex === null
          ? "Tanlanmagan"
          : `#${ans.selectedIndex}`;
      const correctText =
        q?.options?.[q.answerIndex] ?? (typeof q?.answerIndex === "number" ? `#${q.answerIndex}` : "—");
      return {
        id: ans.questionId,
        question: q?.question ?? ans.questionId,
        imageUrl: q?.imageUrl,
        selectedText,
        correctText,
        isCorrect: ans.isCorrect,
      };
    });
  }, [state]);

  if (state.status === "loading") {
    return <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/results"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          ← Natijalar
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {state.message}
        </div>
      </div>
    );
  }

  const { result, test } = state;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/results"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
      >
        ← Natijalar
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Natija tafsiloti</h1>
        <p className="text-sm text-muted-foreground">
          {result.student.name} ({result.student.age}) • {result.branch?.name ?? "—"} •{" "}
          {result.test.title} • {result.score.percent}%
        </p>
        <p className="text-xs text-muted-foreground">
          Attempt: <span className="font-mono">{result.attemptId}</span>{" "}
          {test ? null : "• (Test JSON topilmadi, faqat answerId ko‘rinadi)"}
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((r, idx) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">
                {idx + 1}. {r.question}
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  r.isCorrect
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900"
                }`}
              >
                {r.isCorrect ? "To‘g‘ri" : "Noto‘g‘ri"}
              </span>
            </div>

            {r.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.imageUrl}
                alt=""
                className="mt-4 h-44 w-full rounded-xl border border-border object-cover"
                loading="lazy"
              />
            ) : null}

            <div className="mt-4 grid gap-2 text-sm">
              <div className="text-muted-foreground">
                Tanlangan: <span className="font-medium text-foreground">{r.selectedText}</span>
              </div>
              <div className="text-muted-foreground">
                To‘g‘ri javob: <span className="font-medium text-foreground">{r.correctText}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

