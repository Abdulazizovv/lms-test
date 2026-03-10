'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Branch, Test } from "@/lib/types";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("admin_password") ?? "";
}

export default function AdminTestsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [query, setQuery] = useState("");
  const [branchId, setBranchId] = useState<string>("");

  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [api, setApi] = useState<ApiState>({ status: "idle" });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"new" | "edit">("new");
  const [editorOriginalId, setEditorOriginalId] = useState<string>("");
  const [editorValue, setEditorValue] = useState<string>("");
  const [imageQuestionId, setImageQuestionId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchAll = async () => {
    setApi({ status: "loading" });
    try {
      const res = await fetch("/api/admin/tests", {
        headers: { "x-admin-password": getAdminPassword() },
      });
      const data = (await res.json()) as
        | { ok: true; branches: Branch[]; tests: Test[] }
        | { ok: false; error: string };
      if (!res.ok || !data.ok) {
        setApi({ status: "error", message: "Ma'lumotlarni olishda xatolik" });
        return;
      }
      setBranches(data.branches);
      setTests(data.tests);
      setBranchId((prev) => prev || data.branches[0]?.id || "main");
      setApi({ status: "idle" });
    } catch {
      setApi({ status: "error", message: "Tarmoq xatosi" });
    }
  };

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("admin_auth") : null;
    const storedPwd = getAdminPassword();
    if (stored === "true" && storedPwd) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests
      .filter((t) => (t.branchId ?? "main") === (branchId || "main"))
      .filter((t) => (q ? t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) : true));
  }, [tests, query, branchId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (res.ok && data.ok) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_password", password);
      } else {
        setAuthError("Parol noto'g'ri");
      }
    } catch {
      setAuthError("Xatolik yuz berdi");
    }
  };

  const openNew = () => {
    const template: Test = {
      id: "new-test-id",
      branchId: branchId || "main",
      title: "Yangi test",
      difficulty: "Beginner",
      timeLimitSec: undefined,
      questions: [
        {
          id: "q1",
          question: "Savol matni",
          imageUrl: "",
          options: ["A", "B", "C", "D"],
          answerIndex: 0,
        },
      ],
    };
    setEditorMode("new");
    setEditorOriginalId("");
    setEditorValue(JSON.stringify(template, null, 2));
    setEditorOpen(true);
  };

  const openEdit = (test: Test) => {
    setEditorMode("edit");
    setEditorOriginalId(test.id);
    setEditorValue(JSON.stringify(test, null, 2));
    setImageQuestionId("");
    setImageUrl("");
    setEditorOpen(true);
  };

  const saveEditor = async () => {
    let parsed: Test;
    try {
      parsed = JSON.parse(editorValue) as Test;
    } catch {
      alert("JSON xato. Iltimos tekshiring.");
      return;
    }
    if (!parsed?.id || !parsed.title || !Array.isArray(parsed.questions)) {
      alert("Test strukturasida majburiy fieldlar yetishmayapti (id, title, questions).");
      return;
    }

    const method = editorMode === "new" ? "POST" : "PUT";
    const body =
      editorMode === "new"
        ? { test: parsed }
        : { id: editorOriginalId, test: parsed };

    setApi({ status: "loading" });
    try {
      const res = await fetch("/api/admin/tests", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": getAdminPassword(),
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        alert(data.error ?? "Saqlashda xatolik");
        setApi({ status: "idle" });
        return;
      }
      setEditorOpen(false);
      await fetchAll();
    } catch {
      alert("Tarmoq xatosi");
      setApi({ status: "idle" });
    }
  };

  const deleteTest = async (id: string) => {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    setApi({ status: "loading" });
    try {
      const res = await fetch(`/api/admin/tests?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": getAdminPassword() },
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        alert(data.error ?? "O'chirishda xatolik");
        setApi({ status: "idle" });
        return;
      }
      await fetchAll();
    } catch {
      alert("Tarmoq xatosi");
      setApi({ status: "idle" });
    }
  };

  const applyQuestionImageUrl = () => {
    let parsed: Test;
    try {
      parsed = JSON.parse(editorValue) as Test;
    } catch {
      alert("JSON xato. Iltimos tekshiring.");
      return;
    }
    const qid = imageQuestionId.trim();
    if (!qid) {
      alert("Question id kiriting (masalan: q1).");
      return;
    }
    if (!Array.isArray(parsed.questions)) {
      alert("Test questions topilmadi.");
      return;
    }
    const idx = parsed.questions.findIndex((q) => q.id === qid);
    if (idx === -1) {
      alert("Bunday question id topilmadi.");
      return;
    }
    const next = { ...parsed };
    const questions = next.questions.slice();
    questions[idx] = { ...questions[idx], imageUrl: imageUrl.trim() || undefined };
    next.questions = questions;
    setEditorValue(JSON.stringify(next, null, 2));
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Testlarni boshqarish uchun parolni kiriting.
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
          {authError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {authError}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            ← Bosh sahifa
          </Link>
          <Link
            href="/admin/branches"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
          >
            Filiallar
          </Link>
          <Link
            href="/admin/results"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
          >
            Natijalar
          </Link>
        </div>
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

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Testlar paneli</h1>
          <p className="text-sm text-muted-foreground">JSON asosida testlarni qo‘shish va tahrirlash.</p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none transition focus:border-muted-foreground"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish: id yoki title"
            className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-muted-foreground md:w-72"
          />
          <button
            type="button"
            onClick={openNew}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            + Yangi test
          </button>
        </div>
      </div>

      {api.status === "error" ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {api.message}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Hech narsa topilmadi.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">{t.title}</div>
                  <div className="text-xs text-muted-foreground">id: {t.id}</div>
                  <div className="text-xs text-muted-foreground">
                    Savollar: {t.questions.length} • Daraja: {t.difficulty} • Vaqt: hisoblanadi
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTest(t.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:opacity-90"
                  >
                    O‘chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">
                {editorMode === "new" ? "Yangi test" : "Testni tahrirlash"}
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
              >
                Yopish
              </button>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="text-xs font-semibold text-muted-foreground">
                Savol rasmi (URL):
              </div>
              <input
                value={imageQuestionId}
                onChange={(e) => setImageQuestionId(e.target.value)}
                placeholder="question id (q1)"
                className="w-full rounded-full border border-border bg-card px-4 py-2 text-xs text-foreground outline-none transition focus:border-muted-foreground md:w-40"
              />
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... yoki /images/..."
                className="w-full rounded-full border border-border bg-card px-4 py-2 text-xs text-foreground outline-none transition focus:border-muted-foreground"
              />
              <button
                type="button"
                onClick={applyQuestionImageUrl}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:opacity-90"
              >
                Qo‘llash
              </button>
            </div>
            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              rows={18}
              className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground outline-none transition focus:border-muted-foreground"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:opacity-90"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={saveEditor}
                disabled={api.status === "loading"}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {api.status === "loading" ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
