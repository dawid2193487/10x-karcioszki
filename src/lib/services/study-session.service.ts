import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateStudySessionCommand,
  StudySessionDTO,
  StudySessionDetailDTO,
  SubmitReviewCommand,
  SubmitReviewResponseDTO,
  CompleteStudySessionResponseDTO,
  ReviewSessionInsert,
} from "@/types";
import { ApiError } from "@/lib/utils/error-handler";

export class StudySessionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Utworzenie nowej sesji nauki dla wybranej talii
   * @param userId - ID użytkownika
   * @param command - Dane do utworzenia sesji
   * @returns DTO z podstawowymi danymi sesji
   * @throws ApiError NOT_FOUND jeśli talia nie istnieje lub nie należy do użytkownika
   */
  async createSession(userId: string, command: CreateStudySessionCommand): Promise<StudySessionDTO> {
    // 1. Weryfikacja istnienia talii i własności przez użytkownika
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("id")
      .eq("id", command.deck_id)
      .eq("user_id", userId)
      .single();

    if (deckError || !deck) {
      throw new ApiError("NOT_FOUND", "Deck not found or does not belong to user", 404);
    }

    // 2. Utworzenie nowego rekordu review_sessions
    const sessionInsert: ReviewSessionInsert = {
      user_id: userId,
      deck_id: command.deck_id,
      started_at: new Date().toISOString(),
      ended_at: null,
      cards_reviewed: 0,
    };

    const { data: session, error: sessionError } = await this.supabase
      .from("review_sessions")
      .insert(sessionInsert)
      .select()
      .single();

    if (sessionError || !session) {
      throw new ApiError("INTERNAL_ERROR", "Failed to create study session", 500);
    }

    // 3. Zwrócenie DTO
    return {
      id: session.id,
      deck_id: session.deck_id,
      started_at: session.started_at,
      ended_at: session.ended_at,
      cards_reviewed: session.cards_reviewed ?? 0,
    };
  }

  /**
   * Pobranie szczegółów sesji wraz z nazwą talii
   * @param userId - ID użytkownika
   * @param sessionId - ID sesji nauki
   * @returns DTO ze szczegółami sesji
   * @throws ApiError NOT_FOUND jeśli sesja nie istnieje lub nie należy do użytkownika
   */
  async getSession(userId: string, sessionId: string): Promise<StudySessionDetailDTO> {
    const { data, error } = await this.supabase
      .from("review_sessions")
      .select(
        `
        *,
        decks!inner(name)
      `
      )
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new ApiError("NOT_FOUND", "Session not found or does not belong to user", 404);
    }

    const decks = data.decks as { name: string } | { name: string }[];
    const deckName = Array.isArray(decks) ? decks[0].name : decks.name;

    return {
      id: data.id,
      deck_id: data.deck_id,
      deck_name: deckName,
      started_at: data.started_at,
      ended_at: data.ended_at,
      cards_reviewed: data.cards_reviewed ?? 0,
    };
  }

  /**
   * Przesłanie oceny fiszki i aktualizacja algorytmu SM-2
   * @param userId - ID użytkownika
   * @param sessionId - ID sesji nauki
   * @param command - Dane do przesłania recenzji
   * @returns DTO z wynikami recenzji i zaktualizowaną fiszką
   * @throws ApiError NOT_FOUND jeśli sesja lub fiszka nie istnieje
   */
  async submitReview(
    userId: string,
    sessionId: string,
    command: SubmitReviewCommand
  ): Promise<SubmitReviewResponseDTO> {
    // 1. Weryfikacja sesji
    const { data: session, error: sessionError } = await this.supabase
      .from("review_sessions")
      .select("id, ended_at, deck_id, cards_reviewed")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      throw new ApiError("NOT_FOUND", "Session not found or does not belong to user", 404);
    }

    // 2. Weryfikacja fiszki
    const { data: flashcard, error: flashcardError } = await this.supabase
      .from("flashcards")
      .select("id, deck_id, easiness_factor, interval, repetitions")
      .eq("id", command.flashcard_id)
      .eq("user_id", userId)
      .single();

    if (flashcardError || !flashcard) {
      throw new ApiError("NOT_FOUND", "Flashcard not found or does not belong to user", 404);
    }

    // Opcjonalnie: sprawdzenie czy fiszka należy do talii z sesji
    if (flashcard.deck_id !== session.deck_id) {
      throw new ApiError("NOT_FOUND", "Flashcard does not belong to session's deck", 404);
    }

    // 3. Pobranie aktualnych wartości SM-2
    const currentEasinessFactor = flashcard.easiness_factor ?? 2.5;
    const currentInterval = flashcard.interval ?? 0;
    const currentRepetitions = flashcard.repetitions ?? 0;

    // 4. Obliczenie nowych wartości SM-2
    const sm2Result = this.calculateSM2(command.rating, currentEasinessFactor, currentInterval, currentRepetitions);

    // 5. Aktualizacja fiszki
    const { error: updateError } = await this.supabase
      .from("flashcards")
      .update({
        easiness_factor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        next_review_date: sm2Result.nextReviewDate,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", command.flashcard_id)
      .eq("user_id", userId);

    if (updateError) {
      throw new ApiError("INTERNAL_ERROR", "Failed to update flashcard", 500);
    }

    // 6. Utworzenie rekordu review_history
    const { data: reviewHistory, error: reviewError } = await this.supabase
      .from("review_history")
      .insert({
        user_id: userId,
        session_id: sessionId,
        flashcard_id: command.flashcard_id,
        rating: command.rating,
        response_time_ms: command.response_time_ms ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (reviewError || !reviewHistory) {
      throw new ApiError("INTERNAL_ERROR", "Failed to create review history", 500);
    }

    // 7. Inkrementacja cards_reviewed w sesji
    const currentCardsReviewed = session.cards_reviewed ?? 0;
    const { data: updatedSession, error: sessionUpdateError } = await this.supabase
      .from("review_sessions")
      .update({
        cards_reviewed: currentCardsReviewed + 1,
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select("cards_reviewed")
      .single();

    if (sessionUpdateError || !updatedSession) {
      throw new ApiError("INTERNAL_ERROR", "Failed to update session", 500);
    }

    // 8. Zwrócenie odpowiedzi
    return {
      review_id: reviewHistory.id,
      flashcard: {
        id: command.flashcard_id,
        next_review_date: sm2Result.nextReviewDate,
        easiness_factor: sm2Result.easinessFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
      },
      session: {
        cards_reviewed: updatedSession.cards_reviewed ?? 0,
      },
    };
  }

  /**
   * Zakończenie sesji nauki
   * @param userId - ID użytkownika
   * @param sessionId - ID sesji nauki
   * @returns DTO z zaktualizowaną sesją i czasem trwania
   * @throws ApiError NOT_FOUND jeśli sesja nie istnieje
   * @throws ApiError CONFLICT jeśli sesja jest już zakończona
   */
  async completeSession(userId: string, sessionId: string): Promise<CompleteStudySessionResponseDTO> {
    // 1. Pobranie sesji
    const { data: session, error: sessionError } = await this.supabase
      .from("review_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      throw new ApiError("NOT_FOUND", "Session not found or does not belong to user", 404);
    }

    // 2. Sprawdzenie czy sesja nie jest zakończona
    if (session.ended_at !== null) {
      throw new ApiError("CONFLICT", "Session already completed", 409);
    }

    // 3. Zaktualizowanie sesji
    const endedAt = new Date().toISOString();
    const { data: updatedSession, error: updateError } = await this.supabase
      .from("review_sessions")
      .update({
        ended_at: endedAt,
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      throw new ApiError("INTERNAL_ERROR", "Failed to complete session", 500);
    }

    // 4. Obliczenie duration_seconds
    const startedAt = new Date(updatedSession.started_at);
    const endedAtDate = new Date(updatedSession.ended_at || endedAt);
    const durationSeconds = Math.round((endedAtDate.getTime() - startedAt.getTime()) / 1000);

    // 5. Zwrócenie odpowiedzi
    return {
      id: updatedSession.id,
      deck_id: updatedSession.deck_id,
      started_at: updatedSession.started_at,
      ended_at: updatedSession.ended_at || endedAt,
      cards_reviewed: updatedSession.cards_reviewed ?? 0,
      duration_seconds: durationSeconds,
    };
  }

  /**
   * Obliczenie nowych wartości SM-2 na podstawie oceny
   * Algorytm SuperMemo 2 dla spaced repetition
   * @private
   */
  private calculateSM2(
    rating: number,
    currentEasinessFactor: number,
    currentInterval: number,
    currentRepetitions: number
  ): { easinessFactor: number; interval: number; repetitions: number; nextReviewDate: string } {
    let easinessFactor = currentEasinessFactor;
    let interval = currentInterval;
    let repetitions = currentRepetitions;

    // Obliczenie nowego Easiness Factor
    // Formuła: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    // gdzie q = rating (1-4), przekształcamy na skalę 0-5 dla SM-2
    const q = rating === 1 ? 0 : rating === 2 ? 3 : rating === 3 ? 4 : 5;
    easinessFactor = easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    // Ograniczenie EF do zakresu 1.3 - 2.5
    if (easinessFactor < 1.3) easinessFactor = 1.3;
    if (easinessFactor > 2.5) easinessFactor = 2.5;

    // Obliczenie nowego interwału i liczby powtórek
    if (rating < 3) {
      // Rating 1 lub 2 (Again, Hard) - reset
      repetitions = 0;
      interval = 1;
    } else {
      // Rating 3 lub 4 (Good, Easy) - zwiększ powtórki
      repetitions += 1;

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        // repetitions >= 3
        interval = Math.round(interval * easinessFactor);
      }

      // Bonus dla Easy (rating 4)
      if (rating === 4) {
        interval = Math.round(interval * 1.3);
      }
    }

    // Obliczenie next_review_date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      easinessFactor: Math.round(easinessFactor * 100) / 100, // Zaokrąglenie do 2 miejsc po przecinku
      interval,
      repetitions,
      nextReviewDate: nextReviewDate.toISOString(),
    };
  }
}
