import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/app/ThemeToggle";

export const metadata: Metadata = {
  title: "Assessment Platform",
  description: "Tezkor va sodda bilim baholash platformasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}var p=location&&location.pathname?location.pathname:'';document.documentElement.classList.toggle('focus-quiz',p.indexOf('/quiz/')===0);}catch(e){}})();",
          }}
        />
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-border bg-background backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Assessment
                </span>
              </div>
              <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link className="transition hover:text-foreground" href="/">
                  Bosh sahifa
                </Link>
                <Link className="transition hover:text-foreground" href="/branches">
                  Filiallar
                </Link>
                <Link className="transition hover:text-foreground" href="/admin/results">
                  Natijalar
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
            {children}
          </main>
          <footer className="border-t border-border bg-background py-6">
            <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground md:px-6">
              © {new Date().getFullYear()} IT Academy Kokand tomonidan ishlab chiqilgan
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
