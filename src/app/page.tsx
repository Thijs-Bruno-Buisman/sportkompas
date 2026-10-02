import Link from "next/link";
import { Dumbbell, Activity, Utensils, User, ArrowRight, Compass } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Header sectie */}
      <section className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welkom bij SportKompas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Jouw centrale cockpit voor training, cardio en voeding.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Lokale IndexedDB opslag
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            100% Offline-first
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Geen externe cloud vereist
          </span>
        </div>
      </section>

      {/* Snelle modules navigatie */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/training"
          className="group block p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Dumbbell className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            Krachttraining
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Routines, actieve sets loggen, rusttimers en PR-registraties.
          </p>
        </Link>

        <Link
          href="/cardio"
          className="group block p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Activity className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            Cardio
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hardlopen, fietsen, tempo&apos;s, afstanden en hartslagzones.
          </p>
        </Link>

        <Link
          href="/voeding"
          className="group block p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Utensils className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            Voeding &amp; Macro&apos;s
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calorieën, eiwitten, maaltijddagboek en waterinname.
          </p>
        </Link>

        <Link
          href="/profiel"
          className="group block p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-500/50 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <User className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            Profiel & Metingen
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lichaamsgewicht, BMR/TDEE berekeningen en back-up beheer.
          </p>
        </Link>
      </section>
    </div>
  );
}
