import type { SupabaseClient } from "../../db/supabase.client";
import type { AiReviewActionInsert, AiReviewAction } from "../../types";
import { ApiError } from "../utils/error-handler";

export class AiReviewActionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Verify that generation log exists and belongs to user
   * @param generationLogId - UUID of the AI generation log
   * @param userId - UUID of the current user
   * @throws {ApiError} If generation log not found or doesn't belong to user
   */
  async verifyGenerationLogOwnership(generationLogId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("ai_generation_logs")
      .select("id")
      .eq("id", generationLogId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new ApiError("NOT_FOUND", "AI generation log not found or does not belong to user", 404);
    }
  }

  /**
   * Create a new AI review action record
   * @param input - The review action data to insert
   * @returns The created review action record
   * @throws {ApiError} If database operation fails
   */
  async create(input: AiReviewActionInsert): Promise<AiReviewAction> {
    const { data, error } = await this.supabase.from("ai_review_actions").insert(input).select().single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating AI review action:", error);
      throw new ApiError("INTERNAL_ERROR", "Failed to create AI review action", 500);
    }

    return data;
  }
}
