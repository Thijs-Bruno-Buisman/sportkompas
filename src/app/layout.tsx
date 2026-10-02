import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { DatabaseProvider } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";

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
    <html lang="nl" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300 overflow-x-hidden">
        <ThemeProvider>
          <DatabaseProvider>
            <AppShell>{children}</AppShell>
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

