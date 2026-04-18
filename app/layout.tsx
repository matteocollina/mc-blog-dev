import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
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
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K4XJP7DS');`}
        </Script>
        <Script
          id="google-gtag-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-5ZCW8LDWY6"
          strategy="beforeInteractive"
        />
        <Script id="google-gtag-config" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-5ZCW8LDWY6');`}
        </Script>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K4XJP7DS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
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
