import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AP Invoice Decision Engine",
  description:
    "Automated invoice extraction, PO matching, and Approve / Hold / Reject decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSans.variable} ${ibmMono.variable} min-h-screen antialiased`}
      >
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <Link href="/" className="text-sm font-semibold text-slate-900">
                AP Invoice Decision Engine
              </Link>
              <p className="text-xs text-slate-500">
                PS-1 · Invoice PDF → reasoned decision
              </p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
