import { z } from "zod";

export const AiTaskEnum = z.enum([
  "overload_suggestions",
  "nutrition_advice",
  "weekly_review",
  "qa_chat",
  "health_check",
]);

export type AiTaskType = z.infer<typeof AiTaskEnum>;

/**
 * Validatieschema voor een inkomend AI API verzoek.
 */
export const AiRequestSchema = z.object({
  task: AiTaskEnum,
  context: z.record(z.any()).optional().default({}),
  userPrompt: z
    .string()
    .max(2000, "Vraag mag maximaal 2000 tekens bevatten.")
    .optional(),
});

export type AiRequestPayload = z.infer<typeof AiRequestSchema>;

/**
 * Gestructureerd voorstel voor progressieve overload (Stap 42).
 */
export const OverloadSuggestionSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  currentWeightKg: z.number(),
  suggestedWeightKg: z.number(),
  targetReps: z.number().optional(),
  rationale: z.string(),
  confidence: z.enum(["laag", "gemiddeld", "hoog"]),
  requiresConfirmation: z.literal(true).default(true),
});

export type OverloadSuggestion = z.infer<typeof OverloadSuggestionSchema>;

/**
 * Gestructureerd voedingsadvies (Stap 43).
 */
export const NutritionAdviceSchema = z.object({
  summary: z.string(),
  isTrainingDay: z.boolean(),
  calorieAdjustmentKcal: z.number(), // bv. +200 of 0
  proteinTargetGrams: z.number().optional(),
  carbsTargetGrams: z.number().optional(),
  recommendations: z.array(z.string()),
  rationale: z.string(),
});

export type NutritionAdvice = z.infer<typeof NutritionAdviceSchema>;

/**
 * Gestructureerde wekelijkse review (Stap 44).
 */
export const WeeklyReviewSchema = z.object({
  headline: z.string(),
  volumeAssessment: z.string(),
  recoveryAssessment: z.string(),
  nutritionAssessment: z.string(),
  keyHighlights: z.array(z.string()),
  focusNextWeek: z.string(),
});

export type WeeklyReview = z.infer<typeof WeeklyReviewSchema>;

/**
 * Gestandaardiseerd AI responsformaat.
 */
export const AiResponseSchema = z.object({
  success: z.boolean(),
  task: AiTaskEnum,
  message: z.string(),
  structuredData: z.unknown().optional(),
  disclaimer: z.string(),
  isEstimate: z.boolean(),
  modelUsed: z.string(),
  timestamp: z.string(),
});

export type AiResponsePayload = z.infer<typeof AiResponseSchema>;
