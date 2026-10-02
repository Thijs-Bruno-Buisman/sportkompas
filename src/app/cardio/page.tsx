"use client";

import React, { useState, useEffect } from "react";
import { Activity, Plus, Timer, Footprints, Flame, Bike, Heart, Waves, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useDatabase } from "@/lib/db";
import type { CardioSession } from "@/types/database";

export default function CardioPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState<CardioSession["activityType"]>("hardlopen");
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;
    async function loadCardio() {
      setIsLoading(true);
      try {
        const all = await repositories.cardio.getAll();
        if (!isCancelled) {
          setSessions(all.reverse()); // Meest recent bovenaan
        }
      } catch (err) {
        console.error("Fout bij laden van cardio data:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    loadCardio();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isDemoMode, dataVersion]);

  // Bereken dynamische weektotalen vanuit de actieve database
  const stats = React.useMemo(() => {
    const totalMeters = sessions.reduce((acc, s) => acc + s.distanceMeters, 0);
    const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalCalories = sessions.reduce((acc, s) => acc + (s.estimatedCaloriesBurned ?? 0), 0);

    return {
      distanceKm: (totalMeters / 1000).toFixed(1),
      durationMin: Math.round(totalSeconds / 60),
      caloriesKcal: Math.round(totalCalories),
    };
  }, [sessions]);

  const handleSaveCardio = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDist = Number(distanceKm.replace(",", "."));
    const parsedDur = Number(durationMin.replace(",", "."));
    const parsedHr = avgHeartRate ? Number(avgHeartRate) : null;

    if (!distanceKm || isNaN(parsedDist) || parsedDist <= 0) {
      setErrorMessage("Voer een geldige positieve afstand in kilometers in.");
      return;
    }
    if (!durationMin || isNaN(parsedDur) || parsedDur <= 0) {
      setErrorMessage("Voer een geldige duur in minuten in.");
      return;
    }

    try {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      // Ruwe calorie-inschatting via MET factor
      const met = activityType === "hardlopen" ? 9.8 : activityType === "fietsen" ? 7.5 : 7.0;
      const estimatedCalories = Math.round(met * (parsedDur / 60) * 75);

      const newSession: CardioSession = {
        id: crypto.randomUUID(),
        calendarDate: todayStr,
        startTime: now.toISOString(),
        endTime: null,
        activityType,
        distanceMeters: Math.round(parsedDist * 1000), // Canonieke meters
        durationSeconds: Math.round(parsedDur * 60), // Canonieke seconden
        avgHeartRateBpm: parsedHr,
        maxHeartRateBpm: parsedHr ? parsedHr + 15 : null,
        estimatedCaloriesBurned: estimatedCalories,
        elevationGainMeters: null,
        rpe: 7,
        notes: "Handmatig gelogde sessie",
        provenance: { source: isDemoMode ? "demo" : "user", isDemo: isDemoMode },
      };

      await repositories.cardio.save(newSession);
      setSessions((prev) => [newSession, ...prev]);

      setErrorMessage("");
      setIsDialogOpen(false);
      setDistanceKm("");
      setDurationMin("");
      setAvgHeartRate("");
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij opslaan van cardio sessie");
    }
  };

  const getActivityIcon = (type: CardioSession["activityType"]) => {
    switch (type) {
      case "hardlopen":
        return <Footprints className="w-5 h-5 text-emerald-500" />;
      case "fietsen":
        return <Bike className="w-5 h-5 text-sky-500" />;
      case "zwemmen":
        return <Waves className="w-5 h-5 text-cyan-500" />;
      case "roeien":
        return <Activity className="w-5 h-5 text-amber-500" />;
      default:
        return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Cardio &amp; Conditie
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Houd duursporten, kilometers, tempo en calorieën bij.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Sessie Loggen
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activiteiten">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="activiteiten">
            Sessies ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="statistieken">Statistieken</TabsTrigger>
        </TabsList>

        <TabsContent value="activiteiten" className="space-y-4">
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => {
                const km = (session.distanceMeters / 1000).toFixed(2);
                const min = Math.round(session.durationSeconds / 60);
                const paceMinPerKm = (session.durationSeconds / 60) / (session.distanceMeters / 1000);
                const paceMinutes = Math.floor(paceMinPerKm);
                const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60);
                const formattedPace = `${paceMinutes}:${String(paceSeconds).padStart(2, "0")} /km`;

                return (
                  <Card key={session.id} className="p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                          {getActivityIcon(session.activityType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base capitalize text-slate-900 dark:text-white">
                              {session.activityType}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {km} km
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {session.calendarDate} &bull; {min} min &bull; Tempo: {formattedPace}
                            {session.avgHeartRateBpm && ` &bull; ${session.avgHeartRateBpm} bpm`}
                          </p>
                          {session.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                              &ldquo;{session.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {session.estimatedCaloriesBurned && (
                          <div className="text-right">
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5" />
                              {session.estimatedCaloriesBurned} kcal
                            </span>
                          </div>
                        )}
                        <Badge variant="outline" className="text-[11px]">
                          {session.provenance.source === "demo" ? "Demodata" : "Echt"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Timer className="w-6 h-6" />}
              title="Nog geen cardio gelogd"
              description="Je hebt nog geen duursessies geregistreerd in deze database. Voer direct een voltooide training in."
              actionLabel="Sessie Toevoegen"
              onAction={() => setIsDialogOpen(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="statistieken" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Totale Afstand
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.distanceKm} <span className="text-sm font-normal text-slate-400">km</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Berekend uit {sessions.length} opgeslagen {sessions.length === 1 ? "sessie" : "sessies"}
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tijd in beweging
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.durationMin} <span className="text-sm font-normal text-slate-400">min</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {(stats.durationMin / 60).toFixed(1)} uur duursport
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Calorieverbruik
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.caloriesKcal} <span className="text-sm font-normal text-slate-400">kcal</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Schatting op basis van MET-factoren
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog voor handmatige sessie */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setErrorMessage("");
        }}
        title="Cardiosessie Registreren"
        description="Voer de gegevens in van je voltooide duurtraining."
      >
        <form onSubmit={handleSaveCardio} className="space-y-4">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          <FormField id="activity-type" label="Sport / Activiteit" required>
            <Select
              id="activity-type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as CardioSession["activityType"])}
            >
              <option value="hardlopen">Hardlopen (Buiten / Baan)</option>
              <option value="fietsen">Wielrennen / Fietsen</option>
              <option value="crosstrainer">Loopband / Crosstrainer (Binnen)</option>
              <option value="roeien">Roeier (Ergometer)</option>
              <option value="wandelen">Wandelen</option>
              <option value="zwemmen">Zwemmen</option>
            </Select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="distance-km"
              label="Afstand (km)"
              required
              helperText="Bijv. 5.2 of 5,2"
            >
              <Input
                id="distance-km"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                hasError={Boolean(errorMessage && !distanceKm)}
              />
            </FormField>

            <FormField
              id="duration-min"
              label="Duur (minuten)"
              required
              helperText="Bijv. 28"
            >
              <Input
                id="duration-min"
                type="number"
                step="1"
                min="1"
                inputMode="numeric"
                placeholder="30"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                hasError={Boolean(errorMessage && !durationMin)}
              />
            </FormField>
          </div>

          <FormField
            id="heart-rate"
            label="Gemiddelde Hartslag (optioneel)"
            helperText="Slagen per minuut (bpm)"
          >
            <Input
              id="heart-rate"
              type="number"
              step="1"
              min="40"
              max="220"
              inputMode="numeric"
              placeholder="Bijv. 145"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDialogOpen(false);
                setErrorMessage("");
              }}
            >
              Annuleren
            </Button>
            <Button type="submit">
              Opslaan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
