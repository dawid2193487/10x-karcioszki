import type { SupabaseClient } from "@/db/supabase.client";
import type {
  FlashcardListItemDTO,
  FlashcardDetailDTO,
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  FlashcardQueryParams,
  PaginationDTO,
} from "@/types";
import { ApiError } from "@/lib/utils/error-handler";

/**
 * Service for managing flashcard CRUD operations
 * Handles data validation, authorization, and database interactions
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List flashcards with filtering and pagination
   * @param userId - Authenticated user ID for authorization
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of flashcards with deck names
   * @throws {ApiError} INTERNAL_ERROR if database query fails
   */
  async listFlashcards(
    userId: string,
    params: FlashcardQueryParams
  ): Promise<{ data: FlashcardListItemDTO[]; pagination: PaginationDTO }> {
    const { deck_id, source, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // Build query with filters
    let query = this.supabase
      .from("flashcards")
      .select(
        `
        id,
        deck_id,
        front,
        back,
        source,
        next_review_date,
        created_at,
        updated_at,
        decks!inner(name)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    if (deck_id) {
      query = query.eq("deck_id", deck_id);
    }

    if (source) {
      query = query.eq("source", source);
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", "Failed to fetch flashcards", 500);
    }

    // Transform data to DTOs
    const flashcards: FlashcardListItemDTO[] = (data || []).map((row) => ({
      id: row.id,
      deck_id: row.deck_id,
      deck_name: Array.isArray(row.decks) ? row.decks[0]?.name || "" : row.decks?.name || "",
      front: row.front,
      back: row.back,
      source: row.source as "ai" | "manual",
      next_review_date: row.next_review_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: flashcards,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get detailed information about a specific flashcard
   * Includes SM-2 algorithm state (easiness_factor, interval, repetitions)
   * @param userId - Authenticated user ID for authorization
   * @param flashcardId - UUID of the flashcard to retrieve
   * @returns Complete flashcard details with SM-2 state
   * @throws {ApiError} NOT_FOUND if flashcard doesn't exist or doesn't belong to user
   * @throws {ApiError} INTERNAL_ERROR if database query fails
   */
  async getFlashcardById(userId: string, flashcardId: string): Promise<FlashcardDetailDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select(
        `
        id,
        deck_id,
        front,
        back,
        source,
        next_review_date,
        easiness_factor,
        interval,
        repetitions,
        last_reviewed_at,
        created_at,
        updated_at,
        decks!inner(name)
      `
      )
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", "Failed to fetch flashcard", 500);
    }

    if (!data) {
      throw new ApiError("NOT_FOUND", "Flashcard not found or does not belong to user", 404);
    }

    return {
      id: data.id,
      deck_id: data.deck_id,
      deck_name: Array.isArray(data.decks) ? data.decks[0]?.name || "" : data.decks?.name || "",
      front: data.front,
      back: data.back,
      source: data.source as "ai" | "manual",
      next_review_date: data.next_review_date,
      easiness_factor: data.easiness_factor,
      interval: data.interval,
      repetitions: data.repetitions,
      last_reviewed_at: data.last_reviewed_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Create a new flashcard
   * Verifies deck ownership before creating the flashcard
   * @param userId - Authenticated user ID for authorization
   * @param command - Flashcard creation data (deck_id, front, back, source)
   * @returns Newly created flashcard with initial SM-2 state
   * @throws {ApiError} NOT_FOUND if deck doesn't exist or doesn't belong to user
   * @throws {ApiError} INTERNAL_ERROR if database query fails
   */
  async createFlashcard(userId: string, command: CreateFlashcardCommand): Promise<FlashcardDTO> {
    // Verify deck ownership
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("id")
      .eq("id", command.deck_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (deckError) {
      throw new ApiError("INTERNAL_ERROR", "Failed to verify deck ownership", 500);
    }

    if (!deck) {
      throw new ApiError("NOT_FOUND", "Deck not found or does not belong to user", 404);
    }

    // Insert flashcard
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert({
        user_id: userId,
        deck_id: command.deck_id,
        front: command.front,
        back: command.back,
        source: command.source,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", "Failed to create flashcard", 500);
    }

    return {
      id: data.id,
      deck_id: data.deck_id,
      front: data.front,
      back: data.back,
      source: data.source as "ai" | "manual",
      next_review_date: data.next_review_date,
      easiness_factor: data.easiness_factor,
      interval: data.interval,
      repetitions: data.repetitions,
      last_reviewed_at: data.last_reviewed_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Update flashcard content (autosave for inline editing)
   * At least one field (front or back) must be provided
   * @param userId - Authenticated user ID for authorization
   * @param flashcardId - UUID of the flashcard to update
   * @param command - Updated content (front and/or back)
   * @returns Updated flashcard with new content
   * @throws {ApiError} NOT_FOUND if flashcard doesn't exist or doesn't belong to user
   * @throws {ApiError} INTERNAL_ERROR if database query fails
   */
  async updateFlashcard(userId: string, flashcardId: string, command: UpdateFlashcardCommand): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .update({
        ...(command.front !== undefined && { front: command.front }),
        ...(command.back !== undefined && { back: command.back }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", "Failed to update flashcard", 500);
    }

    if (!data) {
      throw new ApiError("NOT_FOUND", "Flashcard not found or does not belong to user", 404);
    }

    return {
      id: data.id,
      deck_id: data.deck_id,
      front: data.front,
      back: data.back,
      source: data.source as "ai" | "manual",
      next_review_date: data.next_review_date,
      easiness_factor: data.easiness_factor,
      interval: data.interval,
      repetitions: data.repetitions,
      last_reviewed_at: data.last_reviewed_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Delete a flashcard and associated review history
   * Uses CASCADE to automatically delete related review_history records
   * @param userId - Authenticated user ID for authorization
   * @param flashcardId - UUID of the flashcard to delete
   * @throws {ApiError} NOT_FOUND if flashcard doesn't exist or doesn't belong to user
   * @throws {ApiError} INTERNAL_ERROR if database query fails
   */
  async deleteFlashcard(userId: string, flashcardId: string): Promise<void> {
    // First verify the flashcard exists and belongs to the user
    const { data: flashcard, error: checkError } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      throw new ApiError("INTERNAL_ERROR", "Failed to verify flashcard ownership", 500);
    }

    if (!flashcard) {
      throw new ApiError("NOT_FOUND", "Flashcard not found or does not belong to user", 404);
    }

    // Now delete the flashcard (CASCADE will delete related records)
    const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", "Failed to delete flashcard", 500);
    }
  }
}
