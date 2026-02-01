import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  GeneratedFlashcardDTO,
  CreateFlashcardCommand,
  FlashcardDTO,
  LogAiReviewActionCommand,
  AiReviewActionType,
} from "@/types";
import ReviewHeader from "./ReviewHeader";
import ReviewProgress from "./ReviewProgress";
import FlashcardReviewCard from "./FlashcardReviewCard";
import ReviewSummary from "./ReviewSummary";

// Extended flashcard type for review state
interface ReviewFlashcard extends GeneratedFlashcardDTO {
  id: string; // temporary ID for state management
  status: "pending" | "accepted" | "edited" | "rejected";
  flashcardId?: string; // ID after save to database (only for accepted/edited)
}

interface ReviewStats {
  total: number;
  current: number;
  acceptedCount: number;
  editedCount: number;
  rejectedCount: number;
  remaining: number;
}

interface AIReviewInterfaceProps {
  initialDeckId?: string;
}

export default function AIReviewInterface({ initialDeckId }: AIReviewInterfaceProps) {
  const [flashcards, setFlashcards] = useState<ReviewFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(initialDeckId || null);
  const [generationLogId, setGenerationLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Load data from sessionStorage on mount
  useEffect(() => {
    try {
      const logId = sessionStorage.getItem("generationLogId");
      const flashcardsData = sessionStorage.getItem("generatedFlashcards");
      const deckId = sessionStorage.getItem("selectedDeckId");

      if (!logId || !flashcardsData) {
        toast.error("Brak danych do recenzji. Wracam do formularza.");
        window.location.href = "/generate";
        return;
      }

      setGenerationLogId(logId);
      if (deckId) {
        setSelectedDeckId(deckId);
      }

      const parsed: GeneratedFlashcardDTO[] = JSON.parse(flashcardsData);
      const reviewFlashcards: ReviewFlashcard[] = parsed.map((fc, idx) => ({
        ...fc,
        id: `temp-${idx}`,
        status: "pending",
      }));

      setFlashcards(reviewFlashcards);
      setIsLoading(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error loading review data:", error);
      }
      toast.error("Wystąpił błąd podczas ładowania danych");
      window.location.href = "/generate";
    }
  }, []);

  // Calculate stats
  const stats: ReviewStats = {
    total: flashcards.length,
    current: currentIndex + 1,
    acceptedCount: flashcards.filter((fc) => fc.status === "accepted").length,
    editedCount: flashcards.filter((fc) => fc.status === "edited").length,
    rejectedCount: flashcards.filter((fc) => fc.status === "rejected").length,
    remaining: flashcards.filter((fc) => fc.status === "pending").length,
  };

  // Log review action to API
  const logReviewAction = useCallback(
    async (
      flashcard: ReviewFlashcard,
      actionType: AiReviewActionType,
      flashcardId?: string,
      editedFront?: string,
      editedBack?: string
    ) => {
      if (!generationLogId) return;

      try {
        const command: LogAiReviewActionCommand = {
          generation_log_id: generationLogId,
          flashcard_id: flashcardId || null,
          action_type: actionType,
          original_front: flashcard.front,
          original_back: flashcard.back,
          edited_front: editedFront,
          edited_back: editedBack,
        };

        await fetch("/api/ai/review-actions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Error logging review action:", error);
        }
        // Don't show error to user - this is analytics
      }
    },
    [generationLogId]
  );

  // Handle accept flashcard
  const handleAccept = useCallback(async () => {
    if (!selectedDeckId) {
      toast.error("Wybierz talię przed zaakceptowaniem fiszki");
      return;
    }

    const currentFlashcard = flashcards[currentIndex];
    if (!currentFlashcard || currentFlashcard.status !== "pending") {
      return;
    }

    setIsSaving(true);

    try {
      // Create flashcard in database
      const command: CreateFlashcardCommand = {
        deck_id: selectedDeckId,
        front: currentFlashcard.front,
        back: currentFlashcard.back,
        source: "ai",
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error("Failed to create flashcard");
      }

      const flashcard: FlashcardDTO = await response.json();

      // Log review action
      await logReviewAction(currentFlashcard, "accepted", flashcard.id);

      // Update state
      setFlashcards((prev) =>
        prev.map((fc, idx) => (idx === currentIndex ? { ...fc, status: "accepted", flashcardId: flashcard.id } : fc))
      );

      // Move to next or complete
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }

      toast.success("Fiszka zaakceptowana");
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error accepting flashcard:", error);
      }
      toast.error("Nie udało się zaakceptować fiszki");
    } finally {
      setIsSaving(false);
    }
  }, [flashcards, currentIndex, selectedDeckId, logReviewAction]);

  // Handle edit flashcard
  const handleEdit = useCallback(
    async (editedFront: string, editedBack: string) => {
      if (!selectedDeckId) {
        toast.error("Wybierz talię przed zapisaniem fiszki");
        return;
      }

      const currentFlashcard = flashcards[currentIndex];
      if (!currentFlashcard || currentFlashcard.status !== "pending") {
        return;
      }

      setIsSaving(true);

      try {
        // Create flashcard in database with edited content
        const command: CreateFlashcardCommand = {
          deck_id: selectedDeckId,
          front: editedFront,
          back: editedBack,
          source: "ai",
        };

        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          throw new Error("Failed to create flashcard");
        }

        const flashcard: FlashcardDTO = await response.json();

        // Log review action with edited content
        await logReviewAction(currentFlashcard, "edited", flashcard.id, editedFront, editedBack);

        // Update state
        setFlashcards((prev) =>
          prev.map((fc, idx) => (idx === currentIndex ? { ...fc, status: "edited", flashcardId: flashcard.id } : fc))
        );

        // Move to next or complete
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsCompleted(true);
        }

        toast.success("Fiszka zapisana z edycją");
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Error editing flashcard:", error);
        }
        toast.error("Nie udało się zapisać fiszki");
      } finally {
        setIsSaving(false);
      }
    },
    [flashcards, currentIndex, selectedDeckId, logReviewAction]
  );

  // Handle reject flashcard
  const handleReject = useCallback(async () => {
    const currentFlashcard = flashcards[currentIndex];
    if (!currentFlashcard || currentFlashcard.status !== "pending") {
      return;
    }

    // Log review action (no flashcard ID as it's rejected)
    await logReviewAction(currentFlashcard, "rejected");

    // Update state
    setFlashcards((prev) => prev.map((fc, idx) => (idx === currentIndex ? { ...fc, status: "rejected" } : fc)));

    // Move to next or complete
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }

    toast.success("Fiszka odrzucona");
  }, [flashcards, currentIndex, logReviewAction]);

  // Handle navigation
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, flashcards.length]);

  // Handle completion
  const handleComplete = useCallback(() => {
    // Clear sessionStorage
    sessionStorage.removeItem("generationLogId");
    sessionStorage.removeItem("generatedFlashcards");
    sessionStorage.removeItem("selectedDeckId");

    // Redirect to deck or home
    if (selectedDeckId) {
      window.location.href = `/decks/${selectedDeckId}`;
    } else {
      window.location.href = "/";
    }
  }, [selectedDeckId]);

  const handleAddMore = useCallback(() => {
    // Clear sessionStorage
    sessionStorage.removeItem("generationLogId");
    sessionStorage.removeItem("generatedFlashcards");
    sessionStorage.removeItem("selectedDeckId");

    // Redirect to generate form
    window.location.href = "/generate";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie fiszek...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Brak fiszek do recenzji</p>
        <button onClick={handleAddMore} className="text-primary hover:underline">
          Wróć do formularza
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto">
        <ReviewSummary
          acceptedCount={stats.acceptedCount}
          editedCount={stats.editedCount}
          rejectedCount={stats.rejectedCount}
          totalCount={stats.total}
          deckId={selectedDeckId}
          onComplete={handleComplete}
          onAddMore={handleAddMore}
        />
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ReviewHeader selectedDeckId={selectedDeckId} onDeckChange={setSelectedDeckId} stats={stats} />

      <ReviewProgress stats={stats} />

      {currentFlashcard && (
        <FlashcardReviewCard
          flashcard={currentFlashcard}
          onAccept={handleAccept}
          onEdit={handleEdit}
          onReject={handleReject}
          onPrevious={handlePrevious}
          onNext={handleNext}
          canNavigatePrev={currentIndex > 0}
          canNavigateNext={currentIndex < flashcards.length - 1}
          isSaving={isSaving}
          deckSelected={selectedDeckId !== null}
        />
      )}
    </div>
  );
}
