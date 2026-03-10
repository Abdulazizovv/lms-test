'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ResultRecord } from "@/lib/types";

export default function AdminResults() {
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [query, setQuery] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchResults = () => {
    fetch("/api/results")
      .then((res) => res.json())
      .then((data) => setResults(data as ResultRecord[]))
      .catch(() => setResults([]));
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored === "true") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchResults();
  }, [authenticated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter((item) =>
      item.test.title.toLowerCase().includes(q)
    );
  }, [query, results]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_password", password);
      } else {
        setError("Parol noto'g'ri");
      }
    } catch {
      setError("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (attemptId: string) => {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    setDeleting(attemptId);
    try {
      const res = await fetch(`/api/results/${attemptId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchResults();
      } else {
        alert("O'chirishda xatolik");
      }
    } catch {
      alert("O'chirishda xatolik");
    } finally {
      setDeleting(null);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (sec?: number) => {
    if (typeof sec !== "number" || !Number.isFinite(sec)) return "—";
    const s = Math.max(Math.floor(sec), 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Natijalarni ko'rish uchun parolni kiriting.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="pwd">
              Parol
            </label>
            <input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolni kiriting"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-muted-foreground"
              required
            />
          </div>
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Kirish
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          ← Bosh sahifa
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/branches"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
          >
            Filiallar
          </Link>
          <Link
            href="/admin/tests"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
          >
            Testlar
          </Link>
        <button
          type="button"
          onClick={() => {
            setAuthenticated(false);
            sessionStorage.removeItem("admin_auth");
            sessionStorage.removeItem("admin_password");
          }}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
        >
          Chiqish
        </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Natijalar paneli
          </h1>
          <p className="text-sm text-muted-foreground">
            Barcha testlar uchun natijalar.
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
            placeholder="Test nomi bo'yicha qidirish"
            className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-muted-foreground"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Hech narsa topilmadi.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Vaqt</th>
                <th className="px-4 py-3">Sarflangan</th>
                <th className="px-4 py-3">Ism</th>
                <th className="px-4 py-3">Yosh</th>
                <th className="px-4 py-3">Filial</th>
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.attemptId} className="hover:bg-muted">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatTime(item.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatDuration(item.durationSec)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.student.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.student.age}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.branch?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {item.test.title}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {item.score.correct}/{item.score.total}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {item.score.percent}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        item.level === "Beginner"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.level === "Intermediate"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : item.level === "Advanced"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {item.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.attemptId)}
                      disabled={deleting === item.attemptId}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleting === item.attemptId ? "O'chirilmoqda..." : "O'chirish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
