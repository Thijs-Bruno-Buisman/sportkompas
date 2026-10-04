"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Activity,
  Utensils,
  Droplets,
  Scale,
  Flame,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Heart,
  Moon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Profile } from "@/types/database";
import type { DailyCockpitSummary } from "@/domain/home/cockpit";
import { addDaysToDateString, getLocalDateString } from "@/domain/dates/calendar";
import { QuickWeightModal } from "./QuickWeightModal";

interface HomeCockpitDashboardProps {
  summary: DailyCockpitSummary;
  selectedDate: string;
  onDateChange: (date: string) => void;
  profile: Profile | null;
  isDemoMode: boolean;
  onAddWater: (amountMl: number) => Promise<void>;
  onLogWeight: (weightKg: number, notes?: string) => Promise<void>;
  onToggleDemoMode: (active: boolean) => void;
}

export function HomeCockpitDashboard({
  summary,
  selectedDate,
  onDateChange,
  profile,
  isDemoMode,
  onAddWater,
  onLogWeight,
  onToggleDemoMode,
}: HomeCockpitDashboardProps) {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [waterToast, setWaterToast] = useState<string | null>(null);

  const todayStr = getLocalDateString();
  const isViewingToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    onDateChange(addDaysToDateString(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(addDaysToDateString(selectedDate, 1));
  };

  const handleTodayClick = () => {
    onDateChange(todayStr);
  };

  const handleQuickWater = async (amount: number) => {
    await onAddWater(amount);
    setWaterToast(`+${amount} ml toegevoegd!`);
    setTimeout(() => {
      setWaterToast(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER COCKPIT & DATUM SELECTOR */}
      <Card className="border-emerald-500/20 bg-linear-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl shadow-md shadow-emerald-500/20 shrink-0">
                🧭
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                  {summary.greeting}, {profile?.name || "Sporter"}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Centrale Cockpit • {isViewingToday ? "Vandaag" : "Historische Dag"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDemoMode ? (
                <Badge variant="warning">Demomodus Actief</Badge>
              ) : (
                <Badge variant="success">100% Offline-first</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Datumkiezer balk */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevDay}
                className="h-8 w-8 p-0"
                title="Vorige dag"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                {isViewingToday && (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-sm">
                    Vandaag
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDay}
                className="h-8 w-8 p-0"
                title="Volgende dag"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {!isViewingToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTodayClick}
                  className="h-8 text-xs font-medium ml-1 text-emerald-600 dark:text-emerald-400"
                >
                  Terug naar Vandaag
                </Button>
              )}
            </div>

            {/* Dagsamenvatting completion badge */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Dagvoortgang:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${summary.dayCompletionScore}%` }}
                  />
                </div>
                <span>{summary.dayCompletionScore}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. ENERGIE- & CALORIEBALANS KAART (CENTRAAL) */}
      <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Energie- &amp; Caloriebalans
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Netto energie = calorie-inname minus cardio-verbranding.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                summary.energyBalanceStatus === "deficit"
                  ? "default"
                  : summary.energyBalanceStatus === "surplus"
                  ? "warning"
                  : "success"
              }
            >
              {summary.energyBalanceStatus === "deficit"
                ? "Calorie Deficit (Afvallen)"
                : summary.energyBalanceStatus === "surplus"
                ? "Calorie Surplus (Aankomen)"
                : "Op Onderhoud (Stabiel)"}
            </Badge>
          </div>
        </div>

        {/* 4 Balans Indicatoren */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 mb-4">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Inname</span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {summary.caloriesConsumed}{" "}
              <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium">Cardio Verbrand</span>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {summary.cardioCaloriesBurned > 0 ? `-${summary.cardioCaloriesBurned}` : "0"}{" "}
              <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium">Netto Calorieën</span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {summary.netCalories}{" "}
              <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium">Resterend Budget</span>
            <div
              className={`text-lg font-bold ${
                summary.calorieBudgetRemaining >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {summary.calorieBudgetRemaining > 0 ? "+" : ""}
              {summary.calorieBudgetRemaining}{" "}
              <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
          </div>
        </div>

        {/* Voortgangsbalk Calorieën */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              Inname: <strong>{summary.caloriesConsumed} kcal</strong> van streefdoel{" "}
              <strong>{summary.targetCalories} kcal</strong>
            </span>
            <span className="font-semibold">{summary.calorieProgressPercentage}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.calorieProgressPercentage > 110
                  ? "bg-amber-500"
                  : summary.calorieProgressPercentage >= 90
                  ? "bg-emerald-500"
                  : "bg-sky-500"
              }`}
              style={{ width: `${Math.min(100, summary.calorieProgressPercentage)}%` }}
            />
          </div>
        </div>

        {/* Macro Verdeling Snapshot */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
              <span>Eiwit</span>
              <span>{Math.round((summary.proteinConsumedGrams / summary.targetProteinGrams) * 100)}%</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              {summary.proteinConsumedGrams}g{" "}
              <span className="text-[10px] font-normal text-slate-400">/ {summary.targetProteinGrams}g</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/40">
            <div className="text-[11px] text-sky-800 dark:text-sky-300 font-semibold flex items-center justify-between">
              <span>Koolhydraten</span>
              <span>{Math.round((summary.carbsConsumedGrams / summary.targetCarbsGrams) * 100)}%</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              {summary.carbsConsumedGrams}g{" "}
              <span className="text-[10px] font-normal text-slate-400">/ {summary.targetCarbsGrams}g</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40">
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-between">
              <span>Vetten</span>
              <span>{Math.round((summary.fatConsumedGrams / summary.targetFatGrams) * 100)}%</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              {summary.fatConsumedGrams}g{" "}
              <span className="text-[10px] font-normal text-slate-400">/ {summary.targetFatGrams}g</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. SNELLE ACTIES BALK ("QUICK ACTIONS") */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Direct Vastleggen
          </span>
          {waterToast && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              {waterToast}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Water 250ml */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickWater(250)}
            className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40"
          >
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            + Glas water (250 ml)
          </Button>

          {/* Quick Water 500ml */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickWater(500)}
            className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40"
          >
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            + Fles water (500 ml)
          </Button>

          {/* Quick Weight */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWeightModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-500" />
            Gewicht noteren
          </Button>

          {/* Naar Voeding */}
          <Link href="/voeding">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              Maaltijd loggen
            </Button>
          </Link>

          {/* Naar Cardio Live */}
          <Link href="/cardio">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Cardio starten
            </Button>
          </Link>

          {/* Naar Krachttraining */}
          <Link href="/training">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
              Workout starten
            </Button>
          </Link>
        </div>
      </div>

      {/* 4. DE VIER PIJLERS GRID (VANDAAG ACTIVITEIT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pijler 1: Krachttraining */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Krachttraining
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Dumbbell className="w-4 h-4" />
              </div>
            </div>

            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {summary.workoutTitle}
            </div>

            <div className="mt-1 text-xs">
              {summary.workoutState === "actief" ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Play className="w-3 h-3 animate-pulse" /> Training is actief!
                </span>
              ) : summary.workoutState === "afgerond" ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sessie voltooid
                </span>
              ) : summary.workoutState === "gepland" ? (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Gepland voor vandaag
                </span>
              ) : summary.workoutState === "rustdag" ? (
                <span className="text-slate-500 font-medium">Hersteldag</span>
              ) : (
                <span className="text-slate-400 italic">Geen schema actief</span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link href="/training">
              <Button
                variant={summary.workoutState === "actief" ? "primary" : "outline"}
                size="sm"
                className="w-full text-xs font-semibold"
              >
                {summary.workoutState === "actief"
                  ? "Hervat Training"
                  : summary.workoutState === "gepland"
                  ? "Start Workout"
                  : "Naar Training"}
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pijler 2: Cardio */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Cardio &amp; Duursport
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {summary.cardioSessionsCount > 0 ? (
                <>
                  {summary.cardioDistanceKm} km{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({summary.cardioDurationMinutes} min)
                  </span>
                </>
              ) : (
                "Geen cardio vandaag"
              )}
            </div>

            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {summary.cardioCaloriesBurned > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {summary.cardioCaloriesBurned} kcal verbrand
                </span>
              ) : (
                "Log duurtraining of loop live"
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link href="/cardio">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                {summary.cardioSessionsCount > 0 ? "Bekijk Cardio" : "Start Cardio"}
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pijler 3: Voeding & Macro's */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Voedingsinname
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Utensils className="w-4 h-4" />
              </div>
            </div>

            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {summary.caloriesConsumed > 0 ? (
                <>
                  {summary.caloriesConsumed}{" "}
                  <span className="text-xs font-normal text-slate-500">/ {summary.targetCalories} kcal</span>
                </>
              ) : (
                "Nog geen maaltijden"
              )}
            </div>

            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {summary.mealCount > 0 ? (
                <span>
                  {summary.proteinConsumedGrams}g eiwit • {summary.mealCount} maaltijden
                </span>
              ) : (
                "Log ontbijt, lunch of diner"
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link href="/voeding">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                Naar Dagboek
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pijler 4: Hydratatie & Lichaam */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Vocht &amp; Lichaam
              </span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Droplets className="w-4 h-4" />
              </div>
            </div>

            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {summary.waterConsumedMl}{" "}
              <span className="text-xs font-normal text-slate-500">
                / {summary.targetWaterMl} ml
              </span>
            </div>

            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{summary.waterProgressPercentage}% van doel</span>
              {summary.latestWeightKg && (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {summary.latestWeightKg} kg
                </span>
              )}
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all"
                style={{ width: `${summary.waterProgressPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickWater(250)}
              className="flex-1 text-xs font-semibold py-1 h-8"
              title="+250 ml water"
            >
              +250 ml
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWeightModalOpen(true)}
              className="flex-1 text-xs font-semibold py-1 h-8"
              title="Gewicht noteren"
            >
              Wegen
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Weight Modal */}
      <QuickWeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onSaveWeight={onLogWeight}
        calendarDate={selectedDate}
        initialWeight={summary.latestWeightKg}
      />
    </div>
  );
}

