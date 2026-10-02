"use client";

import React, { useState } from "react";
import { Activity, Plus, Timer, Footprints, Flame, Bike, Heart } from "lucide-react";
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

export default function CardioPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState("hardlopen");
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveCardio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distanceKm || Number(distanceKm) <= 0) {
      setErrorMessage("Voer een geldige afstand in kilometers in.");
      return;
    }
    if (!durationMin || Number(durationMin) <= 0) {
      setErrorMessage("Voer een geldige duur in minuten in.");
      return;
    }

    setErrorMessage("");
    setIsDialogOpen(false);
    alert(`Cardiosessie opgeslagen: ${activityType} - ${distanceKm} km in ${durationMin} min`);
    setDistanceKm("");
    setDurationMin("");
    setAvgHeartRate("");
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
          <TabsTrigger value="activiteiten">Sessies</TabsTrigger>
          <TabsTrigger value="statistieken">Statistieken</TabsTrigger>
        </TabsList>

        <TabsContent value="activiteiten" className="space-y-4">
          <EmptyState
            icon={<Timer className="w-6 h-6" />}
            title="Nog geen cardio gelogd"
            description="Je hebt nog geen cardiotrainingen geregistreerd. Voer een voltooide sessie handmatig in."
            actionLabel="Sessie Toevoegen"
            onAction={() => setIsDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="statistieken" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Afstand deze week
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                0.0 <span className="text-sm font-normal text-slate-400">km</span>
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tijd in beweging
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                0 <span className="text-sm font-normal text-slate-400">min</span>
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Calorieverbruik
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                0 <span className="text-sm font-normal text-slate-400">kcal (schatting)</span>
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
              onChange={(e) => setActivityType(e.target.value)}
            >
              <option value="hardlopen">Hardlopen (Buiten / Baan)</option>
              <option value="fietsen">Wielrennen / Fietsen</option>
              <option value="loopband">Loopband (Binnen)</option>
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
              helperText="Bijv. 5.2"
            >
              <Input
                id="distance-km"
                type="number"
                step="0.01"
                min="0"
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

