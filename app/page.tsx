import Link from "next/link";
import AnimatedPreview from "@/app/AnimatedPreview";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted p-8 shadow-sm md:grid-cols-2 md:p-12">
        <div className="space-y-6 fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Tezkor baholash • Barcha fanlar
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            O'quvchi bilimini 5 daqiqada sinang
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Matematika, mantiq, til, dasturlash va boshqa fanlar uchun tezkor baholash.
            Savollar ketma-ket, natija darhol va Telegramga yuboriladi.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/branches"
              className="rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Bilimni sinash
            </Link>
            <Link
              href="/admin/results"
              className="rounded-full border border-border bg-card px-6 py-3 text-center text-sm font-semibold text-foreground transition hover:opacity-90"
            >
              Natijalarni ko'rish
            </Link>
          </div>
        </div>
        <AnimatedPreview />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground md:text-2xl">
            Qanday ishlaydi
          </h2>
          <span className="text-sm text-muted-foreground">3 qadam</span>
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
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1"
            >
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {idx + 1}
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
