import { z } from "zod";

/**
 * Walidacja tworzenia sesji nauki
 */
export const createStudySessionSchema = z.object({
  deck_id: z.string().uuid({ message: "Invalid deck ID format" }),
});

/**
 * Walidacja UUID w path parameters (reusable)
 */
export const sessionIdParamSchema = z.string().uuid({ message: "Invalid session ID format" });

/**
 * Walidacja przesyłania recenzji
 */
export const submitReviewSchema = z.object({
  flashcard_id: z.string().uuid({ message: "Invalid flashcard ID format" }),
  rating: z.number().int().min(1).max(4, { message: "Rating must be between 1 and 4" }),
  response_time_ms: z.number().int().min(0, { message: "Response time must be non-negative" }).optional(),
});
