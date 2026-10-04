"use client";

import React from "react";
import { Droplets, Plus, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface DailyWaterWidgetProps {
  waterMl: number;
  onAddWater: (amountMl: number) => Promise<void>;
  onResetWater: () => Promise<void>;
  targetMl?: number;
}

export function DailyWaterWidget({
  waterMl,
  onAddWater,
  onResetWater,
  targetMl = 2500,
}: DailyWaterWidgetProps) {
  const percentage = Math.min(100, Math.round((waterMl / targetMl) * 100));

  return (
    <Card className="border-sky-500/20 bg-linear-to-r from-sky-50/40 to-white dark:from-sky-950/20 dark:to-slate-900">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-base">
                Hydratatie &amp; Water
              </span>
              <Badge variant="outline" className="text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800">
                {waterMl} / {targetMl} ml ({percentage}%)
              </Badge>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-sky-100 dark:bg-sky-950/60 overflow-hidden mt-2">
              <div
                style={{ width: `${percentage}%` }}
                className="bg-sky-500 h-full transition-all duration-300"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddWater(250)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            250 ml
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddWater(500)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            500 ml
          </Button>
          {waterMl > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onResetWater}
              title="Reset water teller"
              aria-label="Reset water teller"
            >
              <RotateCcw className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
