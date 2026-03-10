'use client';

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const nextTheme = stored === "dark" ? "dark" : "light";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:opacity-90"
      aria-label="Theme toggle"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
