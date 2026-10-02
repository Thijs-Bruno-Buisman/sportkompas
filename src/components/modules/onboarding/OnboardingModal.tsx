"use client";

import React, { useState } from "react";
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  Dumbbell,
  Heart,
  Scale,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  parseLocalizedNumber,
  isValidBirthDate,
  cmToMeters,
  lbsToKg,
  kgToLbs,
} from "@/domain/units";
import type {
  Profile,
  TrainingGoal,
  ExperienceLevel,
  EquipmentType,
  UnitPreference,
  EnergyFormulaPreference,
} from "@/types/database";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (
    data: Omit<Profile, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [unitPreference, setUnitPreference] = useState<UnitPreference>("metric");
  const [rawHeight, setRawHeight] = useState(""); // in cm of inches
  const [rawWeight, setRawWeight] = useState(""); // in kg of lbs
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Profile["gender"]>("onbekend");
  const [formulaPreference, setFormulaPreference] =
    useState<EnergyFormulaPreference>("mifflin_st_jeor");
  const [activityLevel, setActivityLevel] =
    useState<Profile["activityLevel"]>("gemiddeld");

  if (!isOpen) return null;

  const toggleEquipment = (eq: EquipmentType) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleNextStep = () => {
    setErrorMessage("");
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // 1. Valideer optionele geboortedatum indien ingevuld
      if (birthDate.trim() !== "") {
        const dateCheck = isValidBirthDate(birthDate.trim());
        if (!dateCheck.valid) {
          setErrorMessage(dateCheck.error || "Geboortedatum is ongeldig.");
          return;
        }
      }

      // 2. Parseer optioneel gewicht (komma en punt ondersteund)
      let parsedWeightKg: number | null = null;
      if (rawWeight.trim() !== "") {
        const weightValue = parseLocalizedNumber(rawWeight, "Lichaamsgewicht");
        if (weightValue !== null) {
          if (weightValue < 20 || weightValue > 400) {
            setErrorMessage(
              "Lichaamsgewicht moet een realistische waarde tussen 20 en 400 zijn."
            );
            return;
          }
          parsedWeightKg =
            unitPreference === "imperial"
              ? lbsToKg(weightValue)
              : weightValue;
        }
      }

      // 3. Parseer optionele lengte (cm naar meters)
      let parsedHeightMeters: number | null = null;
      if (rawHeight.trim() !== "") {
        const heightCm = parseLocalizedNumber(rawHeight, "Lengte");
        if (heightCm !== null) {
          if (heightCm < 50 || heightCm > 260) {
            setErrorMessage(
              "Lengte in centimeters moet tussen 50 en 260 cm liggen."
            );
            return;
          }
          parsedHeightMeters = cmToMeters(heightCm);
        }
      }

      setIsSubmitting(true);

      const profileData: Omit<Profile, "id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        birthDate: birthDate.trim() || null,
        gender,
        heightMeters: parsedHeightMeters,
        startWeightKg: parsedWeightKg,
        targetWeightKg: null,
        activityLevel,
        primaryGoal,
        experienceLevel,
        strengthDaysPerWeek: strengthDays,
        cardioDaysPerWeek: cardioDays,
        availableEquipment: equipment,
        unitPreference,
        formulaPreference,
        onboardingCompleted: true,
      };

      await onComplete(profileData);
    } catch (err: any) {
      setErrorMessage(err.message || "Er is een validatiefout opgetreden.");
      setIsSubmitting(false);
    }
  };

  const equipmentOptions: { id: EquipmentType; label: string }[] = [
    { id: "barbell", label: "Barbell (Halterstang)" },
    { id: "dumbbell", label: "Dumbbells" },
    { id: "kabel", label: "Kabelstation" },
    { id: "machine", label: "Fitness Apparaten" },
    { id: "lichaamsgewicht", label: "Lichaamsgewicht" },
    { id: "elastiek", label: "Weerstandsbanden" },
    { id: "cardio_apparatuur", label: "Cardiotoestellen (Loopband, Roeier)" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8 my-8 text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header met Logo & Stappenindicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-lg shadow-sm">
              🧭
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Welkom bij SportKompas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stap {step} van 3 &bull; Korte introductie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? "w-6 bg-emerald-500"
                    : s < step
                    ? "w-2 bg-emerald-500/50"
                    : "w-2 bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Formulier Content */}
        <div className="py-5 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          {/* =================================================================
              STAP 1: NAAM, DOEL & ERVARING
          ================================================================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <p>
                  SportKompas is 100% offline-first. Je data blijft lokaal in je browser.
                  We stellen enkele vragen om trainingssuggesties direct relevant te maken.
                </p>
              </div>

              <FormField
                id="onboarding-name"
                label="Hoe mogen we je noemen? (Optioneel)"
                helperText="Je roepnaam of bijnaam. Mag ook leeg blijven."
              >
                <Input
                  id="onboarding-name"
                  placeholder="Bijv. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </FormField>

              <FormField
                id="onboarding-goal"
                label="Wat is je primaire trainingsdoel?"
                helperText="Helpt bij het adviseren van trainingsvolumes en schema's."
              >
                <Select
                  id="onboarding-goal"
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value as TrainingGoal)}
                >
                  <option value="kracht">Krachtopbouw (1RM verhogen)</option>
                  <option value="spieropbouw">Spieropbouw / Hypertrofie</option>
                  <option value="conditie">Conditie &amp; Uithoudingsvermogen</option>
                  <option value="afvallen">Afvallen &amp; Vetverlies</option>
                  <option value="fit_blijven">Algemene Gezondheid &amp; Fitheid</option>
                  <option value="onbekend">Nog onbekend / Geen voorkeur</option>
                </Select>
              </FormField>

              <FormField
                id="onboarding-exp"
                label="Wat is je trainingservaring?"
              >
                <Select
                  id="onboarding-exp"
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value as ExperienceLevel)
                  }
                >
                  <option value="beginner">Beginner (&lt; 1 jaar ervaring)</option>
                  <option value="gemiddeld">Gemiddeld (1 - 3 jaar regelmatige training)</option>
                  <option value="gevorderd">Gevorderd (3+ jaar gestructureerd trainen)</option>
                  <option value="onbekend">Niet van toepassing / Weet ik niet</option>
                </Select>
              </FormField>
            </div>
          )}

          {/* =================================================================
              STAP 2: RITME & BESCHIKBARE APPARATUUR
          ================================================================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="strength-days"
                  label="Dagen krachttraining per week"
                  helperText="Gewenst aantal sessies (0 t/m 7)"
                >
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-emerald-500 shrink-0" />
                    <Select
                      id="strength-days"
                      value={strengthDays}
                      onChange={(e) => setStrengthDays(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          {d} {d === 1 ? "dag" : "dagen"} per week
                        </option>
                      ))}
                    </Select>
                  </div>
                </FormField>

                <FormField
                  id="cardio-days"
                  label="Dagen cardio per week"
                  helperText="Hardlopen, fietsen, etc. (0 t/m 7)"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                    <Select
                      id="cardio-days"
                      value={cardioDays}
                      onChange={(e) => setCardioDays(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>
                          {d} {d === 1 ? "dag" : "dagen"} per week
                        </option>
                      ))}
                    </Select>
                  </div>
                </FormField>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Welke apparatuur heb je ter beschikking?
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Klik om te selecteren of te deselecteren. Filtert later automatisch oefeningen.
                </p>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((opt) => {
                    const isSelected = equipment.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleEquipment(opt.id)}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              STAP 3: EENHEDEN & FYSIEKE GEGEVENS (ALLES OPTIONEEL)
          ================================================================= */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                <div>
                  <p className="font-semibold">Alle fysieke parameters zijn optioneel.</p>
                  <p className="mt-0.5">
                    De app werkt direct zonder calorieadvies en zonder metingen.
                    Als je ze invult, berekent SportKompas automatisch je BMR/TDEE en hartslagzones.
                  </p>
                </div>
              </div>

              {/* Voorkeur voor eenheden */}
              <FormField
                id="unit-pref"
                label="Voorkeur voor weergave van eenheden"
                helperText="Opgeslagen data blijft altijd consistent en kan later gewijzigd worden."
              >
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUnitPreference("metric")}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      unitPreference === "metric"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Metrisch (kg &bull; km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitPreference("imperial")}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      unitPreference === "imperial"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Imperiaal (lbs &bull; miles)
                  </button>
                </div>
              </FormField>

              {/* Lengte en Gewicht met komma/punt ondersteuning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="onboarding-height"
                  label={`Lengte in ${unitPreference === "metric" ? "cm" : "cm"} (Optioneel)`}
                  helperText="Voor BMI & BMR calculatie"
                >
                  <Input
                    id="onboarding-height"
                    placeholder="Bijv. 182"
                    value={rawHeight}
                    onChange={(e) => setRawHeight(e.target.value)}
                  />
                </FormField>

                <FormField
                  id="onboarding-weight"
                  label={`Lichaamsgewicht in ${unitPreference === "metric" ? "kg" : "lbs"} (Optioneel)`}
                  helperText="Accepteert komma's (bijv. 82,5)"
                >
                  <Input
                    id="onboarding-weight"
                    placeholder={unitPreference === "metric" ? "Bijv. 82,5" : "Bijv. 180"}
                    value={rawWeight}
                    onChange={(e) => setRawWeight(e.target.value)}
                  />
                </FormField>
              </div>

              {/* Geboortedatum en Geslacht */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="onboarding-birth"
                  label="Geboortedatum (Optioneel)"
                  helperText="YYYY-MM-DD voor leeftijd & hartslag"
                >
                  <Input
                    id="onboarding-birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </FormField>

                <FormField id="onboarding-gender" label="Geslacht (Optioneel)">
                  <Select
                    id="onboarding-gender"
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value as Profile["gender"])
                    }
                  >
                    <option value="onbekend">Niet opgeven / Onbekend</option>
                    <option value="man">Man</option>
                    <option value="vrouw">Vrouw</option>
                    <option value="anders">Anders</option>
                  </Select>
                </FormField>
              </div>

              {/* Formulevoorkeur voor energie-inschatting */}
              <FormField
                id="onboarding-formula"
                label="Voorkeur Formule voor Energie-inschatting (Optioneel)"
                helperText="Kies hoe BMR (ruststofwisseling) berekend mag worden."
              >
                <Select
                  id="onboarding-formula"
                  value={formulaPreference}
                  onChange={(e) =>
                    setFormulaPreference(
                      e.target.value as EnergyFormulaPreference
                    )
                  }
                >
                  <option value="mifflin_st_jeor">
                    Mifflin-St Jeor (Aanbevolen standaard, nauwkeurig)
                  </option>
                  <option value="katch_mcardle">
                    Katch-McArdle (Gebaseerd op vetvrije massa)
                  </option>
                  <option value="onbekend">Geen voorkeur / Later bepalen</option>
                </Select>
              </FormField>
            </div>
          )}
        </div>

        {/* Footer Knoppen */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Vorige
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNextStep}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Volgende Stap
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Profiel Opslaan &amp; Starten
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
