"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dumbbell,
  Plus,
  Play,
  Calendar,
  Layers,
  Search,
  Sparkles,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useDatabase } from "@/lib/db";
import { ExerciseLibrary } from "@/components/modules/exercises/ExerciseLibrary";
import { RoutineList } from "@/components/modules/routines/RoutineList";
import { WeekPlanner } from "@/components/modules/planning/WeekPlanner";
import { ActiveWorkoutTracker } from "@/components/modules/tracker/ActiveWorkoutTracker";
import { ActiveWorkoutBanner } from "@/components/modules/tracker/ActiveWorkoutBanner";
import { StartFreeWorkoutDialog } from "@/components/modules/tracker/StartFreeWorkoutDialog";
import { StartWorkoutConflictDialog } from "@/components/modules/tracker/StartWorkoutConflictDialog";
import { CompletedWorkoutDetailModal } from "@/components/modules/tracker/CompletedWorkoutDetailModal";
import { DeleteWorkoutConfirmDialog } from "@/components/modules/tracker/DeleteWorkoutConfirmDialog";
import { WorkoutHistoryView } from "@/components/modules/history/WorkoutHistoryView";
import type { WorkoutSession, WorkoutRoutine, RoutineDay, Exercise } from "@/types/database";

export default function TrainingPage() {
  const { repositories, isDemoMode, dataVersion, refreshData } = useDatabase();

  const [activeTab, setActiveTab] = useState("planning");
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isStartFreeOpen, setIsStartFreeOpen] = useState(false);
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [selectedDetailSession, setSelectedDetailSession] = useState<WorkoutSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null);

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await repositories.workout.deleteCompletedSession(sessionToDelete.id);
      setSessionToDelete(null);
      setSelectedDetailSession(null);
      refreshData();
      await loadTrainingData();
    } catch (err) {
      console.error("Fout bij verwijderen training:", err);
    }
  };

  const loadTrainingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedSessions, fetchedRoutines, fetchedExercises, currentActive] =
        await Promise.all([
          repositories.workout.sessions.getAll(),
          repositories.workout.routines.getAll(),
          repositories.exercises.getAll(),
          repositories.workout.getActiveWorkoutSession(),
        ]);

      setSessions(fetchedSessions.reverse()); // Nieuwste eerst
      setRoutines(fetchedRoutines);
      setExercises(fetchedExercises);
      setActiveSession(currentActive);

      // Als er een actieve sessie is en URL bevat ?tab=actief, schakel direct in
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");
        if (tabParam === "actief" && currentActive) {
          setActiveTab("actief");
        } else if (tabParam && ["planning", "sessies", "schemas", "oefeningen"].includes(tabParam)) {
          setActiveTab(tabParam);
        }
      }
    } catch (err) {
      console.error("Fout bij laden van trainingsdata:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories]);

  useEffect(() => {
    loadTrainingData();
  }, [loadTrainingData, isDemoMode, dataVersion]);

  // Start vrije training afhandeling
  const handleStartFreeWorkout = async (name: string, notes?: string) => {
    try {
      const active = await repositories.workout.getActiveWorkoutSession();
      if (active) {
        setIsConflictOpen(true);
        return;
      }

      const started = await repositories.workout.startEmptyWorkout({
        workoutName: name,
        notes: notes,
      });

      setActiveSession(started);
      setActiveTab("actief");
      refreshData();
    } catch (err: any) {
      console.error("Fout bij starten vrije training:", err);
      if (err.message?.includes("Er is al een actieve training")) {
        setIsConflictOpen(true);
      }
    }
  };

  const handleDiscardConflictAndStartNew = async () => {
    if (!activeSession) return;
    try {
      await repositories.workout.cancelOrDiscardActiveSession(
        activeSession.id,
        "discard_delete"
      );
      setIsConflictOpen(false);
      setIsStartFreeOpen(true);
      refreshData();
      loadTrainingData();
    } catch (err) {
      console.error("Fout bij wissen bestaande sessie:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Pagina Header met Primaire Actie */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-emerald-500" />
            Krachttraining
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Beheer trainingsschema&apos;s, log sets en stimuleer progressieve overload.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSession ? (
            <Button
              variant="primary"
              onClick={() => setActiveTab("actief")}
              leftIcon={<Play className="w-4 h-4 fill-current" />}
              className="min-h-[48px] px-5 font-semibold shadow-md shadow-emerald-500/20"
            >
              Hervat Training
            </Button>
          ) : (
            <Button
              onClick={() => setIsStartFreeOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="min-h-[48px] px-5 font-semibold shadow-sm"
            >
              Vrije Training Starten
            </Button>
          )}
        </div>
      </div>

      {/* Banner wanneer er een actieve training loopt en de gebruiker op een ander tabblad kijkt */}
      {activeSession && activeTab !== "actief" && (
        <ActiveWorkoutBanner
          session={activeSession}
          onResume={() => setActiveTab("actief")}
          onRefresh={loadTrainingData}
        />
      )}

      {/* Tabs Navigatie */}
      <Tabs
        defaultValue="planning"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {activeSession && (
            <TabsTrigger
              value="actief"
              className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Actieve Training
            </TabsTrigger>
          )}
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="sessies">
            Workouts ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="schemas">
            Schema&apos;s &amp; Routines ({routines.length})
          </TabsTrigger>
          <TabsTrigger value="oefeningen">Oefeningen</TabsTrigger>
        </TabsList>

        {/* Tab 0: Actieve Training (Live Tracker) */}
        {activeSession && (
          <TabsContent value="actief" className="space-y-4 pt-1">
            <ActiveWorkoutTracker
              session={activeSession}
              onExit={() => {
                setActiveTab("planning");
                loadTrainingData();
              }}
              onFinished={(finishedId) => {
                setActiveSession(null);
                setActiveTab("sessies");
                loadTrainingData();
                refreshData();
              }}
            />
          </TabsContent>
        )}

        {/* Tab 1: Planning */}
        <TabsContent value="planning" className="space-y-4">
          <WeekPlanner
            onWorkoutStarted={(started) => {
              setActiveSession(started);
              setActiveTab("actief");
              refreshData();
            }}
          />
        </TabsContent>

        {/* Tab 2: Sessies Historiek & Oefenprogressie */}
        <TabsContent value="sessies" className="space-y-4">
          <WorkoutHistoryView
            onStartWorkout={() => setIsStartFreeOpen(true)}
            onResumeWorkout={(sessionItem) => {
              setActiveSession(sessionItem);
              setActiveTab("actief");
            }}
          />
        </TabsContent>

        {/* Tab 3: Schema's & Routines */}
        <TabsContent value="schemas" className="space-y-4">
          <RoutineList />
        </TabsContent>

        {/* Tab 4: Oefeningenbibliotheek */}
        <TabsContent value="oefeningen" className="space-y-4">
          <ExerciseLibrary />
        </TabsContent>
      </Tabs>

      {/* Start Vrije Training Dialog */}
      <StartFreeWorkoutDialog
        isOpen={isStartFreeOpen}
        onClose={() => setIsStartFreeOpen(false)}
        onStart={handleStartFreeWorkout}
      />

      {/* Conflictdialoog bij al actieve sessie */}
      <StartWorkoutConflictDialog
        isOpen={isConflictOpen}
        onClose={() => setIsConflictOpen(false)}
        activeSession={activeSession}
        onResume={() => {
          setIsConflictOpen(false);
          setActiveTab("actief");
        }}
        onDiscardAndStartNew={handleDiscardConflictAndStartNew}
      />

      {/* Detail en Bewerken Modal voor voltooide workouts */}
      <CompletedWorkoutDetailModal
        isOpen={Boolean(selectedDetailSession)}
        onClose={() => setSelectedDetailSession(null)}
        session={selectedDetailSession}
        onSessionUpdated={() => {
          loadTrainingData();
          refreshData();
        }}
        onDeleteRequested={(s: WorkoutSession) => {
          setSelectedDetailSession(null);
          setSessionToDelete(s);
        }}
      />

      {/* Verwijderbevestiging dialoog */}
      <DeleteWorkoutConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        onConfirmDelete={handleConfirmDeleteSession}
        workoutTitle={
          sessionToDelete?.snapshot.routineDayName ||
          sessionToDelete?.snapshot.routineName ||
          "Workout Sessie"
        }
        calendarDate={sessionToDelete?.calendarDate || ""}
      />
    </div>
  );
}
