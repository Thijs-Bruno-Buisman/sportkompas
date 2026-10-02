"use client";

import Link from "next/link";
import { Dumbbell, Activity, Utensils, User, ArrowRight, Compass, Sparkles, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Header Cockpit Card */}
      <Card className="border-emerald-500/20 bg-linear-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20">
        <CardHeader className="border-b-0 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl shadow-md shadow-emerald-500/20 shrink-0">
                🧭
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">SportKompas Cockpit</CardTitle>
                <CardDescription>
                  Jouw persoonlijke, rustige trainings- en gezondheidshub.
                </CardDescription>
              </div>
            </div>
            <Badge variant="success">100% Offline-first</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Lokale IndexedDB actief
            </span>
            <span>&bull;</span>
            <span>Geen accounts of externe cloud vereist</span>
            <span>&bull;</span>
            <span>Volledige privacy</span>
          </div>
        </CardContent>
      </Card>

      {/* Vandaag Activiteit Overzicht (Eerlijke lege toestand conform richtlijnen) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Vandaag
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>

        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title="Nog geen activiteit gelogd vandaag"
          description="Kies een van de modules om direct je krachttraining, een cardio-sessie of je voeding vast te leggen."
          actionLabel="Start Krachttraining"
          actionHref="/training"
          secondaryAction={
            <Link href="/voeding">
              <Button variant="outline">Voeding Invoeren</Button>
            </Link>
          }
        />
      </section>

      {/* De Vier Kernmodules Navigatie */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Krachttraining */}
          <Link href="/training" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Krachttraining
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Sessies loggen met grote knoppen, rusttimers, 1RM schatting en PR-detectie.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Cardio */}
          <Link href="/cardio" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Cardio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Hardlopen, wielrennen en roeien met tempo min/km, afstanden en hartslagzones.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Voeding */}
          <Link href="/voeding" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Voeding &amp; Macro&apos;s
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Calorieën, eiwitten en waterinname bijhouden voor optimale prestaties en herstel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Profiel & Metingen */}
          <Link href="/profiel" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Profiel &amp; Metingen
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Gewichtslogboek, TDEE/BMR calculaties, themainstellingen en back-up beheer.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}

