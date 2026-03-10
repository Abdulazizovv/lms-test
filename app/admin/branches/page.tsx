'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Branch } from "@/lib/types";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("admin_password") ?? "";
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [query, setQuery] = useState("");

  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [api, setApi] = useState<ApiState>({ status: "idle" });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"new" | "edit">("new");
  const [editorOriginalId, setEditorOriginalId] = useState<string>("");
  const [editorValue, setEditorValue] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchAll = async () => {
    setApi({ status: "loading" });
    try {
      const res = await fetch("/api/admin/branches", {
        headers: { "x-admin-password": getAdminPassword() },
      });
      const data = (await res.json()) as
        | { ok: true; branches: Branch[] }
        | { ok: false; error: string };
      if (!res.ok || !data.ok) {
        setApi({ status: "error", message: "Ma'lumotlarni olishda xatolik" });
        return;
      }
      setBranches(data.branches);
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
    if (!q) return branches;
    return branches.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    );
  }, [branches, query]);

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
    const template: Branch = {
      id: "new-branch-id",
      name: "Yangi filial",
      description: "",
      imageUrl: "",
      address: "",
      phone: "",
    };
    setEditorMode("new");
    setEditorOriginalId("");
    setEditorValue(JSON.stringify(template, null, 2));
    setImageUrl("");
    setEditorOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditorMode("edit");
    setEditorOriginalId(branch.id);
    setEditorValue(JSON.stringify(branch, null, 2));
    setImageUrl(branch.imageUrl ?? "");
    setEditorOpen(true);
  };

  const applyImageUrl = () => {
    let parsed: Branch;
    try {
      parsed = JSON.parse(editorValue) as Branch;
    } catch {
      alert("JSON xato. Iltimos tekshiring.");
      return;
    }
    const next = { ...parsed, imageUrl: imageUrl.trim() || undefined };
    setEditorValue(JSON.stringify(next, null, 2));
  };

  const saveEditor = async () => {
    let parsed: Branch;
    try {
      parsed = JSON.parse(editorValue) as Branch;
    } catch {
      alert("JSON xato. Iltimos tekshiring.");
      return;
    }
    if (!parsed?.id || !parsed?.name) {
      alert("Filial strukturasida majburiy fieldlar yetishmayapti (id, name).");
      return;
    }

    const method = editorMode === "new" ? "POST" : "PUT";
    const body =
      editorMode === "new"
        ? { branch: parsed }
        : { id: editorOriginalId, branch: parsed };

    setApi({ status: "loading" });
    try {
      const res = await fetch("/api/admin/branches", {
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

  const deleteBranch = async (id: string) => {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    setApi({ status: "loading" });
    try {
      const res = await fetch(`/api/admin/branches?id=${encodeURIComponent(id)}`, {
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
              Filiallarni boshqarish uchun parolni kiriting.
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
            href="/admin/results"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
          >
            Natijalar
          </Link>
          <Link
            href="/admin/tests"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
          >
            Testlar
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
          <h1 className="text-2xl font-semibold text-foreground">Filiallar paneli</h1>
          <p className="text-sm text-muted-foreground">
            JSON asosida filiallarni qo‘shish va tahrirlash.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish: id yoki name"
            className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-muted-foreground md:w-72"
          />
          <button
            type="button"
            onClick={openNew}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            + Yangi filial
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
          {filtered.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">{b.name}</div>
                  <div className="text-xs text-muted-foreground">id: {b.id}</div>
                  {b.description ? (
                    <div className="text-xs text-muted-foreground">{b.description}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBranch(b.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:opacity-90"
                  >
                    O‘chirish
                  </button>
                </div>
              </div>
              {b.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.imageUrl}
                  alt=""
                  className="mt-4 h-32 w-full rounded-xl border border-border object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl space-y-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">
                {editorMode === "new" ? "Yangi filial" : "Filialni tahrirlash"}
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
                Filial rasmi (URL):
              </div>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... yoki /images/..."
                className="w-full rounded-full border border-border bg-card px-4 py-2 text-xs text-foreground outline-none transition focus:border-muted-foreground"
              />
              <button
                type="button"
                onClick={applyImageUrl}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:opacity-90"
              >
                Qo‘llash
              </button>
            </div>

            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              rows={16}
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

