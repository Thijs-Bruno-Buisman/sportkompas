"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Activity, Plus, Timer, Play, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDatabase } from "@/lib/db";
import { useProfile } from "@/lib/hooks/useProfile";
import type { CardioSession, CardioActivityType } from "@/types/database";
import type { CardioSummaryStats } from "@/lib/db/repositories/cardio.repository";
import { CardioSessionCard } from "@/components/modules/cardio/CardioSessionCard";
import { CardioFilterBar } from "@/components/modules/cardio/CardioFilterBar";
import { CardioSessionModal } from "@/components/modules/cardio/CardioSessionModal";
import { CardioImportModal } from "@/components/modules/cardio/CardioImportModal";
import { CardioStatsTab } from "@/components/modules/cardio/CardioStatsTab";

// Live Tracker componenten
import type { LiveCardioTrackerState } from "@/domain/cardio/liveTracker";
import {
  startLiveTracker,
  pauseLiveTracker,
  resumeLiveTracker,
  loadLiveTrackerFromStorage,
  saveLiveTrackerToStorage,
  clearLiveTrackerFromStorage,
  getLiveElapsedSeconds,
} from "@/domain/cardio/liveTracker";
import { ActiveCardioBanner } from "@/components/modules/cardio/ActiveCardioBanner";
import { StartLiveCardioDialog } from "@/components/modules/cardio/StartLiveCardioDialog";
import { LiveCardioTrackerModal } from "@/components/modules/cardio/LiveCardioTrackerModal";
import { FinishLiveCardioDialog } from "@/components/modules/cardio/FinishLiveCardioDialog";
import { DiscardLiveCardioDialog } from "@/components/modules/cardio/DiscardLiveCardioDialog";

