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

  if (!authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-slate-900">
              Admin Panel
            </h1>
            <p className="text-sm text-slate-600">
              Natijalarni ko'rish uchun parolni kiriting.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="pwd">
              Parol
            </label>
            <input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolni kiriting"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
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
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
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
          className="inline-flex items-center gap-1 text-xs text-slate-600 transition hover:text-slate-900"
        >
          ← Bosh sahifa
        </Link>
        <button
          type="button"
          onClick={() => {
            setAuthenticated(false);
            sessionStorage.removeItem("admin_auth");
          }}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Chiqish
        </button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Natijalar paneli
          </h1>
          <p className="text-sm text-slate-600">
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
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Hech narsa topilmadi.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Vaqt</th>
                <th className="px-4 py-3">Ism</th>
                <th className="px-4 py-3">Yosh</th>
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.attemptId} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                    {formatTime(item.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.student.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.student.age}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.test.title}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.score.correct}/{item.score.total}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
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
                          : "bg-slate-50 text-slate-700 border-slate-200"
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
