import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(100, "Text must be at least 100 characters long")
    .max(5000, "Text must not exceed 5000 characters"),
  language: z
    .string()
    .regex(/^[a-z]{2}$/, "Language must be a valid ISO 639-1 two-letter code")
    .optional()
    .default("en"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
