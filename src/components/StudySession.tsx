import { useState, useCallback, useEffect } from "react";
import SessionHeader from "./SessionHeader";
import FlashcardDisplay from "./FlashcardDisplay";
import DifficultyButtons from "./DifficultyButtons";
import SessionSummary from "./SessionSummary";
import KeyboardShortcutsOverlay from "./KeyboardShortcutsOverlay";
import { useStudySession } from "./hooks/useStudySession";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { DueFlashcardDTO, StudySessionDetailDTO } from "../types";

interface StudySessionProps {
  sessionId: string;
  initialSession: StudySessionDetailDTO;
  initialDueCards: DueFlashcardDTO[];
}

export default function StudySession({ sessionId, initialSession, initialDueCards }: StudySessionProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [hasSeenHelp, setHasSeenHelp] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hideShortcutsOverlay") === "true";
    }
    return false;
  });

  const sessionState = useStudySession(sessionId, initialSession, initialDueCards);

  const {
    currentCard,
    isAnswerRevealed,
    isSessionCompleted,
    isLoading,
    error,
    dueCards,
    currentCardIndex,
    session,
    ratingsBreakdown,
    revealAnswer,
    submitReview,
    exitSession,
  } = sessionState;

  // Show help on first load if not seen before
  useEffect(() => {
    if (!hasSeenHelp && typeof window !== "undefined") {
      setShowHelp(true);
    }
  }, [hasSeenHelp]);

  const handleShowHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  const handleCloseHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  const handleDismissHelpForever = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hideShortcutsOverlay", "true");
      setHasSeenHelp(true);
    }
    setShowHelp(false);
  }, []);

  const handleRepeatSession = useCallback(() => {
    if (session) {
      window.location.href = `/decks/${session.deck_id}`;
    }
  }, [session]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isAnswerRevealed,
    onReveal: revealAnswer,
    onRate: submitReview,
    onShowHelp: handleShowHelp,
  });

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-primary hover:underline">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  // No cards state
  if (!currentCard && !isSessionCompleted) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-4">Brak fiszek do nauki w tej sesji.</p>
        <a href={session ? `/decks/${session.deck_id}` : "/dashboard"} className="text-primary hover:underline">
          Powrót do talii
        </a>
      </div>
    );
  }

  const cardsRemaining = dueCards.length - currentCardIndex;
  const totalCards = dueCards.length;

  return (
    <>
      {session && (
        <SessionHeader
          deckName={session.deck_name}
          cardsRemaining={cardsRemaining}
          totalCards={totalCards}
          onExit={exitSession}
        />
      )}

      {currentCard && (
        <>
          <FlashcardDisplay card={currentCard} isRevealed={isAnswerRevealed} onReveal={revealAnswer} />

          <DifficultyButtons isEnabled={isAnswerRevealed && !isLoading} onRate={submitReview} />
        </>
      )}

      {/* Session Summary Modal */}
      {isSessionCompleted && session && (
        <SessionSummary
          isOpen={isSessionCompleted}
          cardsReviewed={totalCards}
          durationSeconds={0} // Will be calculated from session data
          ratingsBreakdown={ratingsBreakdown}
          onClose={() => {
            window.location.href = `/decks/${session.deck_id}`;
          }}
          onRepeat={handleRepeatSession}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsOverlay
        isOpen={showHelp}
        onClose={handleCloseHelp}
        onDismissForever={handleDismissHelpForever}
        showDismissOption={!hasSeenHelp}
      />
    </>
  );
}
