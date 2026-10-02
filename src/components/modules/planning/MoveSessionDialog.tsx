"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatFriendlyDate, addDaysToDateString, getLocalDateString } from "@/domain/dates/calendar";
import { Calendar, ArrowRight, Clock } from "lucide-react";

interface MoveSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    calendarDate: string;
    routineName: string;
    routineDayName: string;
  } | null;
  onMove: (sessionId: string, newDate: string) => Promise<void>;
}

export function MoveSessionDialog({
  isOpen,
  onClose,
  session,
  onMove,
}: MoveSessionDialogProps) {
  const [targetDate, setTargetDate] = useState<string>(
    session ? addDaysToDateString(session.calendarDate, 1) : getLocalDateString()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update targetDate when session changes
  React.useEffect(() => {
    if (session) {
      setTargetDate(addDaysToDateString(session.calendarDate, 1));
    }
  }, [session]);

  if (!session) return null;

  const handleQuickAdd = (days: number) => {
    setTargetDate(addDaysToDateString(session.calendarDate, days));
  };

  const handleSave = async () => {
    if (!targetDate) return;
    setIsSubmitting(true);
    try {
      await onMove(session.id, targetDate);
      onClose();
    } catch (err) {
      console.error("Fout bij verplaatsen van sessie:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Sessie Verplaatsen"
      description="Kies een nieuwe datum voor deze geplande trainingssessie."
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3 rounded-xl bg-muted/40 border border-border text-sm">
          <div className="font-semibold text-foreground">{session.routineDayName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {session.routineName} &bull; Momenteel gepland op:{" "}
            <span className="font-medium text-foreground">
              {formatFriendlyDate(session.calendarDate)} ({session.calendarDate})
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
            Nieuwe Datum
          </label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full text-base h-11"
          />
        </div>

        {/* Snelle datumknoppen */}
        <div>
          <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">
            Snelle verplaatsing:
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(1)}
              className="text-xs h-9"
            >
              +1 Dag (Morgen)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(2)}
              className="text-xs h-9"
            >
              +2 Dagen (Overmorgen)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(7)}
              className="text-xs h-9"
            >
              +7 Dagen (Volgende week)
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="min-h-[44px]">
          Annuleren
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSubmitting || !targetDate || targetDate === session.calendarDate}
          className="min-h-[44px]"
        >
          {isSubmitting ? "Verplaatsen..." : "Verplaatsen"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

