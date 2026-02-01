import { z } from "zod";

// Query parameters validation for listing flashcards
export const flashcardQueryParamsSchema = z.object({
  deck_id: z.string().uuid().optional(),
  source: z.enum(["ai", "manual"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Create flashcard validation
export const createFlashcardSchema = z.object({
  deck_id: z.string().uuid(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
  source: z.enum(["ai", "manual"]),
});

// Update flashcard validation
export const updateFlashcardSchema = z
  .object({
    front: z.string().min(1).max(1000).optional(),
    back: z.string().min(1).max(1000).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

// UUID path parameter validation
export const uuidParamSchema = z.string().uuid();
