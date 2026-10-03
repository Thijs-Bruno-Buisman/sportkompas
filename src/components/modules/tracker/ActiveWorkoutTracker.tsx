"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  type WorkoutSession,
  type WorkoutSet,
  type WorkoutExerciseSnapshot,
  type Exercise,
} from "@/types/database";
import { useDatabase } from "@/lib/db";
import { calculateSessionVolume } from "@/domain/strength/volumeAndPR";
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
  Copy,
  Info,
} from "lucide-react";
import { ExerciseSelectorDialog } from "../routines/ExerciseSelectorDialog";
import { ExitWorkoutDialog } from "./ExitWorkoutDialog";
import { FinishWorkoutDialog } from "./FinishWorkoutDialog";
import { SetRow } from "./SetRow";
import { RestTimerBar } from "./RestTimerBar";
import { ExerciseNotesCard } from "./ExerciseNotesCard";
import { duplicateSetValues } from "@/domain/strength/setParser";
import type { AchievedPR } from "@/domain/strength/personalRecords";
import {
  type RestTimerState,
  startRestTimer,
  saveTimerStateToStorage,
  loadTimerStateFromStorage,
} from "@/domain/strength/restTimer";
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
    workoutName?: string;
    exerciseNotes?: string;
    sets: WorkoutSet[];
  } | null>(null);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Dubbelklikbeveiliging voor set operaties
  const [isOperatingSet, setIsOperatingSet] = useState(false);

  // Live Timer (tijd sinds start)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Rusttimer na afronden set (timestamp-gebaseerd, persistent en geïsoleerd)
  const [restTimerState, setRestTimerState] = useState<RestTimerState | null>(
    () => loadTimerStateFromStorage()
  );

  // Oefening details uit bibliotheek (voor permanente technieknotities)
  const [exerciseLibraryItem, setExerciseLibraryItem] =
    useState<Exercise | null>(null);

  // Modals
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<string | null>(null);

  // Behaalde PR's in deze actieve sessie
  const [sessionPRs, setSessionPRs] = useState<AchievedPR[]>([]);

  useEffect(() => {
    let isCancelled = false;
    repositories.workout
      .getSessionPRs(session.id)
      .then((prs) => {
        if (!isCancelled) setSessionPRs(prs);
      })
      .catch(console.error);

    return () => {
      isCancelled = true;
    };
  }, [session.id, allSessionSets, repositories]);

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

  // Laad de vaste oefeningdefinitie uit de bibliotheek voor blijvende technieknotities
  useEffect(() => {
    if (!currentExercise) {
      setExerciseLibraryItem(null);
      return;
    }

    let isCancelled = false;
    repositories.exercises
      .getById(currentExercise.exerciseId)
      .then((item) => {
        if (!isCancelled) {
          setExerciseLibraryItem(item || null);
        }
      })
      .catch((err) => {
        console.error("Fout bij laden van oefening:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [repositories, currentExercise]);

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
  // 5. OEFENING NOTITIES BEHEER (SESSIE NOTITIE VS BLIJVENDE TECHNIEKNOTITIE)
  // ---------------------------------------------------------------------------
  const handleSaveSessionNote = async (note: string) => {
    if (!currentExercise) return;
    try {
      const updated = await repositories.workout.updateSessionExerciseNotes(
        session.id,
        currentExerciseIndex,
        note
      );
      setSession(updated);
    } catch (err) {
      console.error("Fout bij opslaan sessienotitie:", err);
    }
  };

  const handleSaveTechniqueNote = async (techniqueNote: string) => {
    if (!currentExercise) return;
    try {
      const updated = await repositories.exercises.updateTechniqueNotes(
        currentExercise.exerciseId,
        techniqueNote
      );
      setExerciseLibraryItem(updated);
    } catch (err) {
      console.error("Fout bij opslaan technieknotitie:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. OEFENING TOEVOEGEN TIJDENS TRAINING
  // ---------------------------------------------------------------------------
  const handleAddExerciseToWorkout = async (selected: Exercise) => {
    try {
      const isTimeBased = selected.measurementType === "tijd";
      const newSnapshotItem: WorkoutExerciseSnapshot = {
        exerciseId: selected.id,
        exerciseName: selected.name,
        primaryMuscleGroup: selected.primaryMuscleGroup,
        measurementType: selected.measurementType,
        targetSets: 3,
        targetRepsMin: isTimeBased ? 30 : 8,
        targetRepsMax: isTimeBased ? 60 : 10,
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
  // 6. SETS MANAGEMENT (GEWICHT, REPS, VOLTOOIEN, TOEVOEGEN, KOPIËREN)
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
    const nowIso = new Date().toISOString();
    const updatedSet: WorkoutSet = {
      ...set,
      completed: nextCompleted,
      loggedAt: nowIso,
      completedAt: nextCompleted ? nowIso : null,
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
        // Controleer of deze set een PR behaalt
        try {
          const detectedPRs = await repositories.workout.evaluateCandidateSet(
            updatedSet,
            session.id
          );
          if (detectedPRs.length > 0) {
            const pr = detectedPRs[0];
            setFeedback(
              `🏆 Nieuw PR voor ${currentExercise?.exerciseName || "oefening"}! ${pr.categoryLabel}: ${pr.formattedValue}`
            );
            setTimeout(() => setFeedback(null), 4500);
          }
        } catch (prErr) {
          console.error("Fout bij evalueren van set PR:", prErr);
        }

        const restDuration =
          currentExercise?.restSeconds || set.restTimeSeconds || 90;
        const newTimer = startRestTimer(
          restDuration,
          currentExercise?.exerciseName
        );
        setRestTimerState(newTimer);
        saveTimerStateToStorage(newTimer);
      }
    } catch (err) {
      console.error("Fout bij voltooien set:", err);
    }
  };

  const handleAddSet = async () => {
    if (!currentExercise || isOperatingSet) return;
    setIsOperatingSet(true);

    try {
      const nextSetNumber = sets.length + 1;
      const lastSet = sets[sets.length - 1];
      const isTimeBased = currentExercise.measurementType === "tijd";
      const isAssisted = currentExercise.measurementType === "assisted";

      const newSet: WorkoutSet = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        exerciseId: currentExercise.exerciseId,
        setNumber: nextSetNumber,
        setType: "normal",
        weightKg: lastSet?.weightKg ?? currentExercise.targetWeightKg ?? 0,
        reps: isTimeBased ? 0 : (lastSet?.reps ?? currentExercise.targetRepsMin ?? 8),
        durationSeconds: isTimeBased
          ? (lastSet?.durationSeconds ?? currentExercise.targetRepsMin ?? 30)
          : null,
        isAssisted,
        targetRpe: currentExercise.targetRpe ?? null,
        actualRpe: null,
        restTimeSeconds: currentExercise.restSeconds || 90,
        completed: false,
        loggedAt: new Date().toISOString(),
        completedAt: null,
      };

      setSets((prev) => [...prev, newSet]);
      setAllSessionSets((prev) => [...prev, newSet]);

      await repositories.workout.saveWorkoutSet(newSet);
    } catch (err) {
      console.error("Fout bij toevoegen set:", err);
    } finally {
      setIsOperatingSet(false);
    }
  };

  const handleCopyPreviousSet = async () => {
    if (!currentExercise || sets.length === 0 || isOperatingSet) return;
    setIsOperatingSet(true);

    try {
      const lastSet = sets[sets.length - 1];
      const nextSetNumber = sets.length + 1;
      const newSet = duplicateSetValues(
        lastSet,
        nextSetNumber,
        crypto.randomUUID()
      );

      setSets((prev) => [...prev, newSet]);
      setAllSessionSets((prev) => [...prev, newSet]);

      await repositories.workout.saveWorkoutSet(newSet);
    } catch (err) {
      console.error("Fout bij kopiëren vorige set:", err);
    } finally {
      setIsOperatingSet(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    const remainingSets = sets.filter((s) => s.id !== setId);
    const renumbered = remainingSets.map((s, idx) => ({
      ...s,
      setNumber: idx + 1,
    }));

    setSets(renumbered);
    setAllSessionSets((prev) => {
      const filtered = prev.filter((s) => s.id !== setId);
      return filtered.map((s) => {
        const found = renumbered.find((r) => r.id === s.id);
        return found ? found : s;
      });
    });

    try {
      await repositories.workout.deleteWorkoutSet(setId);
      for (const s of renumbered) {
        await repositories.workout.saveWorkoutSet(s);
      }
    } catch (err) {
      console.error("Fout bij verwijderen set:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. FINISH / EXIT HANDLERS
  // ---------------------------------------------------------------------------
  const isFinishingRef = useRef(false);

  const handleConfirmFinish = async (
    overallRpe?: number,
    notes?: string,
    incompleteSetsAction: "discard" | "mark_completed" = "discard"
  ) => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    try {
      const finished = await repositories.workout.finishSession(session.id, {
        overallRpe,
        notes,
        incompleteSetsAction,
      });
      refreshData();
      if (finished) {
        onFinished(finished.id);
      } else {
        onExit();
      }
    } finally {
      isFinishingRef.current = false;
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
      {/* RUSTTIMER BALK (WANNEER ACTIEF, MET TIMESTAMP RE-EVALUATIE & ISOLATIE) */}
      {/* ----------------------------------------------------------------------- */}
      <RestTimerBar
        timerState={restTimerState}
        onUpdateTimer={setRestTimerState}
      />

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
          {/* ASSISTED OEFENING NOTIFICATIE */}
          {/* ------------------------------------------------------------------- */}
          {currentExercise.measurementType === "assisted" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span className="font-bold">Assisted oefening:</span> Het ingevoerde gewicht is de tegengewicht-hulp van het apparaat. <strong>Minder tegengewicht</strong> betekent dat je meer van je eigen lichaamsgewicht tilt en is dus een <strong>betere prestatie</strong>!
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* SETS INVOERTABEL MET GROTE TOUCH-TARGETS (>= 48px) */}
          {/* ------------------------------------------------------------------- */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-foreground">
                Werkelijk Uitgevoerde Sets
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPreviousSet}
                  disabled={sets.length === 0 || isOperatingSet}
                  leftIcon={<Copy className="w-3.5 h-3.5 text-emerald-500" />}
                  className="h-9 text-xs font-semibold"
                  title="Kopieer waarden van de vorige set naar een nieuwe niet-voltooide set"
                >
                  Kopieer vorige
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSet}
                  disabled={isOperatingSet}
                  leftIcon={<Plus className="w-4 h-4 text-emerald-500" />}
                  className="h-9 text-xs font-semibold"
                >
                  + Set toevoegen
                </Button>
              </div>
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
                  <div className="col-span-3 text-left">Set & Type</div>
                  <div className="col-span-3">
                    {currentExercise.measurementType === "assisted"
                      ? "Tegengewicht (-kg)"
                      : currentExercise.measurementType === "lichaamsgewicht"
                      ? "Extra gewicht (kg)"
                      : "Gewicht (kg)"}
                  </div>
                  <div className="col-span-3">
                    {currentExercise.measurementType === "tijd"
                      ? "Duur (sec)"
                      : "Herhalingen"}
                  </div>
                  <div className="col-span-1 text-center">RPE</div>
                  <div className="col-span-2 text-right">Voltooid</div>
                </div>

                {/* Set Rijen met SetRow component */}
                {sets.map((set, sIdx) => {
                  const setPR = sessionPRs.find((p) => p.setId === set.id);
                  return (
                    <SetRow
                      key={set.id}
                      set={set}
                      index={sIdx}
                      measurementType={currentExercise.measurementType ?? "gewicht_herhalingen"}
                      isPR={Boolean(setPR)}
                      prLabel={setPR?.description}
                      onUpdateSetValue={handleUpdateSetValue}
                      onToggleComplete={handleToggleCompleteSet}
                      onDeleteSet={handleDeleteSet}
                    />
                  );
                })}
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* OEFENING NOTITIES: BLIJVENDE TECHNIEKNOTITIE & SESSIENOTITIE */}
            {/* ----------------------------------------------------------------- */}
            <div className="pt-2 border-t border-border mt-4">
              <ExerciseNotesCard
                exerciseId={currentExercise.exerciseId}
                exerciseName={currentExercise.exerciseName}
                currentExerciseSnapshot={currentExercise}
                exerciseLibraryItem={exerciseLibraryItem}
                previousExerciseNote={previousPerformance?.exerciseNotes}
                previousSessionDate={previousPerformance?.sessionDate}
                onSaveSessionNote={handleSaveSessionNote}
                onSaveTechniqueNote={handleSaveTechniqueNote}
              />
            </div>
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
        totalVolumeKg={calculateSessionVolume(sets)}
        exerciseSummaries={session.snapshot.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: sets.filter((s) => s.exerciseId === ex.exerciseId),
        }))}
        achievedPRs={sessionPRs}
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
