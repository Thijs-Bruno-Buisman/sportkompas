import { Activity, Plus, Timer, Footprints } from "lucide-react";

export default function CardioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Cardio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Houd duursporten, kilometers, tempo en calorieverbruik bij.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <Timer className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              Sessie Registreren
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Voer een voltooide loop-, fiets- of roeisessie handmatig in of start de stopwatch.
            </p>
          </div>
          <button
            type="button"
            className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Sessie Toevoegen
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-3">
              <Footprints className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              Weektotalen & Tempo
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bekijk cumulatieve afstanden en gemiddelde snelheden per sport.
            </p>
          </div>
          <div className="mt-6 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            0.0 km geregistreerd deze week
          </div>
        </div>
      </div>
    </div>
  );
}

