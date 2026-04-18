import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Blog di Matteo Collina ",
  description: "Blog in italiano dedicato al frontend.",
  icons: {
    icon: "/favicon-mc.ico",
    shortcut: "/favicon-mc.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-50">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-8 sm:px-10">
          <header className="mb-12 flex items-center justify-between border-b border-zinc-800 pb-5">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-zinc-50 transition-colors hover:text-zinc-300"
            >
              Blog di Matteo Collina
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-6">
              <Link
                href="/blog"
                className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
              >
                Blog
              </Link>
              <Link
                href="/about"
                className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
              >
                About
              </Link>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
