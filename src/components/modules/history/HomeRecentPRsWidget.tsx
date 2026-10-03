"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useDatabase } from "@/lib/db";
import type { AchievedPR } from "@/domain/strength/personalRecords";

export function HomeRecentPRsWidget() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();
  const [recentPRs, setRecentPRs] = useState<AchievedPR[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadPRs() {
      setIsLoading(true);
      try {
        const prs = await repositories.workout.getRecentPRs(7);
        if (!isCancelled) {
          setRecentPRs(prs);
        }
      } catch (err) {
        console.error("Fout bij laden van recente PR's:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPRs();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isDemoMode, dataVersion]);

  return (
    <Card className="border-amber-500/20 bg-linear-to-br from-white via-amber-50/20 to-white dark:from-slate-900 dark:via-amber-950/10 dark:to-slate-900 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Records Deze Week
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Afgelopen 7 dagen behaalde persoonlijke records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {recentPRs.length > 0 && (
              <Badge variant="warning" className="text-xs font-semibold px-2 py-0.5">
                {recentPRs.length} {recentPRs.length === 1 ? "record" : "records"}
              </Badge>
            )}
            <Link
              href="/training"
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
            >
              <span>Geschiedenis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {isLoading ? (
          <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
            Records analyseren...
          </div>
        ) : recentPRs.length === 0 ? (
          <div className="py-3 px-3.5 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500/70" />
            <p>Nog geen records verbroken in de afgelopen 7 dagen.</p>
            <p className="text-[11px] text-muted-foreground/80">
              Log je trainingen en overtref je eerdere gewichten of herhalingen!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentPRs.slice(0, 6).map((pr) => (
              <div
                key={pr.id}
                className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex flex-col justify-between gap-1.5 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-foreground truncate">
                    {pr.exerciseName}
                  </span>
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                    {pr.categoryLabel}
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-0.5">
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                    {pr.formattedValue}
                  </span>
                  {pr.previousValue !== null && (
                    <span className="text-xs text-muted-foreground">
                      was {pr.previousValue} {pr.isAssisted ? "kg tegengewicht" : "kg"}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <span className="truncate">
                    {pr.weightKg > 0 ? `${pr.weightKg} kg × ${pr.reps} reps` : `${pr.reps} reps`}
                    {pr.isEstimated ? " (Geschat)" : ""}
                  </span>
                  <span className="shrink-0">{pr.calendarDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
