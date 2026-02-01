import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateDeckCommand,
  DeckDetailDTO,
  DeckListItemDTO,
  DeckListResponseDTO,
  DueCardsResponseDTO,
  DueFlashcardDTO,
  PaginationDTO,
  PaginationQueryParams,
  UpdateDeckCommand,
} from "@/types";
import { ApiError } from "../utils/error-handler";

/**
 * Service for managing decks (flashcard collections)
 * Handles all business logic for deck operations including CRUD and statistics
 */
export class DeckService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get paginated list of user's decks with statistics
   * @param userId - Authenticated user ID
   * @param params - Pagination parameters (page, limit)
   * @returns Paginated list of decks with flashcard counts and due counts
   */
  async listDecks(userId: string, params: PaginationQueryParams): Promise<DeckListResponseDTO> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;

    // Get total count of user's decks
    const { count: totalCount, error: countError } = await this.supabase
      .from("decks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      throw new ApiError("INTERNAL_ERROR", "Failed to retrieve deck count", 500);
    }

    // Get decks with pagination
    const { data: decks, error: decksError } = await this.supabase
      .from("decks")
      .select("id, name, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (decksError) {
      throw new ApiError("INTERNAL_ERROR", "Failed to retrieve decks", 500);
    }

    // For each deck, get flashcard statistics
    const decksWithStats = await Promise.all(
      (decks || []).map(async (deck: { id: string; name: string; created_at: string; updated_at: string }) => {
        const stats = await this.getDeckStatistics(deck.id);
        return {
          id: deck.id,
          name: deck.name,
          flashcard_count: stats.flashcard_count,
          due_count: stats.due_count,
          created_at: deck.created_at,
          updated_at: deck.updated_at,
        } as DeckListItemDTO;
      })
    );

    // Build pagination metadata
    const pagination: PaginationDTO = {
      page,
      limit,
      total: totalCount ?? 0,
      total_pages: Math.ceil((totalCount ?? 0) / limit),
    };

    return {
      data: decksWithStats,
      pagination,
    };
  }

  /**
   * Get detailed information about a specific deck
   * @param userId - Authenticated user ID
   * @param deckId - Deck UUID
   * @returns Detailed deck information with extended statistics
   */
  async getDeck(userId: string, deckId: string): Promise<DeckDetailDTO> {
    // Verify deck exists and belongs to user
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("id, name, created_at, updated_at")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    if (deckError || !deck) {
      throw new ApiError("NOT_FOUND", "Deck not found or does not belong to user", 404);
    }

    // Get statistics including new cards count
    const stats = await this.getDeckStatistics(deckId);

    return {
      id: deck.id,
      name: deck.name,
      flashcard_count: stats.flashcard_count,
      due_count: stats.due_count,
      new_count: stats.new_count,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
    };
  }

  /**
   * Create a new deck for the user
   * @param userId - Authenticated user ID
   * @param command - Deck creation data (name)
   * @returns Newly created deck with initial statistics
   */
  async createDeck(userId: string, command: CreateDeckCommand): Promise<DeckDetailDTO> {
    const { data: deck, error: createError } = await this.supabase
      .from("decks")
      .insert({
        user_id: userId,
        name: command.name,
      })
      .select("id, name, created_at, updated_at")
      .single();

    if (createError || !deck) {
      throw new ApiError("INTERNAL_ERROR", "Failed to create deck", 500);
    }

    // New deck has no flashcards
    return {
      id: deck.id,
      name: deck.name,
      flashcard_count: 0,
      due_count: 0,
      new_count: 0,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
    };
  }

  /**
   * Update deck name
   * @param userId - Authenticated user ID
   * @param deckId - Deck UUID
   * @param command - Update data (new name)
   * @returns Updated deck with current statistics
   */
  async updateDeck(userId: string, deckId: string, command: UpdateDeckCommand): Promise<DeckDetailDTO> {
    // Verify ownership first
    const { data: existingDeck, error: verifyError } = await this.supabase
      .from("decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    if (verifyError || !existingDeck) {
      throw new ApiError("NOT_FOUND", "Deck not found or does not belong to user", 404);
    }

    // Update deck name
    const { data: deck, error: updateError } = await this.supabase
      .from("decks")
      .update({
        name: command.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deckId)
      .eq("user_id", userId)
      .select("id, name, created_at, updated_at")
      .single();

    if (updateError || !deck) {
      throw new ApiError("INTERNAL_ERROR", "Failed to update deck", 500);
    }

    // Get current statistics
    const stats = await this.getDeckStatistics(deckId);

    return {
      id: deck.id,
      name: deck.name,
      flashcard_count: stats.flashcard_count,
      due_count: stats.due_count,
      new_count: stats.new_count,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
    };
  }

  /**
   * Delete a deck and all its flashcards (cascade)
   * @param userId - Authenticated user ID
   * @param deckId - Deck UUID
   */
  async deleteDeck(userId: string, deckId: string): Promise<void> {
    const { error, count } = await this.supabase
      .from("decks")
      .delete({ count: "exact" })
      .eq("id", deckId)
      .eq("user_id", userId);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", "Failed to delete deck", 500);
    }

    // Check if any row was deleted
    if (count === 0) {
      throw new ApiError("NOT_FOUND", "Deck not found or does not belong to user", 404);
    }

    // Flashcards are automatically deleted by CASCADE constraint
  }

  /**
   * Get flashcards that are due for review in a deck
   * @param userId - Authenticated user ID
   * @param deckId - Deck UUID
   * @param limit - Maximum number of cards to return (default: 20)
   * @returns List of due flashcards with total count
   */
  async getDueCards(userId: string, deckId: string, limit = 20): Promise<DueCardsResponseDTO> {
    // Verify deck ownership first
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    if (deckError || !deck) {
      throw new ApiError("NOT_FOUND", "Deck not found or does not belong to user", 404);
    }

    const now = new Date().toISOString();

    // Get total count of due cards
    const { count: totalCount, error: countError } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId)
      .or(`next_review_date.is.null,next_review_date.lte.${now}`);

    if (countError) {
      throw new ApiError("INTERNAL_ERROR", "Failed to count due flashcards", 500);
    }

    // Get due flashcards with limit
    const { data: flashcards, error: cardsError } = await this.supabase
      .from("flashcards")
      .select("id, deck_id, front, back, next_review_date, easiness_factor, interval, repetitions")
      .eq("deck_id", deckId)
      .or(`next_review_date.is.null,next_review_date.lte.${now}`)
      .order("next_review_date", { ascending: true, nullsFirst: true })
      .limit(limit);

    if (cardsError) {
      throw new ApiError("INTERNAL_ERROR", "Failed to retrieve due flashcards", 500);
    }

    const dueCards: DueFlashcardDTO[] = (flashcards || []).map(
      (card: {
        id: string;
        deck_id: string;
        front: string;
        back: string;
        next_review_date: string | null;
        easiness_factor: number | null;
        interval: number | null;
        repetitions: number | null;
      }) => ({
        id: card.id,
        deck_id: card.deck_id,
        front: card.front,
        back: card.back,
        next_review_date: card.next_review_date,
        easiness_factor: card.easiness_factor,
        interval: card.interval,
        repetitions: card.repetitions,
      })
    );

    return {
      data: dueCards,
      total: totalCount ?? 0,
    };
  }

  /**
   * Helper method to calculate deck statistics
   * @param deckId - Deck UUID
   * @returns Statistics object with counts
   */
  private async getDeckStatistics(deckId: string): Promise<{
    flashcard_count: number;
    due_count: number;
    new_count: number;
  }> {
    // Get all flashcards for this deck
    const { data: flashcards, error } = await this.supabase
      .from("flashcards")
      .select("id, next_review_date, repetitions")
      .eq("deck_id", deckId);

    if (error) {
      // Don't fail the whole request if stats can't be calculated
      return {
        flashcard_count: 0,
        due_count: 0,
        new_count: 0,
      };
    }

    const cards = flashcards || [];
    const flashcard_count = cards.length;

    // Count due cards (null next_review_date OR next_review_date <= now)
    const due_count = cards.filter(
      (card: { next_review_date: string | null }) =>
        !card.next_review_date || new Date(card.next_review_date) <= new Date()
    ).length;

    // Count new cards (repetitions = 0 OR null)
    const new_count = cards.filter(
      (card: { repetitions: number | null }) => card.repetitions === 0 || card.repetitions === null
    ).length;

    return {
      flashcard_count,
      due_count,
      new_count,
    };
  }
}
