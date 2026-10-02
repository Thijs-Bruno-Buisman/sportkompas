import { Utensils, Plus, Droplets, PieChart } from "lucide-react";

export default function VoedingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-500" />
            Voeding &amp; Macro&apos;s
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log maaltijden, bewaak eiwitten en registreer waterinname.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <PieChart className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              Dagelijks Dagboek
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ontbijt, lunch, diner en snacks toevoegen aan je dagbalans.
            </p>
          </div>
          <button
            type="button"
            className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Maaltijd Loggen
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
              <Droplets className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              Waterinname
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Houd je dagelijkse hydratatie bij met snelle toevoegknoppen.
            </p>
          </div>
          <div className="mt-6 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            0 / 2500 ml gedronken vandaag
          </div>
        </div>
      </div>
    </div>
  );
}
