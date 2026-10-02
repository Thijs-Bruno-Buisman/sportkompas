"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  WorkoutRoutine,
  RoutineDay,
  ScheduledSession,
  PlannedExerciseInDay,
  WorkoutSession,
} from "@/types/database";
import { useDatabase } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  getLocalDateString,
  getWeekDays,
  addDaysToDateString,
  parseLocalDate,
  type WeekStartDay,
  type CalendarDayInfo,
} from "@/domain/dates/calendar";
import { ScheduleDayDialog } from "./ScheduleDayDialog";
import { MoveSessionDialog } from "./MoveSessionDialog";
import { PlanWeekWizardDialog } from "./PlanWeekWizardDialog";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Play,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Dumbbell,
  Trash2,
  FastForward,
  RotateCcw,
  Plus,
  ArrowRight,
  Layers,
} from "lucide-react";

interface EnrichedScheduledSession extends ScheduledSession {
  routineName: string;
  routineDayName: string;
  exerciseCount: number;
  plannedExercises: PlannedExerciseInDay[];
}

interface WeekPlannerProps {
  onWorkoutStarted?: (session: WorkoutSession) => void;
}

export function WeekPlanner({ onWorkoutStarted }: WeekPlannerProps = {}) {
  const { repositories, isDemoMode, dataVersion, refreshData } = useDatabase();

  const [weekStartsOn, setWeekStartsOn] = useState<WeekStartDay>("maandag");
  const [anchorDate, setAnchorDate] = useState<string>(getLocalDateString());
  const [activeRoutine, setActiveRoutine] = useState<{
    routine: WorkoutRoutine;
    days: RoutineDay[];
  } | null>(null);
  const [scheduledSessions, setScheduledSessions] = useState<
    EnrichedScheduledSession[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Dialogs state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [schedulingDate, setSchedulingDate] = useState<string | null>(null);
  const [movingSession, setMovingSession] =
    useState<EnrichedScheduledSession | null>(null);

  // Lees weekStartsOn voorkeur uit localStorage bij mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sportkompas_week_start");
      if (stored === "zondag" || stored === "maandag") {
        setWeekStartsOn(stored);
      }
    } catch {}
  }, []);

  const handleWeekStartToggle = (startDay: WeekStartDay) => {
    setWeekStartsOn(startDay);
    try {
      localStorage.setItem("sportkompas_week_start", startDay);
    } catch {}
  };

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // Bereken 7 dagen van de huidige week
  const weekDays = getWeekDays(anchorDate, weekStartsOn, getLocalDateString());
  const startOfWeekStr = weekDays[0].dateStr;
  const endOfWeekStr = weekDays[6].dateStr;

  const loadPlanningData = useCallback(async () => {
    setIsLoading(true);
    try {
      const active = await repositories.workout.getActiveRoutine();
      setActiveRoutine(active);

      const sessions = await repositories.workout.getScheduledSessionsForDateRange(
        startOfWeekStr,
        endOfWeekStr
      );
      setScheduledSessions(sessions);
    } catch (err) {
      console.error("Fout bij laden van weekplanning:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, startOfWeekStr, endOfWeekStr]);

  useEffect(() => {
    loadPlanningData();
  }, [loadPlanningData, isDemoMode, dataVersion]);

  // ---------------------------------------------------------------------------
  // NAVIGATIE
  // ---------------------------------------------------------------------------
  const handlePrevWeek = () => {
    setAnchorDate((prev) => addDaysToDateString(prev, -7));
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => addDaysToDateString(prev, 7));
  };

  const handleToday = () => {
    setAnchorDate(getLocalDateString());
  };

  // ---------------------------------------------------------------------------
  // PLANNING ACTIES
  // ---------------------------------------------------------------------------
  const handleScheduleDay = async (
    routineId: string,
    routineDayId: string,
    calendarDate: string
  ) => {
    try {
      await repositories.workout.scheduleSession({
        routineId,
        routineDayId,
        calendarDate,
      });
      refreshData();
      showNotification("Trainingsdag succesvol ingepland.");
    } catch (err: any) {
      showNotification(err.message || "Fout bij inplannen.", "error");
    }
  };

  const handleRemoveScheduledSession = async (calendarDate: string) => {
    try {
      const found = scheduledSessions.find((s) => s.calendarDate === calendarDate);
      if (found) {
        await repositories.workout.deleteScheduledSession(found.id);
        refreshData();
        showNotification("Training verwijderd (rustdag ingesteld).");
      }
    } catch (err: any) {
      showNotification(err.message || "Fout bij verwijderen.", "error");
    }
  };

  const handleScheduleWeek = async (
    assignments: { routineDayId: string; calendarDate: string }[]
  ) => {
    if (!activeRoutine) return;
    try {
      await repositories.workout.scheduleWeek(activeRoutine.routine.id, assignments);
      refreshData();
      showNotification(`${assignments.length} trainingsdagen ingepland voor deze week.`);
    } catch (err: any) {
      showNotification(err.message || "Fout bij inplannen van de week.", "error");
    }
  };

  const handleMoveSession = async (sessionId: string, newDate: string) => {
    try {
      await repositories.workout.moveScheduledSession(sessionId, newDate);
      refreshData();
      showNotification(`Sessie succesvol verplaatst naar ${newDate}.`);
    } catch (err: any) {
      showNotification(err.message || "Fout bij verplaatsen.", "error");
    }
  };

  const handleSkipSession = async (sessionId: string) => {
    try {
      await repositories.workout.skipScheduledSession(sessionId);
      refreshData();
      showNotification("Sessie gemarkeerd als overgeslagen.");
    } catch (err: any) {
      showNotification(err.message || "Fout bij overslaan.", "error");
    }
  };

  const handleUnskipSession = async (sessionId: string) => {
    try {
      await repositories.workout.unskipScheduledSession(sessionId);
      refreshData();
      showNotification("Sessie hersteld naar gepland.");
    } catch (err: any) {
      showNotification(err.message || "Fout bij herstellen.", "error");
    }
  };

  const handleStartWorkout = async (sessionId: string) => {
    try {
      const started = await repositories.workout.startWorkoutFromScheduledSession(
        sessionId
      );
      refreshData();
      showNotification(
        `Workout "${started.snapshot.routineDayName || "Training"}" gestart!`
      );
      onWorkoutStarted?.(started);
    } catch (err: any) {
      showNotification(err.message || "Fout bij starten van workout.", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // WEERGAVE HELPERS
  // ---------------------------------------------------------------------------
  const sessionsByDate = new Map<string, EnrichedScheduledSession>();
  scheduledSessions.forEach((s) => {
    sessionsByDate.set(s.calendarDate, s);
  });

  return (
    <div className="space-y-6">
      {/* Notificatie banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-sm flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-2"
          >
            Sluiten
          </button>
        </div>
      )}

      {/* Actief Programma Banner */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Actief Trainingsprogramma
            </span>
          </div>

          {activeRoutine ? (
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-foreground">
                {activeRoutine.routine.name}
              </h3>
              <Badge variant="outline" className="text-xs">
                v{activeRoutine.routine.version}
              </Badge>
              <Badge variant="success" className="text-xs">
                {activeRoutine.days.length} trainingsdagen
              </Badge>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-foreground">
                Nog geen actief schema gekozen
              </p>
              <p className="text-xs text-muted-foreground">
                Kies een programma in het tabblad &quot;Schema&apos;s&quot; om automatisch
                je weekplanning samen te stellen.
              </p>
            </div>
          )}
        </div>

        {activeRoutine && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            className="min-h-[44px] text-xs font-medium shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-emerald-500" />
            Plan Deze Week
          </Button>
        )}
      </div>

      {/* Week Toolbar: Navigatie & Weekstart voorkeur */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Vorige / Volgende / Vandaag */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevWeek}
            className="h-10 px-3"
            title="Vorige week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-10 text-xs font-medium"
          >
            Vandaag
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            className="h-10 px-3"
            title="Volgende week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="text-xs font-semibold text-foreground ml-2">
            {weekDays[0].dayNumber}{" "}
            {parseLocalDate(weekDays[0].dateStr).toLocaleDateString("nl-NL", {
              month: "short",
            })}{" "}
            – {weekDays[6].dayNumber}{" "}
            {parseLocalDate(weekDays[6].dateStr).toLocaleDateString("nl-NL", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Configureerbare Weekstart (Maandag / Zondag) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-[11px] font-medium">Weekstart:</span>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
            <button
              type="button"
              onClick={() => handleWeekStartToggle("maandag")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                weekStartsOn === "maandag"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Maandag
            </button>
            <button
              type="button"
              onClick={() => handleWeekStartToggle("zondag")}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                weekStartsOn === "zondag"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Zondag
            </button>
          </div>
        </div>
      </div>

      {/* 7 Dagen Weergave */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Weekplanning laden...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const session = sessionsByDate.get(day.dateStr);

            return (
              <div
                key={day.dateStr}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[190px] ${
                  day.isToday
                    ? "border-emerald-500/80 bg-card ring-1 ring-emerald-500/20 shadow-xs"
                    : session
                    ? "border-border bg-card shadow-2xs"
                    : "border-border/60 bg-muted/20"
                }`}
              >
                {/* Dag Header */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {day.dayNameShort}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {day.dayNumber}{" "}
                        {parseLocalDate(day.dateStr).toLocaleDateString("nl-NL", {
                          month: "short",
                        })}
                      </span>
                    </div>

                    {day.isToday && (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0">
                        Vandaag
                      </Badge>
                    )}
                  </div>

                  {/* Sessie Inhoud */}
                  <div className="pt-2.5">
                    {session ? (
                      <div className="space-y-2">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between gap-1">
                          {session.status === "afgerond" && (
                            <Badge
                              variant="success"
                              className="text-[10px] flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Voltooid
                            </Badge>
                          )}
                          {session.status === "gepland" && (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                              Gepland
                            </Badge>
                          )}
                          {session.status === "overgeslagen" && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Overgeslagen
                            </Badge>
                          )}
                          {session.status === "geannuleerd" && (
                            <Badge variant="danger" className="text-[10px]">
                              Geannuleerd
                            </Badge>
                          )}
                        </div>

                        {/* Schemadag Titel & Info */}
                        <div>
                          <p className="font-semibold text-xs text-foreground truncate">
                            {session.routineDayName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {session.exerciseCount} oefeningen
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <span className="text-xs font-medium text-muted-foreground block">
                          Rustdag 🧘
                        </span>
                        <span className="text-[10px] text-muted-foreground/80">
                          Herstel &amp; rust
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actieknoppen per dag */}
                <div className="pt-3 border-t border-border/40 mt-2">
                  {session ? (
                    <div className="space-y-1.5">
                      {session.status === "gepland" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartWorkout(session.id)}
                          className="w-full text-xs h-9 font-medium"
                          title="Start deze workout en leg een onveranderlijke snapshot vast"
                        >
                          <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                          Starten
                        </Button>
                      )}

                      <div className="flex items-center justify-between gap-1">
                        {session.status === "gepland" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMovingSession(session)}
                              className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              title="Verplaats naar andere datum"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              Verplaats
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSkipSession(session.id)}
                              className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              title="Sla deze sessie over"
                            >
                              <FastForward className="w-3.5 h-3.5 mr-1" />
                              Overslaan
                            </Button>
                          </>
                        )}

                        {session.status === "overgeslagen" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnskipSession(session.id)}
                            className="w-full h-8 text-[11px] text-emerald-600 dark:text-emerald-400"
                            title="Herstel naar gepland"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Herstellen
                          </Button>
                        )}

                        {session.status !== "afgerond" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveScheduledSession(day.dateStr)
                            }
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            title="Verwijder uit planning"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSchedulingDate(day.dateStr)}
                      className="w-full text-[11px] text-muted-foreground hover:text-foreground h-9"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Plan Training
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Week Wizard Dialog */}
      {activeRoutine && (
        <PlanWeekWizardDialog
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          weekDays={weekDays}
          activeRoutine={activeRoutine}
          onScheduleWeek={handleScheduleWeek}
        />
      )}

      {/* Schedule Single Day Dialog */}
      <ScheduleDayDialog
        isOpen={schedulingDate !== null}
        onClose={() => setSchedulingDate(null)}
        calendarDate={schedulingDate || getLocalDateString()}
        activeRoutine={activeRoutine}
        onSchedule={handleScheduleDay}
        onRemoveExisting={
          schedulingDate && sessionsByDate.has(schedulingDate)
            ? () => handleRemoveScheduledSession(schedulingDate)
            : undefined
        }
        isExistingScheduled={
          schedulingDate ? sessionsByDate.has(schedulingDate) : false
        }
      />

      {/* Move Session Dialog */}
      <MoveSessionDialog
        isOpen={movingSession !== null}
        onClose={() => setMovingSession(null)}
        session={movingSession}
        onMove={handleMoveSession}
      />
    </div>
  );
}
