import { User, Scale, Settings, Database } from "lucide-react";

export default function ProfielPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-500" />
            Profiel & Instellingen
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Beheer persoonlijke gegevens, gewichtsverloop en lokale data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            Lichaamsgewicht & Metingen
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Volg je gewichtsontwikkeling, streefgewicht en omtrekken.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Stel je startparameters in bij de profielconfiguratie (Stap 06).
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            Data-soevereiniteit & Back-up
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Alle data blijft lokaal in je browser. Exporteer of herstel met één klik.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Lokale IndexedDB actief
          </div>
        </div>
      </div>
    </div>
  );
}

