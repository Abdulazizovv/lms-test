import Link from "next/link";
import { readBranches } from "@/lib/data";

export default async function BranchesPage() {
  const branches = await readBranches();

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
      >
        ← Bosh sahifa
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Filialni tanlang</h1>
        <p className="text-sm text-muted-foreground">
          Avval filial tanlanadi, keyin shu filialga tegishli testlar chiqadi.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {branches.map((branch) => (
          <Link
            key={branch.id}
            href={`/tests?branch=${encodeURIComponent(branch.id)}`}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1"
          >
            {branch.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branch.imageUrl}
                alt=""
                className="mb-4 h-36 w-full rounded-xl border border-border object-cover"
                loading="lazy"
              />
            ) : null}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-lg font-semibold text-foreground">
                  {branch.name}
                </div>
                {branch.description ? (
                  <div className="text-sm text-muted-foreground">
                    {branch.description}
                  </div>
                ) : null}
              </div>
              <div className="text-xs font-semibold text-muted-foreground transition group-hover:text-foreground">
                Tanlash →
              </div>
            </div>
            {branch.address || branch.phone ? (
              <div className="mt-4 grid gap-1 text-xs text-muted-foreground">
                {branch.address ? <div>Manzil: {branch.address}</div> : null}
                {branch.phone ? <div>Telefon: {branch.phone}</div> : null}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
