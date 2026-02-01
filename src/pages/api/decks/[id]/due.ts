import type { APIRoute } from "astro";
import { DeckService } from "@/lib/services/deck.service";
import { uuidParamSchema, dueCardsQueryParamsSchema } from "@/lib/schemas/deck.schema";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/decks/:id/due
 * Get flashcards that are due for review in a deck
 */
export const GET: APIRoute = async ({ locals, params, url }) => {
  try {
    // Authentication - verify user is logged in
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validate UUID parameter
    const paramValidationResult = uuidParamSchema.safeParse(params.id);

    if (!paramValidationResult.success) {
      const errors = paramValidationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const deckId = paramValidationResult.data;

    // Parse and validate query parameters
    const limitParam = url.searchParams.get("limit");

    const queryValidationResult = dueCardsQueryParamsSchema.safeParse({
      limit: limitParam,
    });

    if (!queryValidationResult.success) {
      const errors = queryValidationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const { limit } = queryValidationResult.data;

    // Get due cards using service
    const deckService = new DeckService(locals.supabase);
    const result = await deckService.getDueCards(user.id, deckId, limit);

    // Return success response
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
