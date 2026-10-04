"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useAi } from "@/lib/hooks/useAi";
import {
  buildOverloadContext,
  sanitizeOverloadSuggestion,
  type AiOverloadProposal,
  AI_OVERLOAD_DISCLAIMER,
} from "@/domain/ai/overloadAdvisor";
import type { Exercise, WorkoutSet } from "@/types/database";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Repeat,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface AiOverloadAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  previousWorksets?: WorkoutSet[];
  currentTargetWeightKg?: number | null;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetSets?: number;
  onAccept: (proposal: AiOverloadProposal) => void;
}

export function AiOverloadAdvisorModal({
  isOpen,
  onClose,
  exercise,
  previousWorksets = [],
  currentTargetWeightKg = null,
  targetRepsMin = 8,
  targetRepsMax = 12,
  targetSets = 3,
  onAccept,
}: AiOverloadAdvisorModalProps) {
  const { requestAiTask, isLoading: isAiCalling, error: aiError, status: aiStatus } = useAi();

  const [proposal, setProposal] = useState<AiOverloadProposal | null>(null);
  const [userNote, setUserNote] = useState("");
  const [isAccepted, setIsAccepted] = useState(false);
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Genereert of ververst de suggestie
  const generateSuggestion = useCallback(
    async (customNote?: string) => {
      if (!exercise) return;
      setIsGenerating(true);
      setIsAccepted(false);

      const context = buildOverloadContext({
        exercise,
        previousWorksets,
        targetSets,
        targetRepsMin,
        targetRepsMax,
        currentTargetWeightKg,
        userNote: customNote || userNote || undefined,
      });

      try {
        const response = await requestAiTask(
          "overload_suggestions",
          context as unknown as Record<string, unknown>,
          customNote || userNote || undefined
        );

        if (response && response.structuredData) {
          const sanitized = sanitizeOverloadSuggestion(
            response.structuredData as any,
            context
          );
          sanitized.source = response.modelUsed.includes("gemini")
            ? "gemini"
            : "lokale_heuristiek";
          setProposal(sanitized);
        } else {
          // Lokale veilige fallback als AI offline of gefaald is
          const fallbackProposal = sanitizeOverloadSuggestion(null, context);
          setProposal(fallbackProposal);
        }
      } catch (err) {
        console.error("Fout bij genereren AI overload:", err);
        const fallbackProposal = sanitizeOverloadSuggestion(null, context);
        setProposal(fallbackProposal);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      exercise,
      previousWorksets,
      targetSets,
      targetRepsMin,
      targetRepsMax,
      currentTargetWeightKg,
      userNote,
      requestAiTask,
    ]
  );

  // Initialiseer wanneer modal opent
  useEffect(() => {
    if (isOpen && exercise) {
      setUserNote("");
      setIsAccepted(false);
      generateSuggestion();
    }
  }, [isOpen, exercise]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!exercise) return null;

  const handleConfirmAccept = () => {
    if (!proposal) return;
    setIsAccepted(true);
    onAccept(proposal);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const getActionBadge = () => {
    if (!proposal) return null;
    switch (proposal.action) {
      case "increase_weight":
        return (
          <Badge variant="success" className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Gewichtsverhoging (+{proposal.weightDeltaKg} kg)
          </Badge>
        );
      case "reduce_assistance":
        return (
          <Badge variant="success" className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Minder machinehulp ({proposal.weightDeltaKg} kg)
          </Badge>
        );
      case "increase_reps":
        return (
          <Badge variant="outline" className="text-xs font-semibold flex items-center gap-1 text-blue-600 dark:text-blue-400 border-blue-500/30">
            <Repeat className="w-3.5 h-3.5" />
            Herhalingen opbouwen
          </Badge>
        );
      case "maintain_weight":
      default:
        return (
          <Badge variant="warning" className="text-xs font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Consolideren &amp; herstellen
          </Badge>
        );
    }
  };

  const getConfidenceBadge = () => {
    if (!proposal) return null;
    const variantMap: Record<string, "success" | "warning" | "default"> = {
      hoog: "success",
      gemiddeld: "warning",
      laag: "default",
    };
    return (
      <Badge variant={variantMap[proposal.confidence] || "default"} className="text-[11px]">
        Betrouwbaarheid: {proposal.confidence}
      </Badge>
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="AI Overload Assistent"
      description={`Slim trainingsadvies voor ${exercise.name} conform dubbele progressie.`}
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* BOVENBALK MET STATUS EN MODEL INFO */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-foreground">
              {exercise.name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({exercise.equipment})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {proposal && getConfidenceBadge()}
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
                Trainingsdata en herstel analyseren...
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluatie van eerdere sets en dubbele progressie criteria
              </p>
            </div>
          </div>
        ) : proposal ? (
          <div className="space-y-4">
            {/* ACTION STATUS BADGE */}
            <div className="flex items-center justify-between">
              {getActionBadge()}
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                (schatting)
              </span>
            </div>

            {/* VERGELIJKINGSKAART: HUIDIG VS VOORGESTELD */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs">
              <div className="grid grid-cols-2 items-center gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">
                    Huidig Referentie
                  </span>
                  <div className="text-xl font-bold text-foreground">
                    {proposal.currentWeightKg}{" "}
                    <span className="text-xs font-normal text-muted-foreground">kg</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    {targetRepsMin}-{targetRepsMax} reps
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center relative overflow-hidden">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300 block mb-0.5 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    AI Doelstelling
                  </span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    {proposal.suggestedWeightKg}
                    <span className="text-xs font-normal text-emerald-600/80">kg</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                    {proposal.targetReps} reps &bull; (schatting)
                  </span>
                </div>
              </div>

              {proposal.weightDeltaKg !== 0 && (
                <div className="mt-3 pt-2.5 border-t border-border/50 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    Verandering:{" "}
                    <strong className="text-foreground font-semibold">
                      {proposal.weightDeltaKg > 0 ? `+${proposal.weightDeltaKg}` : proposal.weightDeltaKg} kg
                    </strong>{" "}
                    per set (stapgrootte: {proposal.equipmentStepKg} kg).
                  </span>
                </div>
              )}
            </div>

            {/* ONDERBOUWING / RATIONALE */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-border text-xs text-foreground/90 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                <span>Onderbouwing van de Assistent:</span>
              </div>
              <p className="text-muted-foreground leading-normal">
                {proposal.rationale}
              </p>
            </div>

            {/* GEBRUIKERSTWEEWEG-INTERACTIE (BIJSTUREN OP DAGEIGENSCHAPPEN) */}
            <div className="space-y-2 pt-1">
              <label
                htmlFor="user-feedback-note"
                className="text-xs font-medium text-muted-foreground flex items-center justify-between"
              >
                <span>Persoonlijk gevoel toevoegen (optioneel):</span>
                <span className="text-[10px] text-muted-foreground/80">
                  bv. &apos;Schouder voelt gevoelig&apos; of &apos;Extra energiek&apos;
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="user-feedback-note"
                  type="text"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Typ een toelichting..."
                  className="flex-1 min-h-[40px] px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSuggestion(userNote)}
                  disabled={isGenerating || isAiCalling}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />}
                  className="min-h-[40px] text-xs font-semibold shrink-0"
                >
                  Herbereken
                </Button>
              </div>
            </div>

            {/* DISCLAIMER TOGGLE CONFORM AGENTS.MD REGEL 7 */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFullDisclaimer(!showFullDisclaimer)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Veiligheid &amp; niet-medisch advies</span>
                {showFullDisclaimer ? (
                  <ChevronUp className="w-3 h-3 ml-0.5" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                )}
              </button>

              {showFullDisclaimer && (
                <div className="mt-2 p-2.5 rounded-lg bg-card/60 border border-border text-[11px] text-muted-foreground leading-normal">
                  <p className="font-semibold text-foreground mb-1">
                    SportKompas AI Assistent Richtlijn
                  </p>
                  <p>{AI_OVERLOAD_DISCLAIMER}</p>
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

      {/* FOOTER MET VERPLICHTE BEVESTIGINGSKNOPPEN (REGEL 7: NOOIT AUTONOOM) */}
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
            ? `Accepteren & Toepassen (${proposal.suggestedWeightKg} kg)`
            : "Accepteren & Toepassen"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
