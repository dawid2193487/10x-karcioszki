import type { APIContext } from "astro";
import { logAiReviewActionSchema } from "../../../lib/schemas/ai-review-action.schema";
import { AiReviewActionService } from "../../../lib/services/ai-review-action.service";
import { ApiError, handleApiError } from "../../../lib/utils/error-handler";
import type { AiReviewActionDTO, ErrorResponseDTO, AiReviewActionInsert } from "../../../types";

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Authentication check
    const supabase = context.locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // 2. Parse and validate request body
    const body = await context.request.json();
    const validationResult = logAiReviewActionSchema.safeParse(body);

    if (!validationResult.success) {
      const details = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = validationResult.data;

    // 3. Initialize service
    const reviewActionService = new AiReviewActionService(supabase);

    // 4. Verify generation log ownership
    await reviewActionService.verifyGenerationLogOwnership(validatedData.generation_log_id, user.id);

    // 5. Prepare insert data
    const insertData: AiReviewActionInsert = {
      user_id: user.id,
      generation_log_id: validatedData.generation_log_id,
      flashcard_id: validatedData.flashcard_id,
      action_type: validatedData.action_type,
      original_front: validatedData.original_front,
      original_back: validatedData.original_back,
      edited_front: validatedData.edited_front ?? null,
      edited_back: validatedData.edited_back ?? null,
    };

    // 6. Create review action
    const reviewAction = await reviewActionService.create(insertData);

    // 7. Transform to DTO
    const responseDto: AiReviewActionDTO = {
      id: reviewAction.id,
      generation_log_id: reviewAction.generation_log_id,
      flashcard_id: reviewAction.flashcard_id,
      action_type: reviewAction.action_type as "accepted" | "edited" | "rejected",
      created_at: reviewAction.created_at,
    };

    // 8. Return success response
    return new Response(JSON.stringify(responseDto), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
