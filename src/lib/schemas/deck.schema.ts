import { z } from "zod";

/**
 * Walidacja UUID w path parameters
 * Używane dla :id w URL endpointów
 */
export const uuidParamSchema = z.string().uuid({
  message: "Invalid UUID format",
});

/**
 * Walidacja parametrów paginacji dla listy talii
 * GET /api/decks?page=1&limit=20
 */
export const deckQueryParamsSchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: "Page must be a number",
    })
    .int({
      message: "Page must be an integer",
    })
    .min(1, {
      message: "Page must be at least 1",
    })
    .optional()
    .default(1),
  limit: z.coerce
    .number({
      invalid_type_error: "Limit must be a number",
    })
    .int({
      message: "Limit must be an integer",
    })
    .min(1, {
      message: "Limit must be at least 1",
    })
    .max(100, {
      message: "Limit cannot exceed 100",
    })
    .optional()
    .default(20),
});

/**
 * Walidacja danych wejściowych dla tworzenia talii
 * POST /api/decks
 */
export const createDeckSchema = z.object({
  name: z
    .string({
      required_error: "Deck name is required",
      invalid_type_error: "Deck name must be a string",
    })
    .min(1, {
      message: "Deck name cannot be empty",
    })
    .max(100, {
      message: "Deck name cannot exceed 100 characters",
    })
    .trim(),
});

/**
 * Walidacja danych wejściowych dla aktualizacji talii
 * PATCH /api/decks/:id
 */
export const updateDeckSchema = z.object({
  name: z
    .string({
      required_error: "Deck name is required",
      invalid_type_error: "Deck name must be a string",
    })
    .min(1, {
      message: "Deck name cannot be empty",
    })
    .max(100, {
      message: "Deck name cannot exceed 100 characters",
    })
    .trim(),
});

/**
 * Walidacja parametrów dla fiszek wymagających powtórki
 * GET /api/decks/:id/due?limit=20
 */
export const dueCardsQueryParamsSchema = z.object({
  limit: z.coerce
    .number({
      invalid_type_error: "Limit must be a number",
    })
    .int({
      message: "Limit must be an integer",
    })
    .min(1, {
      message: "Limit must be at least 1",
    })
    .max(100, {
      message: "Limit cannot exceed 100",
    })
    .optional()
    .default(20),
});
