import type { SupabaseClient } from "../../db/supabase.client";
import type { AiGenerationLogInsert } from "../../types";

export class AiGenerationLogService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new AI generation log entry
   * @param logData - The log data to insert
   * @returns The created log record with generated ID
   * @throws {Error} If database operation fails
   */
  async create(logData: Omit<AiGenerationLogInsert, "created_at">): Promise<{ id: string; created_at: string }> {
    const { data, error } = await this.supabase
      .from("ai_generation_logs")
      .insert({
        user_id: logData.user_id,
        input_text: logData.input_text,
        input_length: logData.input_length,
        generated_count: logData.generated_count,
      })
      .select("id, created_at")
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to create AI generation log:", error);
      throw new Error(`Failed to log AI generation: ${error.message}`);
    }

    return data;
  }
}
