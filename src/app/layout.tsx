import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "SportKompas — Persoonlijke Sport & Gezondheid",
  description:
    "Jouw persoonlijke, rustige alles-in-één sportapp voor krachttraining, cardio, voeding en voortgang.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-24 md:pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}

