"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Dumbbell,
  Activity,
  Utensils,
  Scale,
  Layers,
  Calendar,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  BodyMeasurement,
  Exercise,
} from "@/types/database";
import {
  searchUniversalHistory,
  type UniversalCategory,
  type DateFilterPeriod,
  type UniversalSearchResult,
} from "@/domain/home/universalSearch";

interface UniversalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workoutSessions: WorkoutSession[];
  workoutSets?: WorkoutSet[];
  exercises?: Exercise[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  measurements: BodyMeasurement[];
  referenceDate?: string;
}

export function UniversalSearchDialog({
  isOpen,
  onClose,
  workoutSessions,
  workoutSets = [],
  exercises = [],
  cardioSessions,
  mealLogs,
  measurements,
  referenceDate,
}: UniversalSearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<UniversalCategory>("alle");
  const [datePeriod, setDatePeriod] = useState<DateFilterPeriod>("alle");

  // Focus input bij openen
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
      setCategory("alle");
      setDatePeriod("alle");
    }
  }, [isOpen]);

  // Resultaten berekenen via pure domeinzoekfunctie
  const results = useMemo(() => {
    return searchUniversalHistory({
      query,
      category,
      datePeriod,
      referenceDate,
      workoutSessions,
      workoutSets,
      exercises,
      cardioSessions,
      mealLogs,
      measurements,
    });
  }, [
    query,
    category,
    datePeriod,
    referenceDate,
    workoutSessions,
    workoutSets,
    exercises,
    cardioSessions,
    mealLogs,
    measurements,
  ]);

  const handleSelectResult = (result: UniversalSearchResult) => {
    onClose();
    router.push(result.targetUrl);
  };

  const getCategoryIcon = (cat: UniversalSearchResult["category"]) => {
    switch (cat) {
      case "kracht":
        return <Dumbbell className="w-4 h-4 text-emerald-500" />;
      case "cardio":
        return <Activity className="w-4 h-4 text-amber-500" />;
      case "voeding":
        return <Utensils className="w-4 h-4 text-sky-500" />;
      case "meting":
        return <Scale className="w-4 h-4 text-purple-500" />;
    }
  };

  const getCategoryBadgeVariant = (cat: UniversalSearchResult["category"]): "success" | "warning" | "default" => {
    switch (cat) {
      case "kracht":
        return "success";
      case "cardio":
        return "warning";
      case "voeding":
      case "meting":
        return "default";
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Universeel Zoeken"
      description="Doorzoek al je trainingen, cardio, maaltijden en metingen"
      maxWidth="xl"
    >
      <div className="space-y-4 -mt-1">
        {/* 1. ZOEK INVOERBALK */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op oefening, gerecht, cardio, gewicht..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. CATEGORIE & DATUM FILTERS */}
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Categorie chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory("alle")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                category === "alle"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              Alles
            </button>
            <button
              onClick={() => setCategory("kracht")}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                category === "kracht"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Kracht
            </button>
            <button
              onClick={() => setCategory("cardio")}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                category === "cardio"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Cardio
            </button>
            <button
              onClick={() => setCategory("voeding")}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                category === "voeding"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              Voeding
            </button>
            <button
              onClick={() => setCategory("meting")}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                category === "meting"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Metingen
            </button>
          </div>

          {/* Datum filter selectie */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Periode:</span>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value as DateFilterPeriod)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="alle">Alle tijden</option>
              <option value="7d">Laatste 7 dagen</option>
              <option value="30d">Laatste 30 dagen</option>
              <option value="90d">Laatste 90 dagen</option>
              <option value="365d">Afgelopen jaar</option>
            </select>
          </div>
        </div>

        {/* 3. RESULTATENLIJST */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={`${item.category}-${item.id}`}
                onClick={() => handleSelectResult(item)}
                className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <Badge variant={getCategoryBadgeVariant(item.category)} className="text-[10px] py-0 px-1.5 uppercase">
                        {item.category}
                      </Badge>
                      {item.metaBadge && (
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          • {item.metaBadge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>

                    {item.matchSnippet && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-1 italic">
                        {item.matchSnippet}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 font-medium">
                    {item.formattedDate}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Geen resultaten gevonden
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {query
                  ? `Er zijn geen activiteiten gevonden die overeenkomen met "${query}".`
                  : "Er zijn nog geen activiteiten geregistreerd binnen dit filter."}
              </p>
            </div>
          )}
        </div>

        {/* 4. FOOTER */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 px-4">
          <span>
            {results.length} {results.length === 1 ? "activiteit" : "activiteiten"} gevonden
          </span>
          <span className="text-[11px] text-slate-400">
            Klik op een resultaat om direct naar de betreffende pagina te gaan
          </span>
        </div>
      </div>
    </Dialog>
  );
}
