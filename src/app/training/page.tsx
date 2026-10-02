import { Dumbbell, Plus, Play, History } from "lucide-react";

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-emerald-500" />
            Krachttraining
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Beheer schema&apos;s, log sets en volg progressieve overload.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              Workout Starten
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Start een lege sessie of kies een bestaande routine uit je schema&apos;s.
            </p>
          </div>
          <button
            type="button"
            className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Training
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-3">
              <History className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              Geschiedenis &amp; PR&apos;s
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bekijk eerdere trainingslogs, volume-analyses en persoonlijke records.
            </p>
          </div>
          <div className="mt-6 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Nog geen trainingen gelogd
          </div>
        </div>
      </div>
    </div>
  );
}
