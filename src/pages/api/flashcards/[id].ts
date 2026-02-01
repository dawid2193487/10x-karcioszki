import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { updateFlashcardSchema, uuidParamSchema } from "@/lib/schemas/flashcard.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/flashcards/:id - Get flashcard details
 *
 * Path Parameters:
 * - id: Flashcard UUID
 *
 * @returns {FlashcardDetailDTO} 200 - Flashcard with SM-2 algorithm state
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Flashcard not found
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validate flashcard ID
    const flashcardId = uuidParamSchema.parse(params.id);

    // Fetch flashcard
    const flashcardService = new FlashcardService(locals.supabase);
    const flashcard = await flashcardService.getFlashcardById(user.id, flashcardId);

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * PATCH /api/flashcards/:id - Update flashcard content (autosave)
 *
 * Path Parameters:
 * - id: Flashcard UUID
 *
 * Request Body (UpdateFlashcardCommand):
 * - front (optional): Updated question/front side (1-1000 chars)
 * - back (optional): Updated answer/back side (1-1000 chars)
 *
 * Note: At least one field must be provided
 *
 * @returns {FlashcardDTO} 200 - Updated flashcard
 * @returns {ErrorResponseDTO} 400 - Validation error or no fields provided
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Flashcard not found
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validate flashcard ID
    const flashcardId = uuidParamSchema.parse(params.id);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateFlashcardSchema.parse(body);

    // Update flashcard
    const flashcardService = new FlashcardService(locals.supabase);
    const flashcard = await flashcardService.updateFlashcard(user.id, flashcardId, validatedData);

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * DELETE /api/flashcards/:id - Delete flashcard
 *
 * Path Parameters:
 * - id: Flashcard UUID
 *
 * Note: Deletes flashcard and all associated review history (CASCADE)
 *
 * @returns 204 - Flashcard deleted successfully (no content)
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Flashcard not found
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validate flashcard ID
    const flashcardId = uuidParamSchema.parse(params.id);

    // Delete flashcard
    const flashcardService = new FlashcardService(locals.supabase);
    await flashcardService.deleteFlashcard(user.id, flashcardId);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
