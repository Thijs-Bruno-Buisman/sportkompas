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
import type { WorkoutSession, WorkoutRoutine, RoutineDay, Exercise } from "@/types/database";

export default function TrainingPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [activeTab, setActiveTab] = useState("sessies");
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredExercises = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Oefeningen ({exercises.length})
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
          {routines.length > 0 ? (
            <div className="space-y-4">
              {routines.map((routine) => (
                <Card key={routine.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                          {routine.name}
                        </h2>
                        {routine.isActive && <Badge variant="success">Actief Programma</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {routine.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsDialogOpen(true)}
                      leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                    >
                      Start Training
                    </Button>
                  </div>

                  {/* Routine Dagen */}
                  {routineDays.length > 0 && (
                    <div className="pt-4 space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Schemadagen ({routineDays.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {routineDays.map((day) => (
                          <div
                            key={day.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                          >
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {day.name}
                            </span>
                            <div className="space-y-1">
                              {day.plannedExercises.map((pe, pIdx) => (
                                <p key={pIdx} className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                  <span>{pe.exerciseName}</span>
                                  <span className="font-mono text-[11px] text-slate-400">
                                    {pe.targetSets}x{pe.targetRepsMin}-{pe.targetRepsMax}
                                  </span>
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Layers className="w-6 h-6" />}
              title="Nog geen schema's aangemaakt"
              description="Stel trainingsroutines samen (zoals Push/Pull/Legs of Upper/Lower) om gestructureerd progressieve overload te behalen."
              actionLabel="Maak je eerste schema"
              onAction={() => setIsDialogOpen(true)}
            />
          )}
        </TabsContent>

        {/* Tab 3: Oefeningenbibliotheek */}
        <TabsContent value="oefeningen" className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Zoek oefening op naam, spiergroep of materiaal..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>

          {filteredExercises.length > 0 ? (
            <div className="space-y-3">
              {filteredExercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  className="p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white break-words">
                          {exercise.name}
                        </h3>
                        {exercise.isCustom && <Badge variant="outline">Aangepast</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                        Primaire spiergroep: <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{exercise.primaryMuscleGroup}</span>
                        {exercise.secondaryMuscleGroups.length > 0 &&
                          ` &bull; Secundair: ${exercise.secondaryMuscleGroups.join(", ")}`}
                      </p>
                      {exercise.instructions && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {exercise.instructions}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="capitalize">
                        {exercise.equipment}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Dumbbell className="w-6 h-6" />}
              title={exercises.length === 0 ? "Geen oefeningen in bibliotheek" : "Geen overeenkomende oefeningen"}
              description={
                exercises.length === 0
                  ? "Er zijn nog geen oefeningen aanwezig in deze database. Schakel eventueel de demomodus in voor een complete set basisoefeningen."
                  : `Geen resultaten gevonden voor "${searchQuery}".`
              }
              actionLabel="Oefening Toevoegen"
              onAction={() => alert("Eigen oefeningen toevoegen wordt uitgebreid in Stap 10.")}
            />
          )}
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
