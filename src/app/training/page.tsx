"use client";

import React, { useState, useEffect } from "react";
import { Dumbbell, Plus, Play, Calendar, Layers, Search, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useDatabase } from "@/lib/db";
import { ExerciseLibrary } from "@/components/modules/exercises/ExerciseLibrary";
import { RoutineList } from "@/components/modules/routines/RoutineList";
import type { WorkoutSession, WorkoutRoutine, RoutineDay, Exercise } from "@/types/database";

export default function TrainingPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [activeTab, setActiveTab] = useState("sessies");
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState("hypertrofie");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;
    async function loadTrainingData() {
      setIsLoading(true);
      try {
        const [fetchedSessions, fetchedRoutines, fetchedExercises] = await Promise.all([
          repositories.workout.sessions.getAll(),
          repositories.workout.routines.getAll(),
          repositories.exercises.getAll(),
        ]);

        let fetchedDays: RoutineDay[] = [];
        if (fetchedRoutines.length > 0) {
          fetchedDays = await repositories.workout.routineDays["table"]
            .where("routineId")
            .equals(fetchedRoutines[0].id)
            .toArray();
        }

        if (!isCancelled) {
          setSessions(fetchedSessions.reverse()); // Nieuwste eerst
          setRoutines(fetchedRoutines);
          setRoutineDays(fetchedDays);
          setExercises(fetchedExercises);
        }
      } catch (err) {
        console.error("Fout bij laden van trainingsdata:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadTrainingData();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isDemoMode, dataVersion]);

  const handleStartWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutName.trim()) {
      setErrorMessage("Vul een naam in voor je workout.");
      return;
    }

    try {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const newSession: WorkoutSession = {
        id: crypto.randomUUID(),
        calendarDate: todayStr,
        startTime: now.toISOString(),
        endTime: null,
        status: "actief",
        routineId: null,
        routineDayId: null,
        routineVersion: null,
        snapshot: {
          routineName: workoutName.trim(),
          routineDayName: workoutType,
          exercises: [],
        },
        overallRpe: null,
        notes: `Gestart als losse workout (${workoutType})`,
        provenance: { source: isDemoMode ? "demo" : "user", isDemo: isDemoMode },
      };

      await repositories.workout.sessions.save(newSession);
      setSessions((prev) => [newSession, ...prev]);

      setErrorMessage("");
      setIsDialogOpen(false);
      setWorkoutName("");
      alert(`Nieuwe training gestart: ${newSession.snapshot.routineName}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij starten van workout");
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

        <Button
          onClick={() => setIsDialogOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Nieuwe Workout
        </Button>
      </div>

      {/* Tabs Navigatie */}
      <Tabs defaultValue="sessies" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="sessies">
            Workouts ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="schemas">
            Schema&apos;s &amp; Routines ({routines.length})
          </TabsTrigger>
          <TabsTrigger value="oefeningen">
            Oefeningen
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Sessies */}
        <TabsContent value="sessies" className="space-y-4">
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {session.snapshot.routineDayName || session.snapshot.routineName || "Workout Sessie"}
                        </span>
                        <Badge variant={session.status === "afgerond" ? "success" : "default"}>
                          {session.status === "afgerond" ? "Voltooid" : session.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {session.calendarDate} &bull; {session.snapshot.exercises.length} geplande oefeningen
                        {session.overallRpe ? ` &bull; RPE ${session.overallRpe}` : ""}
                      </p>
                      {session.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-0.5">
                          &ldquo;{session.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge variant="outline" className="text-xs">
                        {session.provenance.source === "demo" ? "Demodata" : "Echt"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Play className="w-6 h-6 fill-current ml-0.5" />}
              title="Geen workouts gevonden"
              description="Je hebt nog geen voltooide of actieve trainingssessies gelogd. Start direct een training of kies een routine."
              actionLabel="Start Lege Workout"
              onAction={() => setIsDialogOpen(true)}
              secondaryAction={
                <Button variant="outline" onClick={() => setActiveTab("schemas")}>
                  Maak je eerste schema
                </Button>
              }
            />
          )}
        </TabsContent>

        {/* Tab 2: Schema's & Routines */}
        <TabsContent value="schemas" className="space-y-4">
          <RoutineList />
        </TabsContent>

        {/* Tab 3: Oefeningenbibliotheek */}
        <TabsContent value="oefeningen" className="space-y-4">
          <ExerciseLibrary />
        </TabsContent>
      </Tabs>

      {/* Dialoog voor starten van workout */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setErrorMessage("");
        }}
        title="Nieuwe Workout Starten"
        description="Configureer de basissessie om direct je oefeningen en sets te loggen."
      >
        <form onSubmit={handleStartWorkout} className="space-y-4">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          <FormField
            id="workout-name"
            label="Naam van de Workout"
            required
            helperText="Bijv. Borst & Triceps, Leg Day of Full Body"
          >
            <Input
              id="workout-name"
              placeholder="Bijv. Borst & Triceps"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              hasError={Boolean(errorMessage)}
              autoFocus
            />
          </FormField>

          <FormField
            id="workout-focus"
            label="Doel / Focus van de training"
          >
            <Select
              id="workout-focus"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
            >
              <option value="Hypertrofie (Spiermassa)">Hypertrofie (Spiermassa)</option>
              <option value="Kracht (Hoge intensiteit, lage reps)">Kracht (Hoge intensiteit, lage reps)</option>
              <option value="Krachtuithoudingsvermogen">Krachtuithoudingsvermogen</option>
              <option value="Licht herstel & techniek">Licht herstel &amp; techniek</option>
            </Select>
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
              Start Training
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
