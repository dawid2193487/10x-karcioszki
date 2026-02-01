import type { APIRoute } from "astro";
import { DeckService } from "@/lib/services/deck.service";
import { uuidParamSchema, updateDeckSchema } from "@/lib/schemas/deck.schema";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/decks/:id
 * Get detailed information about a specific deck
 */
export const GET: APIRoute = async ({ locals, params }) => {
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
    const validationResult = uuidParamSchema.safeParse(params.id);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const deckId = validationResult.data;

    // Get deck using service
    const deckService = new DeckService(locals.supabase);
    const result = await deckService.getDeck(user.id, deckId);

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

/**
 * PATCH /api/decks/:id
 * Update deck name
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
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

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    const validationResult = updateDeckSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const command = validationResult.data;

    // Update deck using service
    const deckService = new DeckService(locals.supabase);
    const result = await deckService.updateDeck(user.id, deckId, command);

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

/**
 * DELETE /api/decks/:id
 * Delete a deck and all its flashcards (cascade)
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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
    const validationResult = uuidParamSchema.safeParse(params.id);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const deckId = validationResult.data;

    // Delete deck using service
    const deckService = new DeckService(locals.supabase);
    await deckService.deleteDeck(user.id, deckId);

    // Return 204 No Content (no body)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
