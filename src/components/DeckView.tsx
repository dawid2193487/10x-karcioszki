import { useState, useEffect } from "react";
import { DeckHeader } from "./DeckHeader";
import { FlashcardTableRow, FlashcardCard } from "./FlashcardRow";
import { Pagination } from "./Pagination";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { EmptyState } from "./EmptyStateReact";
import type { DeckDetailDTO, FlashcardListItemDTO, PaginationMetadata } from "../types";
import { toast } from "sonner";

interface DeckViewProps {
  initialDeck: DeckDetailDTO;
  initialFlashcards: FlashcardListItemDTO[];
  initialPagination: PaginationMetadata;
}

export function DeckView({ initialDeck, initialFlashcards, initialPagination }: DeckViewProps) {
  const [deck, setDeck] = useState<DeckDetailDTO>(initialDeck);
  const [flashcards, setFlashcards] = useState<FlashcardListItemDTO[]>(initialFlashcards);
  const [pagination, setPagination] = useState<PaginationMetadata>(initialPagination);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    flashcard: FlashcardListItemDTO | null;
  }>({ open: false, flashcard: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle deck name update
  const handleDeckUpdate = (updatedDeck: DeckDetailDTO) => {
    setDeck(updatedDeck);
  };

  // Handle flashcard creation
  const handleFlashcardCreated = async () => {
    // Refresh flashcards list
    try {
      const response = await fetch(
        `/api/flashcards?deck_id=${deck.id}&page=${pagination.page}&limit=${pagination.limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to refresh flashcards");
      }

      const data = await response.json();
      setFlashcards(data.data);
      setPagination(data.pagination);

      // Update deck stats
      const deckResponse = await fetch(`/api/decks/${deck.id}`);
      if (deckResponse.ok) {
        const deckData = await deckResponse.json();
        setDeck(deckData);
      }

      toast.success("Fiszka została dodana");
    } catch (error) {
      console.error("Error refreshing flashcards:", error);
      toast.error("Nie udało się odświeżyć listy fiszek");
    }
  };

  // Handle flashcard update
  const handleFlashcardUpdate = (flashcardId: string, field: "front" | "back", value: string) => {
    setFlashcards((prev) => prev.map((f) => (f.id === flashcardId ? { ...f, [field]: value } : f)));
  };

  // Handle flashcard deletion
  const handleDeleteClick = (flashcard: FlashcardListItemDTO) => {
    setDeleteDialog({ open: true, flashcard });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.flashcard) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/flashcards/${deleteDialog.flashcard.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete flashcard");
      }

      // Remove flashcard from state
      setFlashcards((prev) => prev.filter((f) => f.id !== deleteDialog.flashcard!.id));

      // Update deck stats
      setDeck((prev) => ({
        ...prev,
        flashcard_count: prev.flashcard_count - 1,
      }));

      toast.success("Fiszka została usunięta");
      setDeleteDialog({ open: false, flashcard: null });

      // If this was the last flashcard on the page and not the first page, go to previous page
      if (flashcards.length === 1 && pagination.page > 1) {
        const newPage = pagination.page - 1;
        window.location.href = `/decks/${deck.id}?page=${newPage}&limit=${pagination.limit}`;
      }
    } catch (error: any) {
      console.error("Error deleting flashcard:", error);
      toast.error(error.message || "Nie udało się usunąć fiszki");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Generate AI action
  const handleGenerateAI = () => {
    window.location.href = `/generate?deck_id=${deck.id}`;
  };

  // Handle Start Study action
  const handleStartStudy = async () => {
    try {
      // Create study session
      const response = await fetch("/api/study-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deck_id: deck.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to start study session");
      }

      const sessionData = await response.json();

      // Redirect to study session page
      window.location.href = `/study/${sessionData.id}`;
    } catch (error: any) {
      console.error("Error starting study session:", error);
      toast.error(error.message || "Nie udało się rozpocząć nauki");
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    window.location.href = `/decks/${deck.id}?page=${newPage}&limit=${pagination.limit}`;
  };

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    window.location.href = `/decks/${deck.id}?page=1&limit=${newLimit}`;
  };

  return (
    <div className="deck-view">
      {/* Deck Header */}
      <DeckHeader
        deck={deck}
        onDeckUpdate={handleDeckUpdate}
        onFlashcardCreated={handleFlashcardCreated}
        onGenerateAI={handleGenerateAI}
        onStartStudy={handleStartStudy}
      />

      {/* Flashcards List */}
      {flashcards.length === 0 ? (
        <EmptyState
          title="Brak fiszek w talii"
          description="Dodaj pierwszą fiszkę lub wygeneruj z AI"
          onAddFlashcard={handleFlashcardCreated}
          onGenerateAI={handleGenerateAI}
        />
      ) : (
        <>
          {/* Desktop: Table view */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Przód</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tył</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {flashcards.map((flashcard) => (
                  <FlashcardTableRow
                    key={flashcard.id}
                    flashcard={flashcard}
                    onUpdate={handleFlashcardUpdate}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card view */}
          <div className="md:hidden space-y-4">
            {flashcards.map((flashcard) => (
              <FlashcardCard
                key={flashcard.id}
                flashcard={flashcard}
                onUpdate={handleFlashcardUpdate}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.total_pages}
            limit={pagination.limit}
            total={pagination.total}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, flashcard: null })}
        onConfirm={handleDeleteConfirm}
        flashcardFront={deleteDialog.flashcard?.front || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
}
