'use client';

import { useEffect, useState } from "react";

const examples = [
  {
    subject: "Matematika",
    question: "12 × 8 = ?",
    options: ["84", "96", "106", "88"],
  },
  {
    subject: "Ingliz tili",
    question: "What is the opposite of 'hot'?",
    options: ["Cold", "Warm", "Cool", "Freezing"],
  },
  {
    subject: "Python",
    question: "print() funksiyasi nima qiladi?",
    options: ["Kiritadi", "Chop etadi", "O'chiradi", "Saqlaydi"],
  },
  {
    subject: "Mantiq",
    question: "2, 4, 8, 16, ... keyingi son?",
    options: ["18", "20", "24", "32"],
  },
];

export default function AnimatedPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % examples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = examples[currentIndex];

  return (
    <div className="fade-in">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>3/10</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 w-1/3 rounded-full bg-primary transition-all" />
          </div>
          <div className="rounded-2xl border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {current.subject}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {current.question}
            </p>
            <div className="mt-4 space-y-2">
              {current.options.slice(0, 3).map((opt) => (
                <div
                  key={opt}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-all"
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tezkor tekshiruv</span>
            <span>10:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
