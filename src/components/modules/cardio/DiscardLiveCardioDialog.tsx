"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Trash2, Ban } from "lucide-react";
import type { LiveCardioTrackerState } from "@/domain/cardio/liveTracker";
import { getActivityMetadata } from "@/domain/cardio/calculations";

interface DiscardLiveCardioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackerState: LiveCardioTrackerState;
  onDiscardCompletely: () => void;
  onSaveAsCancelled: () => Promise<void>;
}

export function DiscardLiveCardioDialog({
  isOpen,
  onClose,
  trackerState,
  onDiscardCompletely,
  onSaveAsCancelled,
}: DiscardLiveCardioDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const meta = getActivityMetadata(trackerState.activityType);

  const handleSaveCancelled = async () => {
    setIsSubmitting(true);
    try {
      await onSaveAsCancelled();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    onDiscardCompletely();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Live sessie afbreken?"
      description={`Je bent momenteel bezig met een ${meta.label.toLowerCase()} sessie.`}
    >
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Wat wil je met de opgebouwde meetgegevens doen?</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Je kunt de sessie opslaan als &lsquo;geannuleerd&rsquo; om te onthouden dat je bent gestart, of alle gegevens direct wissen.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Verder trainen
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveCancelled}
          isLoading={isSubmitting}
          leftIcon={<Ban className="w-4 h-4 text-amber-500" />}
        >
          Opslaan als geannuleerd
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDiscard}
          disabled={isSubmitting}
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Wissen &amp; Verwerpen
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
