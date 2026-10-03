"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ProgressiveOverloadSuggestion } from "@/domain/strength/progressiveOverload";
import {
  TrendingUp,
  Repeat,
  ShieldCheck,
  HelpCircle,
  Check,
  Sparkles,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ProgressiveOverloadCardProps {
  suggestion: ProgressiveOverloadSuggestion;
  onApplySuggestion?: (suggestedWeightKg: number, suggestedReps: number) => void;
  onDismiss?: () => void;
  className?: string;
  isCompact?: boolean;
}

export function ProgressiveOverloadCard({
  suggestion,
  onApplySuggestion,
  onDismiss,
  className = "",
  isCompact = false,
}: ProgressiveOverloadCardProps) {
  const [isApplied, setIsApplied] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const getActionConfig = () => {
    switch (suggestion.action) {
      case "increase_weight":
        return {
          icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
          badgeVariant: "success" as const,
          bgColor: "bg-emerald-500/10 dark:bg-emerald-950/20",
          borderColor: "border-emerald-500/30",
          titleColor: "text-emerald-700 dark:text-emerald-300",
          badgeText: `Gewichtsverhoging (+${suggestion.weightChangeKg} kg)`,
        };
      case "reduce_assistance":
        return {
          icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
          badgeVariant: "success" as const,
          bgColor: "bg-emerald-500/10 dark:bg-emerald-950/20",
          borderColor: "border-emerald-500/30",
          titleColor: "text-emerald-700 dark:text-emerald-300",
          badgeText: `Minder hulp (${suggestion.weightChangeKg} kg)`,
        };
      case "increase_reps":
        return {
          icon: <Repeat className="w-4 h-4 text-blue-500" />,
          badgeVariant: "outline" as const,
          bgColor: "bg-blue-500/10 dark:bg-blue-950/20",
          borderColor: "border-blue-500/30",
          titleColor: "text-blue-700 dark:text-blue-300",
          badgeText: "Herhalingen opbouwen",
        };
      case "maintain_weight":
        return {
          icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
          badgeVariant: "warning" as const,
          bgColor: "bg-amber-500/10 dark:bg-amber-950/20",
          borderColor: "border-amber-500/30",
          titleColor: "text-amber-700 dark:text-amber-300",
          badgeText: "Consolideren & herstellen",
        };
      case "insufficient_data":
      default:
        return {
          icon: <HelpCircle className="w-4 h-4 text-slate-500" />,
          badgeVariant: "default" as const,
          bgColor: "bg-slate-100 dark:bg-slate-900/40",
          borderColor: "border-border",
          titleColor: "text-muted-foreground",
          badgeText: "Eerste sessie / nulmeting",
        };
    }
  };

  const config = getActionConfig();

  const handleApply = () => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion.suggestedWeightKg, suggestion.suggestedRepsMin);
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 3000);
    }
  };

  if (isCompact) {
    return (
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${config.bgColor} ${config.borderColor} ${className}`}
      >
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <span className="font-semibold text-foreground">
              Voorstel: {suggestion.suggestedWeightKg} kg × {suggestion.suggestedRepsMin} reps
            </span>
            <span className="text-muted-foreground ml-2 hidden sm:inline">
              ({suggestion.actionLabel})
            </span>
          </div>
        </div>

        {onApplySuggestion && suggestion.action !== "insufficient_data" && (
          <Button
            size="sm"
            variant={isApplied ? "outline" : "primary"}
            onClick={handleApply}
            className="h-8 text-xs font-semibold shrink-0"
          >
            {isApplied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Toegepast
              </>
            ) : (
              "Pas toe"
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`p-4 sm:p-5 border transition-all ${config.bgColor} ${config.borderColor} ${className}`}
    >
      {/* HEADER MET BADGE EN TITEL */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-card/80 border border-border shadow-xs">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dubbele Progressie Voorstel
              </span>
              <Badge variant={config.badgeVariant} className="text-[11px] font-semibold">
                {config.badgeText}
              </Badge>
            </div>
            <h4 className={`text-base sm:text-lg font-bold ${config.titleColor} mt-0.5`}>
              {suggestion.actionLabel}
            </h4>
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-full"
            title="Verberg voorstel"
          >
            &times;
          </Button>
        )}
      </div>

      {/* VERGELIJKING: HUIDIG vs VOORGESTELD */}
      {suggestion.action !== "insufficient_data" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5 bg-card/80 p-3 rounded-xl border border-border">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs">
            <span className="text-muted-foreground">Vorige referentie:</span>
            <span className="font-bold text-foreground">
              {suggestion.currentWeightKg} kg
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
              Voorgesteld doel:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {suggestion.suggestedWeightKg} kg &bull;{" "}
              {suggestion.suggestedRepsMin === suggestion.suggestedRepsMax
                ? `${suggestion.suggestedRepsMin}`
                : `${suggestion.suggestedRepsMin}-${suggestion.suggestedRepsMax}`}{" "}
              reps
            </span>
          </div>
        </div>
      )}

      {/* RATIONALE UITLEG */}
      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-3">
        {suggestion.rationale}
      </p>

      {/* RPE CONTEXT */}
      {suggestion.rpeContext && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-3 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{suggestion.rpeContext}</span>
        </div>
      )}

      {/* ACTIEKNOPPEN EN DISCLAIMER TOGGLE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
        <button
          type="button"
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 text-left transition-colors"
        >
          <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Adviesprincipe & toelichting</span>
          {showDisclaimer ? (
            <ChevronUp className="w-3 h-3 ml-0.5" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-0.5" />
          )}
        </button>

        {onApplySuggestion && suggestion.action !== "insufficient_data" && (
          <Button
            variant={isApplied ? "outline" : "primary"}
            size="md"
            onClick={handleApply}
            disabled={isApplied}
            leftIcon={
              isApplied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
            className="min-h-[44px] sm:min-h-[40px] px-4 font-semibold text-xs sm:text-sm shadow-xs"
          >
            {isApplied
              ? "Toegepast op resterende sets ✓"
              : `Pas toe (${suggestion.suggestedWeightKg} kg × ${suggestion.suggestedRepsMin})`}
          </Button>
        )}
      </div>

      {/* UITKLAPBARE DISCLAIMER (AGENTS.md REGEL 7) */}
      {showDisclaimer && (
        <div className="mt-3 p-3 rounded-lg bg-card/60 border border-border text-[11px] text-muted-foreground leading-normal">
          <p className="font-semibold text-foreground mb-1">
            Uitlegbare Dubbele Progressie
          </p>
          <p className="mb-1.5">{suggestion.disclaimer}</p>
          <p className="text-[10px] text-muted-foreground/80">
            Uitrustingsstap voor {suggestion.equipmentType}:{" "}
            {Math.abs(suggestion.weightChangeKg) > 0
              ? `${Math.abs(suggestion.weightChangeKg)} kg`
              : "geen / n.v.t."}
            .
          </p>
        </div>
      )}
    </Card>
  );
}
