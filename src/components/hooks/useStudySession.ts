import { useState, useCallback } from "react";
import type { DueFlashcardDTO, ReviewRating, StudySessionDetailDTO, SubmitReviewCommand } from "../../types";

export interface StudySessionState {
  // Session data
  session: StudySessionDetailDTO | null;
  dueCards: DueFlashcardDTO[];
  currentCardIndex: number;
  currentCard: DueFlashcardDTO | null;

  // UI state
  isAnswerRevealed: boolean;
  isSessionCompleted: boolean;
  isLoading: boolean;
  error: string | null;

  // Statistics
  cardsReviewed: number;
  ratingsBreakdown: RatingsBreakdown;
}

export interface RatingsBreakdown {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export interface StudySessionActions {
  revealAnswer: () => void;
  submitReview: (rating: ReviewRating) => Promise<void>;
  completeSession: () => Promise<void>;
  exitSession: () => void;
}

export type StudySessionContextType = StudySessionState & StudySessionActions;

export function useStudySession(
  sessionId: string,
  initialSession: StudySessionDetailDTO,
  initialDueCards: DueFlashcardDTO[]
): StudySessionContextType {
  const [state, setState] = useState<StudySessionState>({
    session: initialSession,
    dueCards: initialDueCards,
    currentCardIndex: 0,
    currentCard: initialDueCards[0] || null,
    isAnswerRevealed: false,
    isSessionCompleted: false,
    isLoading: false,
    error: null,
    cardsReviewed: initialSession.cards_reviewed || 0,
    ratingsBreakdown: {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    },
  });

  const revealAnswer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAnswerRevealed: true,
    }));
  }, []);

  const completeSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/study-sessions/${sessionId}/complete`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to complete session");
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        session: data,
        isLoading: false,
        isSessionCompleted: true,
      }));
    } catch (error) {
      console.error("Error completing session:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Nie udało się zakończyć sesji.",
      }));
    }
  }, [sessionId]);

  const submitReview = useCallback(
    async (rating: ReviewRating) => {
      if (!state.currentCard) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const command: SubmitReviewCommand = {
          flashcard_id: state.currentCard.id,
          rating,
        };

        const response = await fetch(`/api/study-sessions/${sessionId}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          throw new Error("Failed to submit review");
        }

        const data = await response.json();

        // Update ratings breakdown
        const ratingKey = ["again", "hard", "good", "easy"][rating - 1] as keyof RatingsBreakdown;
        const newRatingsBreakdown = {
          ...state.ratingsBreakdown,
          [ratingKey]: state.ratingsBreakdown[ratingKey] + 1,
        };

        // Move to next card
        const nextIndex = state.currentCardIndex + 1;
        const isLastCard = nextIndex >= state.dueCards.length;

        setState((prev) => ({
          ...prev,
          currentCardIndex: nextIndex,
          currentCard: isLastCard ? null : prev.dueCards[nextIndex],
          isAnswerRevealed: false,
          isLoading: false,
          cardsReviewed: data.session.cards_reviewed,
          ratingsBreakdown: newRatingsBreakdown,
          isSessionCompleted: isLastCard,
        }));

        // Auto-complete session if last card
        if (isLastCard) {
          await completeSession();
        }
      } catch (error) {
        console.error("Error submitting review:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Nie udało się zapisać oceny. Spróbuj ponownie.",
        }));
      }
    },
    [sessionId, state.currentCard, state.currentCardIndex, state.dueCards, state.ratingsBreakdown, completeSession]
  );

  const exitSession = useCallback(() => {
    const confirmExit = window.confirm("Czy na pewno chcesz zakończyć sesję? Postęp zostanie zapisany.");

    if (confirmExit && state.session) {
      window.location.href = `/decks/${state.session.deck_id}`;
    }
  }, [state.session]);

  return {
    ...state,
    revealAnswer,
    submitReview,
    completeSession,
    exitSession,
  };
}
