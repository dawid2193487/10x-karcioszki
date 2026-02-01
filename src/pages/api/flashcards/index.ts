import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { flashcardQueryParamsSchema, createFlashcardSchema } from "@/lib/schemas/flashcard.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/flashcards - List flashcards with filtering and pagination
 *
 * Query Parameters:
 * - deck_id (optional): Filter by deck UUID
 * - source (optional): Filter by source ('ai' | 'manual')
 * - page (optional, default: 1): Page number
 * - limit (optional, default: 20, max: 100): Items per page
 *
 * @returns {FlashcardListResponseDTO} 200 - Paginated list of flashcards
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 400 - Invalid query parameters
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      deck_id: url.searchParams.get("deck_id") || undefined,
      source: url.searchParams.get("source") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validatedParams = flashcardQueryParamsSchema.parse(queryParams);

    // Fetch flashcards
    const flashcardService = new FlashcardService(locals.supabase);
    const result = await flashcardService.listFlashcards(user.id, validatedParams);

    return new Response(JSON.stringify(result), {
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
 * POST /api/flashcards - Create a new flashcard
 *
 * Request Body (CreateFlashcardCommand):
 * - deck_id: UUID of the deck
 * - front: Question/front side (1-1000 chars)
 * - back: Answer/back side (1-1000 chars)
 * - source: 'ai' | 'manual'
 *
 * @returns {FlashcardDTO} 201 - Created flashcard with SM-2 state
 * @returns {ErrorResponseDTO} 400 - Validation error
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Deck not found
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createFlashcardSchema.parse(body);

    // Create flashcard
    const flashcardService = new FlashcardService(locals.supabase);
    const flashcard = await flashcardService.createFlashcard(user.id, validatedData);

    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
