"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Activity,
  Utensils,
  User,
  ArrowRight,
  Sparkles,
  Droplets,
  Trophy,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDatabase } from "@/lib/db";
import { useProfile } from "@/lib/hooks/useProfile";
import { TodayTrainingCard } from "@/components/modules/planning/TodayTrainingCard";
import { getLocalDateString } from "@/domain/dates/calendar";
import type { MealLog, WorkoutSession, CardioSession } from "@/types/database";

export default function HomePage() {
  const { repositories, isDemoMode, dataVersion, toggleDemoMode } = useDatabase();
  const { profile } = useProfile();

  const [todayMeals, setTodayMeals] = useState<MealLog[]>([]);
  const [todayWaterMl, setTodayWaterMl] = useState<number>(0);
  const [recentWorkout, setRecentWorkout] = useState<WorkoutSession | null>(null);
  const [recentCardio, setRecentCardio] = useState<CardioSession | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const todayStr = getLocalDateString();

  useEffect(() => {
    let isCancelled = false;
    async function loadCockpitData() {
      setIsLoadingData(true);
      try {
        const meals = await repositories.nutrition.getMealsByDate(todayStr);
        const waterLogs = await repositories.nutrition.getWaterLogsByDate(todayStr);
        const totalWater = waterLogs.reduce((sum: number, w) => sum + w.amountMl, 0);

        const allSessions = await repositories.workout.sessions.getAll();
        const latestWorkout = allSessions.length > 0 ? allSessions[allSessions.length - 1] : null;

        const allCardio = await repositories.cardio.getAll();
        const latestCardio = allCardio.length > 0 ? allCardio[allCardio.length - 1] : null;

        if (!isCancelled) {
          setTodayMeals(meals);
          setTodayWaterMl(totalWater);
          setRecentWorkout(latestWorkout);
          setRecentCardio(latestCardio);
        }
      } catch (err) {
        console.error("Fout bij laden van cockpit data:", err);
      } finally {
        if (!isCancelled) setIsLoadingData(false);
      }
    }

    loadCockpitData();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isDemoMode, dataVersion, todayStr]);

  const totalCalories = todayMeals.reduce((acc, m) => acc + m.totalCalories, 0);
  const totalProtein = Math.round(todayMeals.reduce((acc, m) => acc + m.totalProteinGrams, 0));

  const hasActivityToday =
    todayMeals.length > 0 ||
    todayWaterMl > 0 ||
    recentWorkout?.calendarDate === todayStr ||
    recentCardio?.calendarDate === todayStr;

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
                <CardTitle className="text-xl sm:text-2xl">
                  {profile?.name ? `Welkom terug, ${profile.name}` : "SportKompas Cockpit"}
                </CardTitle>
                <CardDescription>
                  {isDemoMode
                    ? "Voorbeeldmodus actief — Alle getoonde data is afkomstig uit SportKompasDemoDB."
                    : "Jouw persoonlijke, rustige trainings- en gezondheidshub."}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDemoMode ? (
                <Badge variant="warning">Demomodus</Badge>
              ) : (
                <Badge variant="success">100% Offline-first</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isDemoMode ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              {isDemoMode ? "SportKompasDemoDB actief" : "SportKompasDB actief"}
            </span>
            <span>&bull;</span>
            <span>Geen externe cloud vereist</span>
            <span>&bull;</span>
            <span>Volledige privacy</span>
          </div>
        </CardContent>
      </Card>

      {/* Vandaag Activiteit Overzicht */}
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

        {/* Geplande Training van Vandaag Widget */}
        <TodayTrainingCard />

        {hasActivityToday ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Voeding Vandaag */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Voeding Inname</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {totalProtein}g eiwit &bull; {todayMeals.length} maaltijden
              </p>
            </Card>

            {/* Water Vandaag */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hydratatie</span>
                <Droplets className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {todayWaterMl} <span className="text-xs font-normal text-slate-400">/ 2500 ml</span>
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (todayWaterMl / 2500) * 100)}%` }}
                />
              </div>
            </Card>

            {/* Laatste Krachttraining */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Krachttraining</span>
                <Dumbbell className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                {recentWorkout ? (recentWorkout.snapshot.routineDayName || recentWorkout.snapshot.routineName || "Workout") : "Geen recente sessie"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {recentWorkout ? `${recentWorkout.calendarDate} &bull; Voltooid` : "Start je eerste training"}
              </p>
            </Card>

            {/* Laatste Cardio / Prestatie */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cardio</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {recentCardio
                  ? `${(recentCardio.distanceMeters / 1000).toFixed(1)} km ${recentCardio.activityType}`
                  : "Nog geen cardio"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {recentCardio ? `${Math.round(recentCardio.durationSeconds / 60)} min &bull; ${recentCardio.estimatedCaloriesBurned ?? 0} kcal` : "Log je eerste duurtraining"}
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyState
              icon={<Sparkles className="w-6 h-6" />}
              title="Nog geen activiteit gelogd vandaag"
              description="Je persoonlijke database is schoon en leeg. Maak je eerste schema of leg direct je training of voeding vast."
              actionLabel="Maak je eerste schema"
              actionHref="/training"
              secondaryAction={
                <Link href="/voeding">
                  <Button variant="outline">Voeding Invoeren</Button>
                </Link>
              }
            />

            {/* Demomodus uitnodiging in echte lege toestand */}
            {!isDemoMode && (
              <Card className="border-dashed border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        SportKompas eerst uitproberen?
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Schakel met één klik over naar Demomodus om alle functionaliteiten, schema&apos;s, PR&apos;s en analyses te verkennen met realistische voorbeelddata. Je echte database blijft 100% gescheiden.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => toggleDemoMode(true)}
                  >
                    Verken met Demomodus
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
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
                    Gewichtslogboek, TDEE/BMR calculaties, themainstellingen en demomodus beheer.
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
