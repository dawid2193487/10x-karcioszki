import { z } from "zod";

export const logAiReviewActionSchema = z
  .object({
    generation_log_id: z.string().uuid("Invalid generation log ID"),
    flashcard_id: z.string().uuid("Invalid flashcard ID").nullable(),
    action_type: z.enum(["accepted", "edited", "rejected"], {
      errorMap: () => ({ message: "Must be one of: accepted, edited, rejected" }),
    }),
    original_front: z
      .string()
      .min(1, "Original front must not be empty")
      .max(1000, "Original front must not exceed 1000 characters"),
    original_back: z
      .string()
      .min(1, "Original back must not be empty")
      .max(1000, "Original back must not exceed 1000 characters"),
    edited_front: z
      .string()
      .min(1, "Edited front must not be empty")
      .max(1000, "Edited front must not exceed 1000 characters")
      .optional(),
    edited_back: z
      .string()
      .min(1, "Edited back must not be empty")
      .max(1000, "Edited back must not exceed 1000 characters")
      .optional(),
  })
  .refine(
    (data) => {
      // If action_type is 'edited', both edited fields must be present
      if (data.action_type === "edited") {
        return data.edited_front !== undefined && data.edited_back !== undefined;
      }
      return true;
    },
    {
      message: 'edited_front and edited_back are required when action_type is "edited"',
      path: ["edited_front"],
    }
  )
  .refine(
    (data) => {
      // If action_type is not 'edited', edited fields must be absent
      if (data.action_type !== "edited") {
        return data.edited_front === undefined && data.edited_back === undefined;
      }
      return true;
    },
    {
      message: 'edited_front and edited_back must not be present when action_type is not "edited"',
      path: ["edited_front"],
    }
  );

export type LogAiReviewActionInput = z.infer<typeof logAiReviewActionSchema>;
