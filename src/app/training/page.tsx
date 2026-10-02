"use client";

import React, { useState } from "react";
import { Dumbbell, Plus, Play, Calendar, Layers, Search, Sparkles } from "lucide-react";
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

export default function TrainingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState("hypertrofie");
  const [errorMessage, setErrorMessage] = useState("");

  const handleStartWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutName.trim()) {
      setErrorMessage("Vul een naam in voor je workout.");
      return;
    }
    setErrorMessage("");
    setIsDialogOpen(false);
    // Bevestiging en startklaar voor verdere sessieopslag in Stap 12
    alert(`Nieuwe training gestart: ${workoutName}`);
    setWorkoutName("");
  };

  // Voorbeeldlijst van oefeningen inclusief lange namen voor overflow-test op 360px
  const sampleExercises = [
    {
      name: "Barbell Bench Press",
      target: "Borst (Pectoralis Major)",
      equipment: "Barbell",
    },
    {
      name: "Incline Dumbbell Overhead Triceps Extension (Single Arm)",
      target: "Armen (Triceps Brachii)",
      equipment: "Dumbbell",
    },
    {
      name: "Barbell Romanian Deadlift with Deficit Platform",
      target: "Benen & Rug (Hamstrings/Glutes)",
      equipment: "Barbell",
    },
  ];

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
      <Tabs defaultValue="sessies">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="sessies">Workouts</TabsTrigger>
          <TabsTrigger value="schemas">Schema&apos;s &amp; Routines</TabsTrigger>
          <TabsTrigger value="oefeningen">Oefeningen</TabsTrigger>
        </TabsList>

        {/* Tab 1: Sessies */}
        <TabsContent value="sessies" className="space-y-4">
          <EmptyState
            icon={<Play className="w-6 h-6 fill-current ml-0.5" />}
            title="Geen actieve workout"
            description="Je hebt momenteel geen training lopen. Start direct een lege training of selecteer een routine."
            actionLabel="Start Lege Workout"
            onAction={() => setIsDialogOpen(true)}
          />
        </TabsContent>

        {/* Tab 2: Schema's & Routines */}
        <TabsContent value="schemas" className="space-y-4">
          <EmptyState
            icon={<Layers className="w-6 h-6" />}
            title="Nog geen schema's aangemaakt"
            description="Stel trainingsroutines samen (zoals Push/Pull/Legs of Upper/Lower) om consistent te blijven."
            actionLabel="Nieuw Schema Maken"
            onAction={() => setIsDialogOpen(true)}
          />
        </TabsContent>

        {/* Tab 3: Oefeningenbibliotheek */}
        <TabsContent value="oefeningen" className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Zoek oefening op naam of spiergroep..."
              className="pl-10"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>

          <div className="space-y-3">
            {sampleExercises.map((exercise, idx) => (
              <Card key={idx} className="p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white break-words">
                      {exercise.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                      {exercise.target}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{exercise.equipment}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialoog / Modal voor het starten van een Workout */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setErrorMessage("");
        }}
        title="Nieuwe Workout Starten"
        description="Configureer de basissessie om je oefeningen en sets te loggen."
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
              <option value="hypertrofie">Hypertrofie (Spiermassa)</option>
              <option value="kracht">Kracht (Hoge intensiteit, lage reps)</option>
              <option value="uithoudingsvermogen">Krachtuithoudingsvermogen</option>
              <option value="herstel">Licht herstel &amp; techniek</option>
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
