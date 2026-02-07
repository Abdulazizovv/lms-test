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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Progress</span>
            <span>3/10</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 w-1/3 rounded-full bg-slate-900 transition-all" />
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                {current.subject}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {current.question}
            </p>
            <div className="mt-4 space-y-2">
              {current.options.slice(0, 3).map((opt) => (
                <div
                  key={opt}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-all"
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tezkor tekshiruv</span>
            <span>10:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
