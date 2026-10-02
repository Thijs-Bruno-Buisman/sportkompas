"use client";

import React, { useState } from "react";
import { User, Scale, Settings, Database, Moon, Sun, Monitor, ShieldCheck, Download, Upload } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export default function ProfielPage() {
  const { theme, setTheme } = useTheme();

  // Lokale state voor profielformulier
  const [name, setName] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [gender, setGender] = useState("man");
  const [activityLevel, setActivityLevel] = useState("gemiddeld");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-500" />
          Profiel &amp; Instellingen
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Beheer je persoonlijke parameters, thema en lokale data.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="persoonlijk">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="persoonlijk">Persoonlijke Gegevens</TabsTrigger>
          <TabsTrigger value="metingen">Metingen &amp; Gewicht</TabsTrigger>
          <TabsTrigger value="voorkeuren">Voorkeuren &amp; Opslag</TabsTrigger>
        </TabsList>

        {/* Tab 1: Persoonlijke Gegevens */}
        <TabsContent value="persoonlijk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basisparameters</CardTitle>
              <CardDescription>
                Deze waarden worden gebruikt voor de berekening van BMR, TDEE en caloriebehoeften.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {savedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Profielgegevens succesvol bijgewerkt!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="profile-name" label="Naam / Roepnaam">
                    <Input
                      id="profile-name"
                      placeholder="Jouw naam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FormField>

                  <FormField id="profile-gender" label="Geslacht">
                    <Select
                      id="profile-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="man">Man</option>
                      <option value="vrouw">Vrouw</option>
                      <option value="anders">Anders</option>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="profile-height"
                    label="Lengte (cm)"
                    helperText="Bijv. 182"
                  >
                    <Input
                      id="profile-height"
                      type="number"
                      min="100"
                      max="250"
                      inputMode="numeric"
                      placeholder="180"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                  </FormField>

                  <FormField
                    id="profile-weight"
                    label="Gewicht (kg)"
                    helperText="Bijv. 78.5"
                  >
                    <Input
                      id="profile-weight"
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      inputMode="decimal"
                      placeholder="75.0"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                    />
                  </FormField>
                </div>

                <FormField id="profile-activity" label="Activiteitsniveau">
                  <Select
                    id="profile-activity"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                  >
                    <option value="sedentair">Sedentair (weinig of geen lichaamsbeweging)</option>
                    <option value="licht">Licht actief (1-3 dagen training/sport)</option>
                    <option value="gemiddeld">Gemiddeld actief (3-5 dagen training/sport)</option>
                    <option value="zeer">Zeer actief (6-7 dagen intensieve sport)</option>
                  </Select>
                </FormField>

                <div className="pt-2">
                  <Button type="submit">
                    Gegevens Opslaan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Metingen */}
        <TabsContent value="metingen" className="space-y-4">
          <EmptyState
            icon={<Scale className="w-6 h-6" />}
            title="Nog geen lichaamsmetingen gelogd"
            description="In stap 07 koppelen we het gewichts- en omtreklogboek aan IndexedDB."
            actionLabel="Start Metingen In Stap 07"
            actionHref="#persoonlijk"
          />
        </TabsContent>

        {/* Tab 3: Voorkeuren & Opslag */}
        <TabsContent value="voorkeuren" className="space-y-4">
          {/* Thema Kiezer */}
          <Card>
            <CardHeader>
              <CardTitle>Thema &amp; Weergave</CardTitle>
              <CardDescription>
                Kies tussen het donkere thema, lichte thema of volg je apparaatinstelling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                    theme === "dark"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Donker (Standaard)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                    theme === "light"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Licht</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-center gap-2.5 transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                    theme === "system"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Systeem</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Lokale Opslag & Veiligheid */}
          <Card>
            <CardHeader>
              <CardTitle>Lokale Opslag &amp; Back-up</CardTitle>
              <CardDescription>
                SportKompas slaat al je data 100% lokaal op via IndexedDB in je browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Offline-first persistentie actief
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Geen externe tracking, cookies of advertenties.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => alert("Volledige exportfunctie wordt aangesloten in Stap 37.")}
                >
                  Exporteer Back-up (JSON)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={() => alert("Importfunctie wordt aangesloten in Stap 37.")}
                >
                  Importeer Back-up
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
