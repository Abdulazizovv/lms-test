import Link from "next/link";
import AnimatedPreview from "@/app/AnimatedPreview";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-linear-to-br from-white via-white to-slate-50 p-8 shadow-sm md:grid-cols-2 md:p-12">
        <div className="space-y-6 fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            Tezkor baholash • Barcha fanlar
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            O'quvchi bilimini 5 daqiqada sinang
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            Matematika, mantiq, til, dasturlash va boshqa fanlar uchun tezkor baholash.
            Savollar ketma-ket, natija darhol va Telegramga yuboriladi.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tests"
              className="rounded-full bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Bilimni sinash
            </Link>
            <Link
              href="/admin/results"
              className="rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Natijalarni ko'rish
            </Link>
          </div>
        </div>
        <AnimatedPreview />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Qanday ishlaydi
          </h2>
          <span className="text-sm text-slate-500">3 qadam</span>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {
            [
              {
                title: "Testni tanlang",
                text: "O'zingizga mos fan yoki yo'nalishni tanlang.",
              },
              {
                title: "Savollarga javob bering",
                text: "Har bir savol ketma-ket, progress ko'rinadi.",
              },
              {
                title: "Natijani oling",
                text: "Natija hisoblanadi va darhol Telegramga yuboriladi.",
              },
            ].map((step, idx) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
            >
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {idx + 1}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
