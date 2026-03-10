'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Test } from "@/lib/types";
import { storageKeys } from "@/lib/storage";

const emptyStudent = { name: "", age: "" };

export default function StartClient({
  test,
  branch,
}: {
  test: Test;
  branch: { id: string; name: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyStudent);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKeys.student);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { name: string; age: number };
      setForm({ name: parsed.name, age: String(parsed.age) });
    } catch {
      // ignore parse errors
    }
  }, []);

  const validate = () => {
    if (!form.name.trim()) return "Ism kiriting.";
    const age = Number(form.age);
    if (!Number.isFinite(age)) return "Yoshni to‘g‘ri kiriting.";
    if (age < 5 || age > 80) return "Yosh 5–80 oralig‘ida bo‘lsin.";
    return "";
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    const student = { name: form.name.trim(), age: Number(form.age) };
    localStorage.setItem(storageKeys.student, JSON.stringify(student));

    // Generate new attemptId for each quiz attempt
    const attemptId = crypto.randomUUID();
    const attemptKey = storageKeys.attempt(test.id);
    localStorage.setItem(attemptKey, attemptId);
    
    // Clear previous answers for this test
    localStorage.removeItem(storageKeys.answers(test.id));
    localStorage.removeItem(storageKeys.quizProgress(test.id));

    router.push(`/quiz/${test.id}?branch=${encodeURIComponent(branch.id)}`);
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push(`/tests?branch=${encodeURIComponent(branch.id)}`)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
      >
        ← Testlar ro'yxatiga qaytish
      </button>
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">
          Filial: <span className="font-medium text-foreground">{branch.name}</span>
        </span>
        <h1 className="text-2xl font-semibold text-foreground">{test.title}</h1>
        <p className="text-sm text-muted-foreground">
          Iltimos, ma'lumotlaringizni kiriting.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:max-w-lg"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Ism
          </label>
          <input
            id="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Masalan: Ali"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-muted-foreground"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="age">
            Yosh
          </label>
          <input
            id="age"
            type="number"
            min={5}
            max={80}
            value={form.age}
            onChange={(event) => setForm({ ...form, age: event.target.value })}
            placeholder="Masalan: 14"
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
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Davom etish
        </button>
      </form>
    </div>
  );
}