export default function CardioPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();
  const { profile } = useProfile();

  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [summaryStats, setSummaryStats] = useState<CardioSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<CardioActivityType | "alle">("alle");

  // Handmatige Invoer & Import Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<CardioSession | null>(null);

  // Live Tracker State
  const [activeTracker, setActiveTracker] = useState<LiveCardioTrackerState | null>(null);
  const [isStartLiveDialogOpen, setIsStartLiveDialogOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [finishFinalSeconds, setFinishFinalSeconds] = useState(0);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  // Laad eventuele actieve live tracker uit localStorage bij mount
  useEffect(() => {
    const savedTracker = loadLiveTrackerFromStorage();
    if (savedTracker) {
      setActiveTracker(savedTracker);
    }
  }, []);

  // Bepaal gebruikersleeftijd en gewicht voor berekeningen
  const userAge = useMemo(() => {
    if (!profile?.birthDate) return null;
    const birth = new Date(profile.birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 && age < 120 ? age : null;
  }, [profile?.birthDate]);

  const userWeightKg = profile?.startWeightKg ?? null;

  // Laad cardio sessies en statistieken
  useEffect(() => {
    let isCancelled = false;
    async function loadCardio() {
      setIsLoading(true);
      try {
        const [allSessions, stats] = await Promise.all([
          repositories.cardio.getAllSessionsSorted(),
          repositories.cardio.getSummaryStats(),
        ]);

        if (!isCancelled) {
          setSessions(allSessions);
          setSummaryStats(stats);
        }
      } catch (err) {
        console.error("Fout bij laden van cardio data:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadCardio();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isDemoMode, dataVersion]);

  // Bereken tellingen per activiteit voor de filterbalk
  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sessions) {
      if (s.status === "geannuleerd") continue;
      counts[s.activityType] = (counts[s.activityType] ?? 0) + 1;
    }
    return counts;
  }, [sessions]);

  // Gefilterde sessies
  const filteredSessions = useMemo(() => {
    if (selectedActivity === "alle") return sessions;
    return sessions.filter((s) => s.activityType === selectedActivity);
  }, [sessions, selectedActivity]);

  // Opslaan van een handmatige of bewerkte sessie
  const handleSaveManualSession = async (savedSession: CardioSession) => {
    await repositories.cardio.save(savedSession);

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSession.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedSession;
        return updated.sort((a, b) =>
          `${b.calendarDate}T${b.startTime}`.localeCompare(`${a.calendarDate}T${a.startTime}`)
        );
      }
      return [savedSession, ...prev].sort((a, b) =>
        `${b.calendarDate}T${b.startTime}`.localeCompare(`${a.calendarDate}T${a.startTime}`)
      );
    });

    const stats = await repositories.cardio.getSummaryStats();
    setSummaryStats(stats);
  };

  const handleImportSession = async (importedSession: CardioSession) => {
    await repositories.cardio.save(importedSession);

    setSessions((prev) =>
      [importedSession, ...prev.filter((s) => s.id !== importedSession.id)].sort((a, b) =>
        `${b.calendarDate}T${b.startTime}`.localeCompare(`${a.calendarDate}T${a.startTime}`)
      )
    );

    const stats = await repositories.cardio.getSummaryStats();
    setSummaryStats(stats);
  };

  // Verwijderen van een sessie
  const handleDeleteSession = async (sessionId: string) => {
    await repositories.cardio.delete(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    const stats = await repositories.cardio.getSummaryStats();
    setSummaryStats(stats);
  };

  // =========================================================================
  // Live Tracker Handlers
  // =========================================================================
  const handleStartLiveTracker = (activityType: CardioActivityType) => {
    const newTracker = startLiveTracker(activityType, Date.now());
    saveLiveTrackerToStorage(newTracker);
    setActiveTracker(newTracker);
    setIsLiveModalOpen(true);
  };

  const handleToggleLivePause = () => {
    if (!activeTracker) return;
    const now = Date.now();
    let updated: LiveCardioTrackerState;

    if (activeTracker.isPaused) {
      updated = resumeLiveTracker(activeTracker, now);
    } else {
      updated = pauseLiveTracker(activeTracker, now);
    }

    setActiveTracker(updated);
    saveLiveTrackerToStorage(updated);
  };

  const handleUpdateLiveTrackerState = (newState: LiveCardioTrackerState) => {
    setActiveTracker(newState);
    saveLiveTrackerToStorage(newState);
  };

  const handleFinishLiveRequest = (finalSeconds: number) => {
    setFinishFinalSeconds(finalSeconds);
    setIsLiveModalOpen(false);
    setIsFinishDialogOpen(true);
  };

  const handleFinishLiveSave = async (completedSession: CardioSession) => {
    await repositories.cardio.save(completedSession);
    clearLiveTrackerFromStorage();
    setActiveTracker(null);

    setSessions((prev) =>
      [completedSession, ...prev].sort((a, b) =>
        `${b.calendarDate}T${b.startTime}`.localeCompare(`${a.calendarDate}T${a.startTime}`)
      )
    );

    const stats = await repositories.cardio.getSummaryStats();
    setSummaryStats(stats);
  };

  const handleDiscardLiveRequest = () => {
    setIsDiscardDialogOpen(true);
  };

  const handleDiscardCompletely = () => {
    clearLiveTrackerFromStorage();
    setActiveTracker(null);
    setIsLiveModalOpen(false);
  };

  const handleSaveAsCancelled = async () => {
    if (!activeTracker) return;

    const elapsed = getLiveElapsedSeconds(activeTracker, Date.now());
    const startDate = new Date(activeTracker.startTimeMs);
    const calendarDate = startDate.toISOString().split("T")[0];

    const cancelledSession: CardioSession = {
      id: activeTracker.id,
      calendarDate,
      startTime: startDate.toISOString(),
      endTime: new Date().toISOString(),
      activityType: activeTracker.activityType,
      distanceMeters: activeTracker.distanceMeters,
      durationSeconds: Math.max(1, elapsed),
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: null,
      elevationGainMeters: null,
      rpe: null,
      notes: "Sessie geannuleerd tijdens live tracking",
      status: "geannuleerd",
      provenance: { source: isDemoMode ? "demo" : "user", isDemo: isDemoMode },
      updatedAt: new Date().toISOString(),
    };

    await repositories.cardio.save(cancelledSession);
    clearLiveTrackerFromStorage();
    setActiveTracker(null);
    setIsLiveModalOpen(false);

    setSessions((prev) =>
      [cancelledSession, ...prev].sort((a, b) =>
        `${b.calendarDate}T${b.startTime}`.localeCompare(`${a.calendarDate}T${a.startTime}`)
      )
    );

    const stats = await repositories.cardio.getSummaryStats();
    setSummaryStats(stats);
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Cardio &amp; Duursport
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Houd duursessies, kilometers, tempo en calorieën nauwkeurig bij.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<UploadCloud className="w-4 h-4" />}
            className="shadow-2xs"
          >
            Bestand Importeren
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsManualModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-2xs"
          >
            Achteraf Loggen
          </Button>

          <Button
            onClick={() => {
              if (activeTracker) {
                setIsLiveModalOpen(true);
              } else {
                setIsStartLiveDialogOpen(true);
              }
            }}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
            className="shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {activeTracker ? "Live Tracker Openen" : "Live Tracker"}
          </Button>
        </div>
      </div>

      {/* Actieve Live Tracker Banner (indien een sessie loopt) */}
      {activeTracker && (
        <ActiveCardioBanner
          trackerState={activeTracker}
          onOpenTracker={() => setIsLiveModalOpen(true)}
          onTogglePause={handleToggleLivePause}
          onFinish={() => {
            const elapsed = getLiveElapsedSeconds(activeTracker, Date.now());
            handleFinishLiveRequest(elapsed);
          }}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="activiteiten">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="activiteiten">
            Sessies ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="statistieken">Statistieken &amp; Totalen</TabsTrigger>
        </TabsList>

        {/* Tab 1: Activiteiten & Sessies */}
        <TabsContent value="activiteiten" className="space-y-4">
          {/* Filterbalk per sport */}
          {sessions.length > 0 && (
            <CardioFilterBar
              selectedActivity={selectedActivity}
              onSelectActivity={setSelectedActivity}
              counts={activityCounts}
              totalCount={sessions.length}
            />
          )}

          {/* Sessielijst */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Cardiogegevens laden...
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <CardioSessionCard
                  key={session.id}
                  session={session}
                  userAge={userAge}
                  onEdit={(s) => {
                    setSessionToEdit(s);
                    setIsManualModalOpen(true);
                  }}
                  onDelete={handleDeleteSession}
                />
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Geen sessies gevonden voor &ldquo;{selectedActivity}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Kies een andere sport of klik op &ldquo;Alle&rdquo; om al je sessies te zien.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedActivity("alle")}
                className="mt-3"
              >
                Toon alle activiteiten
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={<Timer className="w-6 h-6" />}
              title="Nog geen cardiosessies geregistreerd"
              description="Start een live stopwatch met tussentijden of voer een voltooide hardloop-, fiets- of roeitraining in."
              actionLabel="Live Tracker Starten"
              onAction={() => setIsStartLiveDialogOpen(true)}
            />
          )}
        </TabsContent>

        {/* Tab 2: Statistieken & Totalen */}
        <TabsContent value="statistieken" className="space-y-4">
          {summaryStats ? (
            <CardioStatsTab
              stats={summaryStats}
              sessions={sessions}
              userWeightKg={userWeightKg}
              userAge={userAge}
            />
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              Statistieken berekenen...
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Handmatige Sessie Modal (Nieuw / Bewerken) */}
      <CardioSessionModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setSessionToEdit(null);
        }}
        onSave={handleSaveManualSession}
        sessionToEdit={sessionToEdit}
        userWeightKg={userWeightKg}
        userAge={userAge}
        isDemoMode={isDemoMode}
      />

      {/* Start Live Tracker Dialoog */}
      <StartLiveCardioDialog
        isOpen={isStartLiveDialogOpen}
        onClose={() => setIsStartLiveDialogOpen(false)}
        onStart={handleStartLiveTracker}
      />

      {/* Live Cardio Tracker Cockpit Modal */}
      {activeTracker && (
        <LiveCardioTrackerModal
          isOpen={isLiveModalOpen}
          onClose={() => setIsLiveModalOpen(false)}
          trackerState={activeTracker}
          onUpdateState={handleUpdateLiveTrackerState}
          onFinishRequest={handleFinishLiveRequest}
          onDiscardRequest={handleDiscardLiveRequest}
          userWeightKg={userWeightKg}
        />
      )}

      {/* Finish Dialoog */}
      {activeTracker && (
        <FinishLiveCardioDialog
          isOpen={isFinishDialogOpen}
          onClose={() => setIsFinishDialogOpen(false)}
          trackerState={activeTracker}
          finalDurationSeconds={finishFinalSeconds}
          userWeightKg={userWeightKg}
          userAge={userAge}
          isDemoMode={isDemoMode}
          onSave={handleFinishLiveSave}
        />
      )}

      {/* Discard Dialoog */}
      {activeTracker && (
        <DiscardLiveCardioDialog
          isOpen={isDiscardDialogOpen}
          onClose={() => setIsDiscardDialogOpen(false)}
          trackerState={activeTracker}
          onDiscardCompletely={handleDiscardCompletely}
          onSaveAsCancelled={handleSaveAsCancelled}
        />
      )}

      {/* GPX / TCX Import Modal */}
      <CardioImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSave={handleImportSession}
        userWeightKg={userWeightKg}
        isDemoMode={isDemoMode}
      />
    </div>
  );
}

