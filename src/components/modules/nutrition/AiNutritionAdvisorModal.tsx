"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useAi } from "@/lib/hooks/useAi";
import {
  buildNutritionContext,
  sanitizeNutritionAdvice,
  applyNutritionAdviceToTargets,
  type AiNutritionProposal,
  AI_NUTRITION_DISCLAIMER,
} from "@/domain/ai/nutritionAdvisor";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import type { Profile } from "@/types/database";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Utensils,
  Dumbbell,
  Coffee,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface AiNutritionAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargets: DailyNutritionTargets;
  profile?: Profile | null;
  consumedToday?: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  initialIsTrainingDay?: boolean;
  onAccept: (newTargets: DailyNutritionTargets) => Promise<void> | void;
}

export function AiNutritionAdvisorModal({
  isOpen,
  onClose,
  currentTargets,
  profile,
  consumedToday,
  initialIsTrainingDay = true,
  onAccept,
}: AiNutritionAdvisorModalProps) {
  const { requestAiTask, isLoading: isAiCalling, error: aiError } = useAi();

  const [isTrainingDay, setIsTrainingDay] = useState(initialIsTrainingDay);
  const [proposal, setProposal] = useState<AiNutritionProposal | null>(null);
  const [userNote, setUserNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Genereer of herbereken het advies
  const generateAdvice = useCallback(
    async (trainingDayFlag: boolean, note?: string) => {
      setIsGenerating(true);
      setIsAccepted(false);

      const context = buildNutritionContext({
        profile,
        currentTargets,
        isTrainingDay: trainingDayFlag,
        consumedToday,
        userNote: note || userNote || undefined,
      });

      try {
        const response = await requestAiTask(
          "nutrition_advice",
          context as unknown as Record<string, unknown>,
          note || userNote || undefined
        );

        if (response && response.structuredData) {
          const sanitized = sanitizeNutritionAdvice(
            response.structuredData as any,
            context
          );
          sanitized.source = response.modelUsed.includes("gemini")
            ? "gemini"
            : "lokale_heuristiek";
          setProposal(sanitized);
        } else {
          // Lokale veilige fallback als AI offline of gefaald is
          const fallbackProposal = sanitizeNutritionAdvice(null, context);
          setProposal(fallbackProposal);
        }
      } catch (err) {
        console.error("Fout bij genereren AI voedingsadvies:", err);
        const fallbackProposal = sanitizeNutritionAdvice(null, context);
        setProposal(fallbackProposal);
      } finally {
        setIsGenerating(false);
      }
    },
    [profile, currentTargets, consumedToday, userNote, requestAiTask]
  );

  useEffect(() => {
    if (isOpen) {
      setUserNote("");
      setIsAccepted(false);
      setIsTrainingDay(initialIsTrainingDay);
      generateAdvice(initialIsTrainingDay);
    }
  }, [isOpen, initialIsTrainingDay]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleTrainingDay = (flag: boolean) => {
    setIsTrainingDay(flag);
    generateAdvice(flag, userNote);
  };

  const handleConfirmAccept = async () => {
    if (!proposal) return;
    setIsAccepted(true);
    const updatedTargets = applyNutritionAdviceToTargets(currentTargets, proposal);
    await onAccept(updatedTargets);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="AI Voedingsassistent & Macro-Balans"
      description="Gepersonaliseerd voedingsadvies afgestemd op trainingsdagen vs rustdagen."
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* STATUSBALK MET DAGTYPE KIEZER & MODELBRON */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg">
            <button
              type="button"
              onClick={() => handleToggleTrainingDay(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isTrainingDay
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Trainingsdag
            </button>
            <button
              type="button"
              onClick={() => handleToggleTrainingDay(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                !isTrainingDay
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              Rustdag
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              (schatting)
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {proposal?.source === "gemini" ? "Google Gemini" : "Lokale Heuristiek"}
            </Badge>
          </div>
        </div>

        {/* LOADING TOESTAND */}
        {isGenerating ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Sparkles className="w-4 h-4 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Energiebehoefte en macro-verdeling berekenen...
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isTrainingDay
                  ? "Aanpassing voor glycogeenherstel en spiereiwitsynthese"
                  : "Aanpassing voor optimaal herstel op rustdagen"}
              </p>
            </div>
          </div>
        ) : proposal ? (
          <div className="space-y-4">
            {/* HOOFDVERGELIJKING: CALORIEËN */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
              <div className="grid grid-cols-2 items-center gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">
                    Huidig Doel
                  </span>
                  <div className="text-xl font-bold text-foreground">
                    {proposal.baselineCalories}{" "}
                    <span className="text-xs font-normal text-muted-foreground">kcal</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    {currentTargets.proteinGrams}g E &bull; {currentTargets.carbsGrams}g K &bull; {currentTargets.fatGrams}g V
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center relative overflow-hidden">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300 block mb-0.5 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    AI Voorstel
                  </span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    {proposal.suggestedCalories}
                    <span className="text-xs font-normal text-emerald-600/80">kcal</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                    {proposal.calorieDeltaKcal > 0
                      ? `+${proposal.calorieDeltaKcal} kcal`
                      : proposal.calorieDeltaKcal < 0
                      ? `${proposal.calorieDeltaKcal} kcal`
                      : "Onderhoud"}{" "}
                    &bull; (schatting)
                  </span>
                </div>
              </div>

              {/* MACRONUTRIËNTEN DETAILS */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Eiwit
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {proposal.suggestedProteinGrams}g
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    (schatting)
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Koolhydraten
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {proposal.suggestedCarbsGrams}g
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    (schatting)
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Vetten
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {proposal.suggestedFatGrams}g
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    (schatting)
                  </span>
                </div>
              </div>
            </div>

            {/* AI AANBEVELINGEN LIJST */}
            {proposal.recommendations.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-border text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Praktische Richtlijnen:</span>
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-muted-foreground leading-relaxed">
                  {proposal.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ONDERBOUWING */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-border text-xs text-foreground/90 space-y-1 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                <span>Onderbouwing:</span>
              </div>
              <p className="text-muted-foreground">{proposal.rationale}</p>
            </div>

            {/* PERSOONLIJKE TOELICHTING BIJSTUREN */}
            <div className="space-y-2 pt-1">
              <label
                htmlFor="user-nutrition-note"
                className="text-xs font-medium text-muted-foreground flex items-center justify-between"
              >
                <span>Persoonlijk doel of gevoel toevoegen (optioneel):</span>
                <span className="text-[10px] text-muted-foreground/80">
                  bv. &apos;Spiermassa opbouwen&apos; of &apos;Hongerig in de ochtend&apos;
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="user-nutrition-note"
                  type="text"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Typ een toelichting..."
                  className="flex-1 min-h-[40px] px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAdvice(isTrainingDay, userNote)}
                  disabled={isGenerating || isAiCalling}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />}
                  className="min-h-[40px] text-xs font-semibold shrink-0"
                >
                  Herbereken
                </Button>
              </div>
            </div>

            {/* DISCLAIMER TOGGLE CONFORM REGEL 7 */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDisclaimer(!showDisclaimer)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Veiligheid &amp; niet-medisch voedingsadvies</span>
                {showDisclaimer ? (
                  <ChevronUp className="w-3 h-3 ml-0.5" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                )}
              </button>

              {showDisclaimer && (
                <div className="mt-2 p-2.5 rounded-lg bg-card/60 border border-border text-[11px] text-muted-foreground leading-normal">
                  <p className="font-semibold text-foreground mb-1">
                    SportKompas AI Voedingsrichtlijn
                  </p>
                  <p>{AI_NUTRITION_DISCLAIMER}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* FOUTMELDING */}
        {aiError && (
          <Alert variant="warning" className="text-xs">
            {aiError}
          </Alert>
        )}
      </div>

      {/* FOOTER MET VERPLICHTE BEVESTIGINGSKNOPPEN (REGEL 7) */}
      <DialogFooter className="pt-4 flex items-center justify-between gap-2 border-t border-border mt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isAccepted}
          className="min-h-[44px] px-4 font-semibold text-xs sm:text-sm"
        >
          Negeren
        </Button>

        <Button
          variant="primary"
          onClick={handleConfirmAccept}
          disabled={!proposal || isGenerating || isAccepted}
          leftIcon={
            isAccepted ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )
          }
          className="min-h-[44px] px-5 font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/20"
        >
          {isAccepted
            ? "Toegepast ✓"
            : proposal
            ? `Accepteren & Toepassen (${proposal.suggestedCalories} kcal)`
            : "Accepteren & Toepassen"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
