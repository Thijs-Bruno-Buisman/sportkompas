"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Activity, Plus, Timer, Heart, Sparkles } from "lucide-react";
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
import { CardioStatsTab } from "@/components/modules/cardio/CardioStatsTab";

export default function CardioPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();
  const { profile } = useProfile();

  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [summaryStats, setSummaryStats] = useState<CardioSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<CardioActivityType | "alle">("alle");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<CardioSession | null>(null);

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

  // Opslaan van een nieuwe of gewijzigde sessie
  const handleSaveSession = async (savedSession: CardioSession) => {
    await repositories.cardio.save(savedSession);

    // Update lokale state direct
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSession.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedSession;
        return updated.sort((a, b) => `${b.calendarDate}T${b.startTime}`.localeCompare(`${a.calendarDate}T${a.startTime}`));
      }
      return [savedSession, ...prev].sort((a, b) => `${b.calendarDate}T${b.startTime}`.localeCompare(`${a.calendarDate}T${a.startTime}`));
    });

    // Herbereken samenvattingsstatistieken
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

  const handleOpenAddModal = () => {
    setSessionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (session: CardioSession) => {
    setSessionToEdit(session);
    setIsModalOpen(true);
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

        <Button
          onClick={handleOpenAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Sessie Loggen
        </Button>
      </div>

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
                  onEdit={handleOpenEditModal}
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
              description="Houd je hardloopsessies, fietstochten, roeitrainingen of wandelingen bij met nauwkeurige tempo- en calorieberekeningen."
              actionLabel="Eerste Sessie Registreren"
              onAction={handleOpenAddModal}
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
            />
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              Statistieken berekenen...
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sessie Modal (Nieuw / Bewerken) */}
      <CardioSessionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSessionToEdit(null);
        }}
        onSave={handleSaveSession}
        sessionToEdit={sessionToEdit}
        userWeightKg={userWeightKg}
        userAge={userAge}
        isDemoMode={isDemoMode}
      />
    </div>
  );
}
