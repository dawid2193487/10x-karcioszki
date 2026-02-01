import type { APIRoute } from "astro";
import { DeckService } from "@/lib/services/deck.service";
import { deckQueryParamsSchema, createDeckSchema } from "@/lib/schemas/deck.schema";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/decks
 * List all decks for authenticated user with pagination
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Authentication - verify user is logged in
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Parse and validate query parameters
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const validationResult = deckQueryParamsSchema.safeParse({
      page: pageParam,
      limit: limitParam,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const params = validationResult.data;

    // Get decks using service
    const deckService = new DeckService(locals.supabase);
    const result = await deckService.listDecks(user.id, params);

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
 * POST /api/decks
 * Create a new deck for authenticated user
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Authentication - verify user is logged in
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    const validationResult = createDeckSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const command = validationResult.data;

    // Create deck using service
    const deckService = new DeckService(locals.supabase);
    const result = await deckService.createDeck(user.id, command);

    // Return success response with 201 Created
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
