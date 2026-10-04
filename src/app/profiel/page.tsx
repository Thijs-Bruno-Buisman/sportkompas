"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Scale,
  Settings,
  Database,
  Moon,
  Sun,
  Monitor,
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useProfile } from "@/lib/hooks/useProfile";
import { useDatabase } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { BackupRestoreSection } from "@/components/modules/profile/BackupRestoreSection";
import {
  parseLocalizedNumber,
  isValidBirthDate,
  metersToCm,
  cmToMeters,
  kgToLbs,
  lbsToKg,
  formatWeight,
} from "@/domain/units";
import type {
  Profile,
  TrainingGoal,
  ExperienceLevel,
  EquipmentType,
  UnitPreference,
  EnergyFormulaPreference,
} from "@/types/database";

export default function ProfielPage() {
  const { theme, setTheme } = useTheme();
  const { profile, settings, saveProfile, updateUnitPreference, isLoading, reloadProfile } =
    useProfile();
  const { isDemoMode, toggleDemoMode, resetDemoData } = useDatabase();

  // Form State
  const [name, setName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<TrainingGoal>("kracht");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("gemiddeld");
  const [strengthDays, setStrengthDays] = useState(3);
  const [cardioDays, setCardioDays] = useState(2);
  const [equipment, setEquipment] = useState<EquipmentType[]>([
    "barbell",
    "dumbbell",
    "kabel",
    "machine",
    "lichaamsgewicht",
  ]);

  const [unitPref, setUnitPref] = useState<UnitPreference>("metric");
  const [rawHeight, setRawHeight] = useState("");
  const [rawWeight, setRawWeight] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Profile["gender"]>("onbekend");
  const [formulaPreference, setFormulaPreference] =
    useState<EnergyFormulaPreference>("mifflin_st_jeor");
  const [activityLevel, setActivityLevel] =
    useState<Profile["activityLevel"]>("gemiddeld");

  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Synchroniseer formulier wanneer profiel uit IndexedDB is geladen
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPrimaryGoal(profile.primaryGoal || "kracht");
      setExperienceLevel(profile.experienceLevel || "gemiddeld");
      setStrengthDays(profile.strengthDaysPerWeek ?? 3);
      setCardioDays(profile.cardioDaysPerWeek ?? 2);
      setEquipment(
        profile.availableEquipment && profile.availableEquipment.length > 0
          ? profile.availableEquipment
          : ["barbell", "dumbbell", "kabel", "machine", "lichaamsgewicht"]
      );

      const pref = profile.unitPreference || "metric";
      setUnitPref(pref);

      if (profile.heightMeters !== null && profile.heightMeters !== undefined) {
        setRawHeight(String(metersToCm(profile.heightMeters)));
      } else {
        setRawHeight("");
      }

      if (profile.startWeightKg !== null && profile.startWeightKg !== undefined) {
        setRawWeight(
          pref === "imperial"
            ? String(kgToLbs(profile.startWeightKg))
            : String(profile.startWeightKg)
        );
      } else {
        setRawWeight("");
      }

      setBirthDate(profile.birthDate || "");
      setGender(profile.gender || "onbekend");
      setFormulaPreference(profile.formulaPreference || "mifflin_st_jeor");
      setActivityLevel(profile.activityLevel || "gemiddeld");
    }
  }, [profile]);

  const toggleEquipment = (eq: EquipmentType) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleUnitToggle = async (newPref: UnitPreference) => {
    setUnitPref(newPref);
    await updateUnitPreference(newPref);

    // Converteer het actuele getoonde gewicht in het veld naar de nieuwe eenheid
    if (rawWeight.trim() !== "") {
      const num = parseLocalizedNumber(rawWeight, "Gewicht");
      if (num !== null) {
        if (newPref === "imperial") {
          setRawWeight(String(kgToLbs(num)));
        } else {
          setRawWeight(String(lbsToKg(num)));
        }
      }
    }

    setFeedbackMessage({
      type: "success",
      text: `Weergave gewijzigd naar ${
        newPref === "metric" ? "Metrisch (kg / km)" : "Imperiaal (lbs / miles)"
      }. Opgeslagen data blijft canoniek.`,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    try {
      // 1. Valideer optionele geboortedatum
      if (birthDate.trim() !== "") {
        const dateCheck = isValidBirthDate(birthDate.trim());
        if (!dateCheck.valid) {
          setFeedbackMessage({
            type: "error",
            text: dateCheck.error || "Geboortedatum is ongeldig.",
          });
          return;
        }
      }

      // 2. Parseer gewicht met komma- en punt-ondersteuning
      let parsedWeightKg: number | null = null;
      if (rawWeight.trim() !== "") {
        const weightValue = parseLocalizedNumber(rawWeight, "Lichaamsgewicht");
        if (weightValue !== null) {
          if (weightValue < 20 || weightValue > 400) {
            setFeedbackMessage({
              type: "error",
              text: "Lichaamsgewicht moet tussen 20 en 400 liggen.",
            });
            return;
          }
          parsedWeightKg =
            unitPref === "imperial" ? lbsToKg(weightValue) : weightValue;
        }
      }

      // 3. Parseer lengte in cm naar canonieke meters
      let parsedHeightMeters: number | null = null;
      if (rawHeight.trim() !== "") {
        const heightCm = parseLocalizedNumber(rawHeight, "Lengte");
        if (heightCm !== null) {
          if (heightCm < 50 || heightCm > 260) {
            setFeedbackMessage({
              type: "error",
              text: "Lengte in centimeters moet tussen 50 en 260 cm liggen.",
            });
            return;
          }
          parsedHeightMeters = cmToMeters(heightCm);
        }
      }

      setIsSaving(true);

      const profilePayload: Omit<Profile, "id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        birthDate: birthDate.trim() || null,
        gender,
        heightMeters: parsedHeightMeters,
        startWeightKg: parsedWeightKg,
        targetWeightKg: profile?.targetWeightKg ?? null,
        activityLevel,
        primaryGoal,
        experienceLevel,
        strengthDaysPerWeek: strengthDays,
        cardioDaysPerWeek: cardioDays,
        availableEquipment: equipment,
        unitPreference: unitPref,
        formulaPreference,
        onboardingCompleted: true,
      };

      await saveProfile(profilePayload);

      setFeedbackMessage({
        type: "success",
        text: "Profielgegevens succesvol opgeslagen in IndexedDB!",
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Er is een fout opgetreden bij het opslaan.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const equipmentOptions: { id: EquipmentType; label: string }[] = [
    { id: "barbell", label: "Barbell (Halterstang)" },
    { id: "dumbbell", label: "Dumbbells" },
    { id: "kabel", label: "Kabelstation" },
    { id: "machine", label: "Apparaten" },
    { id: "lichaamsgewicht", label: "Lichaamsgewicht" },
    { id: "elastiek", label: "Weerstandsbanden" },
    { id: "cardio_apparatuur", label: "Cardiotoestellen" },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-500" />
          Profiel &amp; Instellingen
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Beheer je persoonlijke parameters, eenheden, thema en lokale data.
        </p>
      </div>

      {feedbackMessage && (
        <Alert
          variant={feedbackMessage.type === "success" ? "success" : "error"}
          onDismiss={() => setFeedbackMessage(null)}
        >
          {feedbackMessage.text}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="persoonlijk">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="persoonlijk">Persoonlijk Profiel</TabsTrigger>
          <TabsTrigger value="voorkeuren">Eenheden &amp; Thema</TabsTrigger>
          <TabsTrigger value="metingen">Lichaamsmetingen</TabsTrigger>
        </TabsList>

        {/* Tab 1: Persoonlijk Profiel */}
        <TabsContent value="persoonlijk" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Basisparameters &amp; Trainingsdoelen</CardTitle>
                  <CardDescription>
                    Alle velden zijn optioneel en kunnen op elk gewenst moment worden aangepast.
                  </CardDescription>
                </div>
                <Badge variant={profile?.onboardingCompleted ? "success" : "default"}>
                  {profile?.onboardingCompleted ? "Profiel Actief" : "Onvolledig"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Naam en Doel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="profile-name"
                    label="Naam / Roepnaam (Optioneel)"
                    helperText="Hoe SportKompas je aanspreekt"
                  >
                    <Input
                      id="profile-name"
                      placeholder="Jouw naam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FormField>

                  <FormField
                    id="profile-goal"
                    label="Primair Trainingsdoel"
                  >
                    <Select
                      id="profile-goal"
                      value={primaryGoal}
                      onChange={(e) =>
                        setPrimaryGoal(e.target.value as TrainingGoal)
                      }
                    >
                      <option value="kracht">Krachtopbouw (1RM verhogen)</option>
                      <option value="spieropbouw">Spieropbouw / Hypertrofie</option>
                      <option value="conditie">Conditie &amp; Uithoudingsvermogen</option>
                      <option value="afvallen">Afvallen &amp; Vetverlies</option>
                      <option value="fit_blijven">Fit &amp; Gezond blijven</option>
                      <option value="onbekend">Onbekend / Geen specifieke voorkeur</option>
                    </Select>
                  </FormField>
                </div>

                {/* Ervaring en Activiteitsniveau */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField id="profile-exp" label="Ervaringsniveau">
                    <Select
                      id="profile-exp"
                      value={experienceLevel}
                      onChange={(e) =>
                        setExperienceLevel(e.target.value as ExperienceLevel)
                      }
                    >
                      <option value="beginner">Beginner (&lt; 1 jaar ervaring)</option>
                      <option value="gemiddeld">Gemiddeld (1 - 3 jaar gestructureerd)</option>
                      <option value="gevorderd">Gevorderd (3+ jaar ervaring)</option>
                      <option value="onbekend">Onbekend</option>
                    </Select>
                  </FormField>

                  <FormField id="profile-activity" label="Activiteitsniveau buiten training">
                    <Select
                      id="profile-activity"
                      value={activityLevel}
                      onChange={(e) =>
                        setActivityLevel(
                          e.target.value as Profile["activityLevel"]
                        )
                      }
                    >
                      <option value="sedentair">Sedentair (kantoorbaan, weinig beweging)</option>
                      <option value="licht">Licht actief (staand werk, dagelijks wandelen)</option>
                      <option value="gemiddeld">Gemiddeld actief (fysiek actief werk)</option>
                      <option value="zeer">Zeer actief (zware fysieke arbeid)</option>
                      <option value="onbekend">Onbekend</option>
                    </Select>
                  </FormField>
                </div>

                {/* Trainingsritme per week */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="profile-strength-days"
                    label="Krachttrainingsdagen per week"
                  >
                    <Select
                      id="profile-strength-days"
                      value={strengthDays}
                      onChange={(e) => setStrengthDays(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          {d} {d === 1 ? "dag" : "dagen"} per week
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    id="profile-cardio-days"
                    label="Cardiodagen per week"
                  >
                    <Select
                      id="profile-cardio-days"
                      value={cardioDays}
                      onChange={(e) => setCardioDays(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          {d} {d === 1 ? "dag" : "dagen"} per week
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                {/* Apparatuur selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Beschikbare Uitrusting
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {equipmentOptions.map((opt) => {
                      const isSelected = equipment.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleEquipment(opt.id)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optionele Lichaamsparameters */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Scale className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Optionele Lichaamsgegevens (Komma &bull; Punt ondersteund)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      id="profile-height"
                      label="Lengte (in cm)"
                      helperText="Optioneel (bv. 182)"
                    >
                      <Input
                        id="profile-height"
                        placeholder="182"
                        value={rawHeight}
                        onChange={(e) => setRawHeight(e.target.value)}
                      />
                    </FormField>

                    <FormField
                      id="profile-weight"
                      label={`Lichaamsgewicht (in ${
                        unitPref === "metric" ? "kg" : "lbs"
                      })`}
                      helperText="Optioneel (bv. 82,5 of 82.5)"
                    >
                      <Input
                        id="profile-weight"
                        placeholder={
                          unitPref === "metric" ? "Bijv. 82,5" : "Bijv. 180"
                        }
                        value={rawWeight}
                        onChange={(e) => setRawWeight(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      id="profile-birth"
                      label="Geboortedatum (Optioneel)"
                      helperText="YYYY-MM-DD"
                    >
                      <Input
                        id="profile-birth"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </FormField>

                    <FormField id="profile-gender" label="Geslacht (Optioneel)">
                      <Select
                        id="profile-gender"
                        value={gender}
                        onChange={(e) =>
                          setGender(e.target.value as Profile["gender"])
                        }
                      >
                        <option value="onbekend">Onbekend / Niet opgeven</option>
                        <option value="man">Man</option>
                        <option value="vrouw">Vrouw</option>
                        <option value="anders">Anders</option>
                      </Select>
                    </FormField>
                  </div>

                  <FormField
                    id="profile-formula"
                    label="Energieformule Voorkeur (Optioneel)"
                    helperText="Gebruikt in Stap 09 voor BMR / caloriebehoefte berekening"
                  >
                    <Select
                      id="profile-formula"
                      value={formulaPreference}
                      onChange={(e) =>
                        setFormulaPreference(
                          e.target.value as EnergyFormulaPreference
                        )
                      }
                    >
                      <option value="mifflin_st_jeor">
                        Mifflin-St Jeor (Aanbevolen)
                      </option>
                      <option value="katch_mcardle">
                        Katch-McArdle (Op basis van vetvrije massa)
                      </option>
                      <option value="onbekend">Later bepalen</option>
                    </Select>
                  </FormField>
                </div>

                <div className="pt-2">
                  <Button type="submit" isLoading={isSaving}>
                    Wijzigingen Opslaan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Eenheden & Thema */}
        <TabsContent value="voorkeuren" className="space-y-4">
          {/* Weergave Eenheden (Metric vs Imperial) */}
          <Card>
            <CardHeader>
              <CardTitle>Voorkeur voor Eenheden</CardTitle>
              <CardDescription>
                Kies tussen het metrische of imperiale stelsel.
                Alle gegevens blijven onder de motorkap altijd zuiver canoniek opgeslagen in kg en meters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleUnitToggle("metric")}
                  className={`min-h-[56px] p-4 rounded-2xl border flex flex-col items-start gap-1 transition-all cursor-pointer ${
                    unitPref === "metric"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold">Metrisch Stelsel</span>
                    {unitPref === "metric" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Gewichten in kg &bull; Afstanden in km &bull; Lengtes in cm
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnitToggle("imperial")}
                  className={`min-h-[56px] p-4 rounded-2xl border flex flex-col items-start gap-1 transition-all cursor-pointer ${
                    unitPref === "imperial"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold">Imperiaal Stelsel</span>
                    {unitPref === "imperial" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Gewichten in lbs &bull; Afstanden in miles &bull; Lengtes in feet/inch
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

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
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
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
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
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
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Systeem</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Demomodus & Testomgeving Kaart */}
          <Card className={isDemoMode ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/10" : ""}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>Demomodus &amp; Testomgeving</span>
                    {isDemoMode && (
                      <Badge variant="warning" className="text-xs">
                        Actief
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Verken SportKompas met realistische voorbeelddata in een afgeschermde database (SportKompasDemoDB).
                  </CardDescription>
                </div>
                <Badge variant={isDemoMode ? "warning" : "default"}>
                  {isDemoMode ? "SportKompasDemoDB" : "SportKompasDB (Echt)"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p>
                  In demomodus beschik je over een complete fictieve trainingsgeschiedenis (4 weken workouts met progressieve overload, PR&apos;s, duursport en voeding).
                </p>
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  🛡️ <strong>Dataveiligheid:</strong> Wisselen tussen modi raakt nooit je echte gegevens. Nieuwe gebruikers starten altijd 100% leeg en schoon in de echte database.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {isDemoMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10"
                      onClick={async () => {
                        if (confirm("Weet je zeker dat je alle demodata wilt herstellen naar de beginwaarden?")) {
                          await resetDemoData();
                          setFeedbackMessage({
                            type: "success",
                            text: "Demodata succesvol gereset naar de schone voorbeeldstatus!",
                          });
                        }
                      }}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      Reset Demodata
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={async () => {
                        await toggleDemoMode(false);
                        setFeedbackMessage({
                          type: "success",
                          text: "Demomodus uitgeschakeld. Je bevindt je nu in je eigen echte database (SportKompasDB).",
                        });
                      }}
                    >
                      Demomodus Uitschakelen
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={async () => {
                      await toggleDemoMode(true);
                      setFeedbackMessage({
                        type: "success",
                        text: "Demomodus ingeschakeld! Je verkent nu SportKompas met de voorbeelddata van Alex.",
                      });
                    }}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Demomodus Inschakelen (Voorbeelddata)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lokale Opslag & Data-soevereiniteit */}
          <BackupRestoreSection
            lastBackupAt={settings?.lastBackupAt}
            onDataRestored={reloadProfile}
          />
        </TabsContent>

        {/* Tab 3: Lichaamsmetingen */}
        <TabsContent value="metingen" className="space-y-4">
          <EmptyState
            icon={<Scale className="w-6 h-6" />}
            title="Nog geen metingen gelogd"
            description="Lichaamsmetingen en gewichtstracking worden volledig gekoppeld in Stap 07."
            actionLabel="Naar Profiel Gegevens"
            actionHref="#persoonlijk"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
