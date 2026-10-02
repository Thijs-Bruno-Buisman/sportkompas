"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getLocalDateString,
  formatFriendlyDate,
  parseLocalDate,
} from "@/domain/dates/calendar";
import { MoveSessionDialog } from "./MoveSessionDialog";
import type {
  ScheduledSession,
  PlannedExerciseInDay,
  WorkoutRoutine,
  RoutineDay,
} from "@/types/database";
import {
  Play,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Sparkles,
  FastForward,
  RotateCcw,
  Layers,
  ArrowRight,
  Coffee,
} from "lucide-react";

interface TodaySessionData extends ScheduledSession {
  routineName: string;
  routineDayName: string;
  exerciseCount: number;
  plannedExercises: PlannedExerciseInDay[];
}

export function TodayTrainingCard() {
  const router = useRouter();
  const { repositories, isDemoMode, dataVersion, refreshData } = useDatabase();

  const [todaySession, setTodaySession] = useState<TodaySessionData | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<{
    routine: WorkoutRoutine;
    days: RoutineDay[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  // Gebruik de veilige lokale datumfunctie (voorkomt UTC midnight bugs)
  const todayStr = getLocalDateString();

  const loadTodayData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [session, routine] = await Promise.all([
        repositories.workout.getScheduledSessionForDate(todayStr),
        repositories.workout.getActiveRoutine(),
      ]);
      setTodaySession(session);
      setActiveRoutine(routine);
    } catch (err) {
      console.error("Fout bij laden van training van vandaag:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, todayStr]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData, isDemoMode, dataVersion]);

  const handleStartTodayWorkout = async () => {
    if (!todaySession) return;
    setIsStarting(true);
    try {
      await repositories.workout.startWorkoutFromScheduledSession(todaySession.id);
      refreshData();
      router.push("/training?tab=sessies");
    } catch (err) {
      console.error("Fout bij starten van workout van vandaag:", err);
      setIsStarting(false);
    }
  };

  const handleSkipToday = async () => {
    if (!todaySession) return;
    try {
      await repositories.workout.skipScheduledSession(todaySession.id);
      refreshData();
    } catch (err) {
      console.error("Fout bij overslaan:", err);
    }
  };

  const handleUnskipToday = async () => {
    if (!todaySession) return;
    try {
      await repositories.workout.unskipScheduledSession(todaySession.id);
      refreshData();
    } catch (err) {
      console.error("Fout bij herstellen:", err);
    }
  };

  const handleMoveToday = async (sessionId: string, newDate: string) => {
    try {
      await repositories.workout.moveScheduledSession(sessionId, newDate);
      refreshData();
    } catch (err) {
      console.error("Fout bij verplaatsen:", err);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-5 border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded-md w-1/3"></div>
          <div className="h-6 bg-muted rounded-md w-1/2"></div>
        </div>
      </Card>
    );
  }

  // 1. Geval: Er is een geplande training voor vandaag
  if (todaySession && todaySession.status === "gepland") {
    return (
      <>
        <Card className="p-5 border-emerald-500/30 bg-linear-to-br from-card to-emerald-50/20 dark:to-emerald-950/20 shadow-sm ring-1 ring-emerald-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Vandaag Gepland
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {todaySession.routineName} {todaySession.routineVersion ? `v${todaySession.routineVersion}` : ""}
                </span>
              </div>

              <h3 className="text-xl font-bold text-foreground">
                {todaySession.routineDayName}
              </h3>

              <p className="text-xs text-muted-foreground">
                {todaySession.exerciseCount} geplande oefeningen:{" "}
                <span className="font-medium text-foreground">
                  {todaySession.plannedExercises?.map((e) => e.exerciseName).slice(0, 3).join(", ")}
                  {todaySession.exerciseCount > 3 ? ` en ${todaySession.exerciseCount - 3} meer...` : ""}
                </span>
              </p>
            </div>

            {/* Startknop en acties */}
            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <Button
                variant="primary"
                size="md"
                onClick={handleStartTodayWorkout}
                disabled={isStarting}
                className="min-h-[48px] px-6 text-sm font-semibold shadow-md shadow-emerald-500/20"
                title="Start de geplande workout voor vandaag"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                {isStarting ? "Starten..." : "Start Training"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMoveOpen(true)}
                className="min-h-[48px] text-xs px-3"
                title="Verplaats deze training naar een andere datum"
              >
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Verplaatsen
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipToday}
                className="min-h-[48px] text-xs px-3 text-muted-foreground hover:text-foreground"
                title="Sla deze sessie over"
              >
                <FastForward className="w-3.5 h-3.5 mr-1" />
                Overslaan
              </Button>
            </div>
          </div>
        </Card>

        <MoveSessionDialog
          isOpen={isMoveOpen}
          onClose={() => setIsMoveOpen(false)}
          session={todaySession}
          onMove={handleMoveToday}
        />
      </>
    );
  }

  // 2. Geval: De training van vandaag is al afgerond
  if (todaySession && todaySession.status === "afgerond") {
    return (
      <Card className="p-5 border-emerald-500/40 bg-emerald-500/5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-base">
                  Training Vandaag Voltooid! 🎉
                </h3>
                <Badge variant="success" className="text-[10px]">
                  Afgerond
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Je hebt {todaySession.routineDayName} ({todaySession.routineName}) succesvol voltooid.
              </p>
            </div>
          </div>

          <Link href="/training?tab=sessies">
            <Button variant="outline" size="sm" className="min-h-[40px] text-xs">
              Bekijk Workouts
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // 3. Geval: De training van vandaag is gemarkeerd als overgeslagen
  if (todaySession && todaySession.status === "overgeslagen") {
    return (
      <Card className="p-4 border-border bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Training voor vandaag overgeslagen
              </span>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Overgeslagen
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {todaySession.routineDayName} ({todaySession.routineName}) stond op de planning.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleUnskipToday}
            className="min-h-[40px] text-xs self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            Toch Trainen (Herstellen)
          </Button>
        </div>
      </Card>
    );
  }

  // 4. Geval: Vandaag is een rustdag (geen sessie ingepland) maar er is wel een actief schema
  if (activeRoutine) {
    return (
      <Card className="p-4 border-border/80 bg-card shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  Vandaag is een rustdag 🧘
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {activeRoutine.routine.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Geen training ingepland voor vandaag. Goed herstel en voeding zijn essentieel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/training?tab=planning">
              <Button variant="outline" size="sm" className="min-h-[40px] text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Weekplanning
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // 5. Geval: Nog geen enkel schema actief
  return (
    <Card className="p-4 border-border/80 bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground">
              Stel je trainingsplanning in
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kies een actief trainingsschema om automatisch je week in te plannen.
            </p>
          </div>
        </div>

        <Link href="/training?tab=schemas">
          <Button variant="primary" size="sm" className="min-h-[40px] text-xs self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Kies Actief Schema
          </Button>
        </Link>
      </div>
    </Card>
  );
}
