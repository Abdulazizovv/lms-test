import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="uz">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
      >
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-900" />
                <span className="text-sm font-semibold tracking-tight">Assessment</span>
              </div>
              <nav className="flex items-center gap-4 text-sm text-slate-600">
                <a className="transition hover:text-slate-900" href="/">
                  Bosh sahifa
                </a>
                <a className="transition hover:text-slate-900" href="/tests">
                  Testlar
                </a>
                <a className="transition hover:text-slate-900" href="/admin/results">
                  Natijalar
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-6">
            <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-500 md:px-6">
              © {new Date().getFullYear()} IT Academy Kokand tomonidan ishlab chiqilgan
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
