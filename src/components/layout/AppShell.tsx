"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Activity, Utensils, User, ShieldCheck, Cloud } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useProfile } from "@/lib/hooks/useProfile";
import { useDatabase } from "@/lib/db";
import { useAuth } from "@/lib/supabase/AuthContext";
import { OnboardingModal } from "@/components/modules/onboarding/OnboardingModal";
import { AuthModal } from "@/components/modules/auth/AuthModal";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Training", href: "/training", icon: Dumbbell },
  { name: "Cardio", href: "/cardio", icon: Activity },
  { name: "Voeding", href: "/voeding", icon: Utensils },
  { name: "Profiel", href: "/profiel", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { needsOnboarding, saveProfile } = useProfile();
  const { isDemoMode, toggleDemoMode, resetDemoData } = useDatabase();
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isRouteActive = (href: string) => {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-x-hidden max-w-full">
      {/* Onboarding Wizard - Verschijnt uitsluitend als profielinstellingen ontbreken (en niet in demomodus) */}
      {needsOnboarding && !isDemoMode && (
        <OnboardingModal
          isOpen={true}
          onComplete={async (data) => {
            await saveProfile(data);
          }}
        />
      )}

      {/* =========================================================================
          DESKTOP ZIJBALK (Zichtbaar vanaf md: 768px)
      ========================================================================= */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 backdrop-blur sticky top-0 h-screen p-5 shrink-0 z-30">
        <div className="space-y-6">
          {/* Logo & Titel */}
          <Link
            href="/"
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xl shadow-md shadow-emerald-500/20">
              🧭
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Sport<span className="text-emerald-500">Kompas</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Persoonlijke Sportcockpit
              </p>
            </div>
          </Link>

          {/* Navigatielinks */}
          <nav className="space-y-1.5" aria-label="Hoofdnavigatie desktop">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    active
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      active
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Onderkant van Desktop Zijbalk */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Thema
            </span>
            <ThemeToggle />
          </div>

          {isDemoMode ? (
            <div className="space-y-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Demomodus Actief</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Database: <br />
                <span className="font-mono text-amber-600 dark:text-amber-300">SportKompasDemoDB</span>
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={resetDemoData}
                  className="flex-1 text-center px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => toggleDemoMode(false)}
                  className="flex-1 text-center px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Verlaten
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">Lokale IndexedDB &bull; Echte data</span>
              </div>

              {/* Cloud Sync Status / Button */}
              {user ? (
                <Link
                  href="/profiel"
                  className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                  title={`Ingelogd als ${user.email}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <Cloud className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate font-medium">{user.email}</span>
                  </div>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Cloud className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cloud Sync</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium">Inloggen</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================================
          MOBIELE BOVENBALK (Zichtbaar op schermen < 768px)
      ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-base shadow-xs">
            🧭
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
            Sport<span className="text-emerald-500">Kompas</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Cloud Auth Icon Mobile */}
          {user ? (
            <Link
              href="/profiel"
              className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              title={`Ingelogd als ${user.email}`}
            >
              <Cloud className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Inloggen voor Cloud Sync"
            >
              <Cloud className="w-4 h-4" />
            </button>
          )}

          {isDemoMode && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
              DEMO
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* =========================================================================
          HOOFD INHOUD CONTAINER MET PERSISTENTE DEMO BANNER
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Zichtbare Demo-indicatie Banner */}
        {isDemoMode && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-950 dark:text-amber-200 px-4 py-2.5 text-xs sm:text-sm font-medium z-30 backdrop-blur-md">
            <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shrink-0">
                  Demomodus
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                  Voorbeeldgegevens actief in <code className="px-1 py-0.5 rounded bg-amber-500/10 font-mono text-[11px] font-bold">SportKompasDemoDB</code>. Echte records blijven 100% onaangetast.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetDemoData}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-200 border border-amber-500/30 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Reset Demo
                </button>
                <button
                  type="button"
                  onClick={() => toggleDemoMode(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity text-xs font-semibold cursor-pointer"
                >
                  Sluit Demo
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 w-full max-w-full min-w-0 px-4 sm:px-6 md:px-8 py-6 pb-28 md:pb-12 max-w-5xl mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* =========================================================================
          MOBIELE BOTTOM NAVIGATION (Vast onderaan met min 48px touch targets)
      ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur px-2 py-1 pb-safe shadow-lg"
        aria-label="Mobiele hoofdnavigatie"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center h-full min-h-[48px] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                  active
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active
                      ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 scale-105"
                      : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-[64px]">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Cloud Auth Dialog */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
