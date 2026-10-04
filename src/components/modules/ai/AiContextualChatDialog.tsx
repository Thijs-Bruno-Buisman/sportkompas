"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useAi } from "@/lib/hooks/useAi";
import {
  buildChatContext,
  generateLocalChatResponse,
  type ChatMessage,
  QUICK_PROMPT_CHIPS,
  AI_CHAT_DISCLAIMER,
} from "@/domain/ai/chatAdvisor";
import { getLocalDateString } from "@/domain/dates/calendar";
import type {
  Profile,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  RecoveryLog,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import {
  Sparkles,
  Send,
  User,
  Info,
  Dumbbell,
  Activity,
  Utensils,
  Moon,
  Trash2,
} from "lucide-react";

export interface AiContextualChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile | null;
  workouts: WorkoutSession[];
  workoutSets: WorkoutSet[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  recoveryLogs: RecoveryLog[];
  nutritionTargets?: DailyNutritionTargets;
  referenceDate?: string;
}

export function AiContextualChatDialog({
  isOpen,
  onClose,
  profile,
  workouts,
  workoutSets,
  cardioSessions,
  mealLogs,
  recoveryLogs,
  nutritionTargets,
  referenceDate = getLocalDateString(),
}: AiContextualChatDialogProps) {
  const { requestAiTask, isLoading: isAiCalling, status } = useAi();

  const [inputQuestion, setInputQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bouw contextuele snapshot over de afgelopen 14 dagen
  const context = useMemo(() => {
    return buildChatContext({
      profile,
      workouts,
      workoutSets,
      cardioSessions,
      mealLogs,
      recoveryLogs,
      nutritionTargets,
      referenceDate,
    });
  }, [
    profile,
    workouts,
    workoutSets,
    cardioSessions,
    mealLogs,
    recoveryLogs,
    nutritionTargets,
    referenceDate,
  ]);

  // Initialiseer begroeting wanneer dialoog voor het eerst opent
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: ChatMessage = {
        id: "msg-welcome",
        sender: "assistent",
        text: `Hoi ${context.userName}! Ik ben je persoonlijke SportKompas AI assistent. Ik heb toegang tot je gelogde trainingen (${context.workoutsCount} workouts), cardio, voeding en rustdagen van de afgelopen 14 dagen. Waar kan ik je vandaag mee helpen?`,
        source: status?.isConfigured ? "gemini" : "lokale_heuristiek",
        isEstimate: false,
        timestamp: new Date().toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length, context.userName, context.workoutsCount, status]);

  // Focus invoerveld en scrol naar beneden
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputQuestion).trim();
      if (!text || isAiCalling) return;

      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: "gebruiker",
        text,
        timestamp: new Date().toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputQuestion("");

      try {
        const response = await requestAiTask(
          "qa_chat",
          { preparedContext: context },
          text
        );

        if (response && response.message) {
          const assistantMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: "assistent",
            text: response.message,
            source: response.modelUsed.includes("gemini")
              ? "gemini"
              : "lokale_heuristiek",
            isEstimate: Boolean(response.isEstimate),
            timestamp: new Date().toLocaleTimeString("nl-NL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Lokale heuristiek fallback
          const localReply = generateLocalChatResponse(text, context);
          const assistantMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: "assistent",
            text: localReply,
            source: "lokale_heuristiek",
            isEstimate: true,
            timestamp: new Date().toLocaleTimeString("nl-NL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch {
        const localReply = generateLocalChatResponse(text, context);
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "assistent",
          text: localReply,
          source: "lokale_heuristiek",
          isEstimate: true,
          timestamp: new Date().toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    },
    [inputQuestion, isAiCalling, context, requestAiTask]
  );

  const handleClearHistory = () => {
    setMessages([
      {
        id: "msg-welcome-reset",
        sender: "assistent",
        text: `Gesprek gereset. Vraag me gerust weer iets over je trainingen, progressieve overload of voeding!`,
        source: status?.isConfigured ? "gemini" : "lokale_heuristiek",
        isEstimate: false,
        timestamp: new Date().toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="SportKompas AI Assistent"
      description="Stel contextuele vragen over je trainingen, progressie, voeding en rust."
      maxWidth="lg"
    >
      <div className="flex flex-col h-[75vh] max-h-[640px] -mt-2">
        {/* CONTEXT BANNER */}
        <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] shrink-0">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
              {context.workoutsCount} trainingen
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              {context.cardioDistanceKm} km
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
              ~{context.avgDailyProteinGrams}g eiwit (schatting)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
              <Moon className="w-3.5 h-3.5 text-emerald-500" />
              {context.restDaysCount} rustdagen
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            >
              {status?.isConfigured ? "Gemini AI" : "Lokale Heuristiek"}
            </Badge>
            <button
              onClick={handleClearHistory}
              title="Gesprek wissen"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CHAT BERICHTEN LIJST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {messages.map((msg) => {
            const isUser = msg.sender === "gebruiker";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-xs shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/50 dark:border-slate-700/60 shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`flex items-center gap-2 mt-1.5 text-[10px] ${
                      isUser ? "text-emerald-100/80 justify-end" : "text-slate-400 justify-between"
                    }`}
                  >
                    {!isUser && msg.source && (
                      <span className="font-medium">
                        {msg.source === "gemini" ? "Gemini AI" : "Lokaal berekend"}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {isUser && (
                  <div className="h-7 w-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* DENK ANIMATIE */}
          {isAiCalling && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="animate-pulse">SportKompas assistent formuleert antwoord...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SUGGESTIE PROMPT CHIPS */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isAiCalling}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span>💡</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INVOERBALK */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Vraag over gewichten, herhalingen, voeding of herstel..."
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              disabled={isAiCalling}
            />
            <Button
              type="submit"
              disabled={!inputQuestion.trim() || isAiCalling}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 w-10 p-0 rounded-xl shrink-0"
              title="Verstuur vraag"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* DISCLAIMER FOOTER */}
          <p className="mt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{AI_CHAT_DISCLAIMER}</span>
          </p>
        </div>
      </div>
    </Dialog>
  );
}
