"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  type WorkoutSession,
  type WorkoutSet,
  type WorkoutExerciseSnapshot,
  type Exercise,
} from "@/types/database";
import { useDatabase } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  Play,
  Pause,
  Check,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  History,
  Timer as TimerIcon,
  Flame,
} from "lucide-react";
import { ExerciseSelectorDialog } from "../routines/ExerciseSelectorDialog";
import { ExitWorkoutDialog } from "./ExitWorkoutDialog";
import { FinishWorkoutDialog } from "./FinishWorkoutDialog";
import { formatFriendlyDate } from "@/domain/dates/calendar";

interface ActiveWorkoutTrackerProps {
  session: WorkoutSession;
  onExit: () => void;
  onFinished: (sessionId: string) => void;
}

export function ActiveWorkoutTracker({
  session: initialSession,
  onExit,
  onFinished,
}: ActiveWorkoutTrackerProps) {
  const { repositories, refreshData } = useDatabase();

  const [session, setSession] = useState<WorkoutSession>(initialSession);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(
    initialSession.currentExerciseIndex ?? 0
  );
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [allSessionSets, setAllSessionSets] = useState<WorkoutSet[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);

  // Vorige prestaties geschiedenis
  const [previousPerformance, setPreviousPerformance] = useState<{
    sessionDate: string;
    routineName?: string;
    sets: WorkoutSet[];
  } | null>(null);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Live Timer (tijd sinds start)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Rusttimer na afronden set
  const [restCountdown, setRestCountdown] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState<number>(90);

  // Modals
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // 1. LIVE VERSTREKEN TIJD BEREKENING
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const calculateElapsed = () => {
      const startMs = new Date(session.startTime).getTime();
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [session.startTime]);

  const formatElapsed = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
        2,
        "0"
      )}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ---------------------------------------------------------------------------
  // 2. RUSTTIMER COUNTDOWN
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (restCountdown === null || restCountdown <= 0) return;

    const timer = setInterval(() => {
      setRestCountdown((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restCountdown]);

  // ---------------------------------------------------------------------------
  // 3. HUIDIGE OEFENING & SETS LADEN
  // ---------------------------------------------------------------------------
  const exercises = session.snapshot.exercises;
  const currentExercise: WorkoutExerciseSnapshot | undefined =
    exercises[currentExerciseIndex];

  // Laad alle sets voor de sessie en filter voor de huidige oefening
  const loadSets = useCallback(async () => {
    try {
      setIsLoadingSets(true);
      const allSets = await repositories.workout.getSetsForSession(session.id);
      setAllSessionSets(allSets);

      if (currentExercise) {
        const exerciseSets = allSets.filter(
          (s) => s.exerciseId === currentExercise.exerciseId
        );
        setSets(exerciseSets);
      } else {
        setSets([]);
      }
    } catch (err) {
      console.error("Fout bij laden van sets:", err);
    } finally {
      setIsLoadingSets(false);
    }
  }, [repositories, session.id, currentExercise]);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  // Laad vorige afgeronde sessie voor deze oefening
  useEffect(() => {
    if (!currentExercise) {
      setPreviousPerformance(null);
      return;
    }

    const currentEx = currentExercise;
    let isCancelled = false;
    async function loadPrevious() {
      setIsLoadingPrevious(true);
      try {
        const prev = await repositories.workout.getPreviousPerformanceForExercise(
          currentEx.exerciseId,
          session.id
        );
        if (!isCancelled) {
          setPreviousPerformance(prev);
        }
      } catch (err) {
        console.error("Fout bij laden vorige prestaties:", err);
      } finally {
        if (!isCancelled) setIsLoadingPrevious(false);
      }
    }

    loadPrevious();
    return () => {
      isCancelled = true;
    };
  }, [repositories, currentExercise, session.id]);

  // ---------------------------------------------------------------------------
  // 4. OEFENING WISSELEN & PERSISTENTIE
  // ---------------------------------------------------------------------------
  const handleSelectExercise = async (index: number) => {
    if (index < 0 || index >= exercises.length) return;
    setCurrentExerciseIndex(index);
    try {
      const updated = await repositories.workout.updateActiveSessionExercise(
        session.id,
        index
      );
      setSession(updated);
    } catch (err) {
      console.error("Fout bij opslaan actieve oefening:", err);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      handleSelectExercise(currentExerciseIndex - 1);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      handleSelectExercise(currentExerciseIndex + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. OEFENING TOEVOEGEN TIJDENS TRAINING
  // ---------------------------------------------------------------------------
  const handleAddExerciseToWorkout = async (selected: Exercise) => {
    try {
      const newSnapshotItem: WorkoutExerciseSnapshot = {
        exerciseId: selected.id,
        exerciseName: selected.name,
        primaryMuscleGroup: selected.primaryMuscleGroup,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        targetWeightKg: null,
        targetRpe: null,
        targetRir: null,
        restSeconds: 90,
        notes: "",
      };

      const updated = await repositories.workout.addExerciseToActiveSession(
        session.id,
        newSnapshotItem
      );

      setSession(updated);
      setIsAddExerciseOpen(false);
      // Ga direct naar de nieuw toegevoegde oefening
      const newIndex = updated.snapshot.exercises.length - 1;
      setCurrentExerciseIndex(newIndex);
      refreshData();

      setFeedback(`Oefening "${selected.name}" toegevoegd aan de training.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error("Fout bij toevoegen van oefening:", err);
      alert(err.message || "Fout bij toevoegen oefening.");
    }
  };

  const handleRemoveCurrentExercise = async () => {
    if (!currentExercise) return;
    const confirmRemove = confirm(
      `Weet je zeker dat je "${currentExercise.exerciseName}" wilt verwijderen uit deze trainingssessie?`
    );
    if (!confirmRemove) return;

    try {
      const updated = await repositories.workout.removeExerciseFromActiveSession(
        session.id,
        currentExerciseIndex
      );
      setSession(updated);
      const nextIdx = Math.min(
        currentExerciseIndex,
        Math.max(0, updated.snapshot.exercises.length - 1)
      );
      setCurrentExerciseIndex(nextIdx);
      refreshData();
    } catch (err: any) {
      console.error("Fout bij verwijderen oefening:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. SETS MANAGEMENT (GEWICHT, REPS, VOLTOOIEN, TOEVOEGEN)
  // ---------------------------------------------------------------------------
  const handleUpdateSetValue = async (
    setId: string,
    updates: Partial<WorkoutSet>
  ) => {
    const existing = sets.find((s) => s.id === setId);
    if (!existing) return;

    const updatedSet: WorkoutSet = {
      ...existing,
      ...updates,
    };

    // Optimistic UI update
    setSets((prev) => prev.map((s) => (s.id === setId ? updatedSet : s)));
    setAllSessionSets((prev) =>
      prev.map((s) => (s.id === setId ? updatedSet : s))
    );

    try {
      await repositories.workout.saveWorkoutSet(updatedSet);
    } catch (err) {
      console.error("Fout bij opslaan set:", err);
    }
  };

  const handleToggleCompleteSet = async (set: WorkoutSet) => {
    const nextCompleted = !set.completed;
    const updatedSet: WorkoutSet = {
      ...set,
      completed: nextCompleted,
      loggedAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setSets((prev) => prev.map((s) => (s.id === set.id ? updatedSet : s)));
    setAllSessionSets((prev) =>
      prev.map((s) => (s.id === set.id ? updatedSet : s))
    );

    try {
      await repositories.workout.saveWorkoutSet(updatedSet);

      // Start automatisch rusttimer indien set zojuist voltooid is
      if (nextCompleted) {
        const restDuration =
          currentExercise?.restSeconds || set.restTimeSeconds || 90;
        setRestTarget(restDuration);
        setRestCountdown(restDuration);
      }
    } catch (err) {
      console.error("Fout bij voltooien set:", err);
    }
  };

  const handleAddSet = async () => {
    if (!currentExercise) return;

    const nextSetNumber = sets.length + 1;
    const lastSet = sets[sets.length - 1];

    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      exerciseId: currentExercise.exerciseId,
      setNumber: nextSetNumber,
      setType: "normal",
      weightKg: lastSet?.weightKg ?? currentExercise.targetWeightKg ?? 0,
      reps: lastSet?.reps ?? currentExercise.targetRepsMin ?? 8,
      targetRpe: currentExercise.targetRpe ?? null,
      actualRpe: null,
      restTimeSeconds: currentExercise.restSeconds || 90,
      completed: false,
      loggedAt: new Date().toISOString(),
    };

    setSets((prev) => [...prev, newSet]);
    setAllSessionSets((prev) => [...prev, newSet]);

    try {
      await repositories.workout.saveWorkoutSet(newSet);
    } catch (err) {
      console.error("Fout bij toevoegen set:", err);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    setSets((prev) => prev.filter((s) => s.id !== setId));
    setAllSessionSets((prev) => prev.filter((s) => s.id !== setId));

    try {
      await repositories.workout.deleteWorkoutSet(setId);
    } catch (err) {
      console.error("Fout bij verwijderen set:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. FINISH / EXIT HANDLERS
  // ---------------------------------------------------------------------------
  const handleConfirmFinish = async (overallRpe?: number, notes?: string) => {
    const finished = await repositories.workout.finishSession(
      session.id,
      overallRpe,
      notes
    );
    refreshData();
    if (finished) {
      onFinished(finished.id);
    } else {
      onExit();
    }
  };

  const handleCancelSession = async () => {
    await repositories.workout.cancelOrDiscardActiveSession(
      session.id,
      "mark_cancelled"
    );
    refreshData();
    onExit();
  };

  const handleDiscardSession = async () => {
    await repositories.workout.cancelOrDiscardActiveSession(
      session.id,
      "discard_delete"
    );
    refreshData();
    onExit();
  };

  // Bereken totale sets statistieken
  const completedSetsCount = useMemo(() => {
    return allSessionSets.filter((s) => s.completed).length;
  }, [allSessionSets]);

  const totalSetsCount = useMemo(() => {
    return allSessionSets.length;
  }, [allSessionSets]);

  const sessionTitle =
    session.snapshot.routineDayName ||
    session.snapshot.routineName ||
    "Actieve Training";

  return (
    <div className="space-y-5 pb-12 max-w-4xl mx-auto">
      {/* ----------------------------------------------------------------------- */}
      {/* HEADER COCKPIT MET LIVE TIMER & ACTIES */}
      {/* ----------------------------------------------------------------------- */}
      <Card className="p-4 sm:p-5 border-emerald-500/40 bg-card shadow-sm ring-1 ring-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-xs flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Training Actief
              </Badge>
              <span className="text-xs text-muted-foreground">
                {session.calendarDate}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {sessionTitle}
            </h2>

            {/* Live timer display */}
            <div className="flex items-center gap-2 pt-0.5 text-sm text-muted-foreground font-mono">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Verstreken tijd:</span>
              <span className="font-bold text-foreground text-base tracking-wider">
                {formatElapsed(elapsedSeconds)}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({completedSetsCount} / {totalSetsCount} sets voltooid)
              </span>
            </div>
          </div>

          {/* Actieknoppen (>= 48px touch targets) */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsExitDialogOpen(true)}
              leftIcon={<Pause className="w-4 h-4" />}
              className="flex-1 sm:flex-none min-h-[48px] px-4 font-medium"
              title="Pauzeren, annuleren of sluiten"
            >
              Pauzeren / Sluiten
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsFinishDialogOpen(true)}
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
              className="flex-1 sm:flex-none min-h-[48px] px-6 font-semibold shadow-md shadow-emerald-500/20"
              title="Training afronden en registreren"
            >
              Voltooien
            </Button>
          </div>
        </div>

        {/* Feedback melding */}
        {feedback && (
          <div className="mt-3">
            <Alert variant="success">{feedback}</Alert>
          </div>
        )}
      </Card>

      {/* ----------------------------------------------------------------------- */}
      {/* RUSTTIMER BALK (WANNEER ACTIEF) */}
      {/* ----------------------------------------------------------------------- */}
      {restCountdown !== null && restCountdown > 0 && (
        <Card className="p-3.5 border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0">
              <TimerIcon className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Rusttijd actief (Doel: {restTarget}s)
              </p>
              <p className="text-lg font-mono font-bold text-emerald-950 dark:text-emerald-100">
                {formatElapsed(restCountdown)} over
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRestCountdown((prev) => (prev ? prev + 30 : 30))}
              className="text-xs min-h-[36px]"
            >
              +30s
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRestCountdown(null)}
              className="text-xs min-h-[36px]"
            >
              Overslaan
            </Button>
          </div>
        </Card>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* OEFENINGEN NAVIGATIE / CAROUSEL */}
      {/* ----------------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
            Oefeningen Volgorde ({exercises.length})
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddExerciseOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-emerald-500" />}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 h-8"
          >
            + Oefening Toevoegen
          </Button>
        </div>

        {/* Oefeningen Tabs / Pillen Bar */}
        {exercises.length === 0 ? (
          <Card className="p-6 text-center border-dashed border-2">
            <p className="text-sm text-muted-foreground mb-3">
              Er zijn nog geen oefeningen toegevoegd aan deze training.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddExerciseOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="min-h-[48px]"
            >
              Voeg je eerste oefening toe
            </Button>
          </Card>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {exercises.map((ex, idx) => {
              const isSelected = idx === currentExerciseIndex;
              const exSets = allSessionSets.filter((s) => s.exerciseId === ex.exerciseId);
              const completedCount = exSets.filter((s) => s.completed).length;
              const isAllCompleted = exSets.length > 0 && completedCount === exSets.length;

              return (
                <button
                  key={`${ex.exerciseId}_${idx}`}
                  type="button"
                  onClick={() => handleSelectExercise(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all min-h-[44px] ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500"
                      : "bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground border border-border"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isAllCompleted ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="font-semibold max-w-[130px] truncate">
                    {ex.exerciseName}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {completedCount}/{exSets.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* HUIDIGE OEFENING DETAIL & PRESTATIEKAART */}
      {/* ----------------------------------------------------------------------- */}
      {currentExercise && (
        <Card className="p-4 sm:p-5 border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Oefening {currentExerciseIndex + 1} van {exercises.length}
                </span>
                <Badge variant="default" className="text-[11px] capitalize">
                  {currentExercise.primaryMuscleGroup}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {currentExercise.exerciseName}
              </h3>
            </div>

            {/* Navigatie tussen oefeningen */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevExercise}
                disabled={currentExerciseIndex === 0}
                className="h-10 px-3"
                title="Vorige oefening"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Vorige
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === exercises.length - 1}
                className="h-10 px-3"
                title="Volgende oefening"
              >
                Volgende
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCurrentExercise}
                className="h-10 px-2.5 text-muted-foreground hover:text-red-500"
                title="Verwijder oefening uit sessie"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ONDERSCHEID GEPLAND vs VORIGE PRESTATIE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Gepland doel */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Gepland Voorschrift
              </div>
              <p className="text-sm font-semibold text-foreground">
                {currentExercise.targetSets} sets &bull;{" "}
                {currentExercise.targetRepsMin
                  ? `${currentExercise.targetRepsMin}${
                      currentExercise.targetRepsMax &&
                      currentExercise.targetRepsMax !== currentExercise.targetRepsMin
                        ? `-${currentExercise.targetRepsMax}`
                        : ""
                    } herhalingen`
                  : currentExercise.targetDurationSeconds
                  ? `${currentExercise.targetDurationSeconds} sec`
                  : "Regulier"}
                {currentExercise.targetWeightKg
                  ? ` @ ${currentExercise.targetWeightKg} kg`
                  : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Rust: {currentExercise.restSeconds}s
                {currentExercise.targetRpe ? ` • Doel RPE: ${currentExercise.targetRpe}` : ""}
                {currentExercise.notes ? ` • "${currentExercise.notes}"` : ""}
              </p>
            </div>

            {/* Vorige afgeronde sessie (Progressive Overload referentie) */}
            <div className="p-3.5 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <History className="w-3.5 h-3.5" />
                Vorige Afgeronde Prestatie
              </div>
              {isLoadingPrevious ? (
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              ) : previousPerformance ? (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Op {previousPerformance.sessionDate} ({previousPerformance.routineName}):
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {previousPerformance.sets.map((s, idx) => (
                      <span key={s.id} className="mr-2">
                        <span className="text-muted-foreground">S{s.setNumber}:</span>{" "}
                        <span className="font-bold">{s.weightKg}kg</span> × {s.reps}
                        {s.actualRpe ? ` @RPE${s.actualRpe}` : ""}
                        {idx < previousPerformance.sets.length - 1 ? " &bull;" : ""}
                      </span>
                    ))}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Eerste keer dat je deze oefening registreert (geen eerdere geschiedenis).
                </p>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* SETS INVOERTABEL MET GROTE TOUCH-TARGETS (>= 48px) */}
          {/* ------------------------------------------------------------------- */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">
                Werkelijk Uitgevoerde Sets
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSet}
                leftIcon={<Plus className="w-4 h-4 text-emerald-500" />}
                className="h-9 text-xs font-semibold"
              >
                + Set toevoegen
              </Button>
            </div>

            {/* Desktop & Tablet Tabel / Mobiele Kaarten */}
            {isLoadingSets ? (
              <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">
                Sets laden...
              </div>
            ) : sets.length === 0 ? (
              <div className="p-5 text-center rounded-xl border border-dashed text-sm text-muted-foreground">
                Geen sets aangemaakt voor deze oefening. Klik op &quot;+ Set toevoegen&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Tabel Headers (Desktop) */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-1 text-center">Set</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Gewicht (kg)</div>
                  <div className="col-span-3">Herhalingen</div>
                  <div className="col-span-1 text-center">RPE</div>
                  <div className="col-span-2 text-right">Voltooid</div>
                </div>

                {/* Set Rijen */}
                {sets.map((set, sIdx) => {
                  const isCompleted = set.completed;
                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl border transition-all items-center ${
                        isCompleted
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40"
                          : "bg-card border-border hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Set Nummer & Type */}
                      <div className="flex sm:col-span-3 items-center justify-between sm:justify-start gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isCompleted
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {set.setNumber}
                          </span>

                          {/* Set Type Selector */}
                          <select
                            value={set.setType}
                            onChange={(e) =>
                              handleUpdateSetValue(set.id, {
                                setType: e.target.value as any,
                              })
                            }
                            className="h-10 text-xs rounded-lg border border-border bg-background px-2 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="normal">Werkset</option>
                            <option value="warmup">Opwarmen</option>
                            <option value="drop">Dropset</option>
                            <option value="failure">Tot falen</option>
                          </select>
                        </div>

                        {/* Mobiele delete knop */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSet(set.id)}
                          className="sm:hidden p-2 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Gewicht Invoer (min 48px touch target) */}
                      <div className="col-span-3 flex items-center gap-1.5">
                        <span className="sm:hidden text-xs text-muted-foreground w-16">
                          Gewicht:
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={set.weightKg === 0 ? "" : set.weightKg}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdateSetValue(set.id, {
                              weightKg: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-12 w-full rounded-xl border border-border bg-background px-3 text-center text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
                        />
                        <span className="text-xs text-muted-foreground">kg</span>
                      </div>

                      {/* Reps Invoer (min 48px touch target) */}
                      <div className="col-span-3 flex items-center gap-1.5">
                        <span className="sm:hidden text-xs text-muted-foreground w-16">
                          Reps:
                        </span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={set.reps === 0 ? "" : set.reps}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdateSetValue(set.id, {
                              reps: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="h-12 w-full rounded-xl border border-border bg-background px-3 text-center text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
                        />
                        <span className="text-xs text-muted-foreground">reps</span>
                      </div>

                      {/* RPE (Optioneel) */}
                      <div className="col-span-1 hidden sm:block">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          value={set.actualRpe ?? ""}
                          placeholder="RPE"
                          onChange={(e) =>
                            handleUpdateSetValue(set.id, {
                              actualRpe: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            })
                          }
                          className="h-12 w-full rounded-xl border border-border bg-background px-1 text-center text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
                        />
                      </div>

                      {/* Voltooid Checkmark Knop (Grote 48px touch target!) */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5 pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleteSet(set)}
                          className={`min-h-[48px] min-w-[48px] w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border"
                          }`}
                          title={isCompleted ? "Set afvinken ongedaan maken" : "Set voltooien"}
                        >
                          <Check
                            className={`w-5 h-5 ${
                              isCompleted ? "stroke-[3]" : "text-muted-foreground"
                            }`}
                          />
                          <span className="sm:hidden text-xs">
                            {isCompleted ? "Voltooid" : "Afvinken"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSet(set.id)}
                          className="hidden sm:inline-flex p-2 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Set verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* DIALOGS VOOR EXIT, FINISH EN OEFENING TOEVOEGEN */}
      {/* ----------------------------------------------------------------------- */}
      <ExitWorkoutDialog
        isOpen={isExitDialogOpen}
        onClose={() => setIsExitDialogOpen(false)}
        workoutName={sessionTitle}
        onKeepDraft={() => {
          setIsExitDialogOpen(false);
          onExit();
        }}
        onCancelSession={handleCancelSession}
        onDiscardSession={handleDiscardSession}
      />

      <FinishWorkoutDialog
        isOpen={isFinishDialogOpen}
        onClose={() => setIsFinishDialogOpen(false)}
        workoutName={sessionTitle}
        durationFormatted={formatElapsed(elapsedSeconds)}
        totalSetsCompleted={completedSetsCount}
        totalSetsPlanned={totalSetsCount}
        onConfirmFinish={handleConfirmFinish}
      />

      <ExerciseSelectorDialog
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelect={handleAddExerciseToWorkout}
        title="Oefening toevoegen aan training"
        description="Selecteer een oefening uit de bibliotheek. Deze wordt direct toegevoegd aan je actieve sessie."
      />
    </div>
  );
}
