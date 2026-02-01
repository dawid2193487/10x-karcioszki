import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Check, Pencil, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface ReviewFlashcard {
  id: string;
  front: string;
  back: string;
  status: "pending" | "accepted" | "edited" | "rejected";
}

interface FlashcardReviewCardProps {
  flashcard: ReviewFlashcard;
  onAccept: () => void;
  onEdit: (front: string, back: string) => void;
  onReject: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  isSaving: boolean;
  deckSelected: boolean;
}

export default function FlashcardReviewCard({
  flashcard,
  onAccept,
  onEdit,
  onReject,
  onPrevious,
  onNext,
  canNavigatePrev,
  canNavigateNext,
  isSaving,
  deckSelected,
}: FlashcardReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(flashcard.front);
  const [editedBack, setEditedBack] = useState(flashcard.back);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStartEdit = () => {
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setIsEditing(true);
    setValidationError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setValidationError(null);
  };

  const handleSaveEdit = () => {
    // Validation
    if (!editedFront.trim()) {
      setValidationError("Przód fiszki nie może być pusty");
      return;
    }
    if (!editedBack.trim()) {
      setValidationError("Tył fiszki nie może być pusty");
      return;
    }
    if (editedFront.length > 1000) {
      setValidationError("Przód fiszki nie może przekraczać 1000 znaków");
      return;
    }
    if (editedBack.length > 1000) {
      setValidationError("Tył fiszki nie może przekraczać 1000 znaków");
      return;
    }

    setValidationError(null);
    onEdit(editedFront.trim(), editedBack.trim());
    setIsEditing(false);
  };

  const isReviewed = flashcard.status !== "pending";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Status badge if reviewed */}
      {isReviewed && (
        <div
          className={`px-4 py-2 text-sm font-medium ${
            flashcard.status === "accepted"
              ? "bg-green-100 text-green-800"
              : flashcard.status === "edited"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {flashcard.status === "accepted"
            ? "✓ Zaakceptowana"
            : flashcard.status === "edited"
              ? "✓ Edytowana i zapisana"
              : "✗ Odrzucona"}
        </div>
      )}

      <div className="p-6 space-y-6">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-front" className="block text-sm font-medium mb-2">
                Przód fiszki
              </label>
              <Input
                id="edit-front"
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                placeholder="Wpisz przód fiszki..."
                className="w-full"
                disabled={isSaving}
              />
            </div>

            <div>
              <label htmlFor="edit-back" className="block text-sm font-medium mb-2">
                Tył fiszki
              </label>
              <Textarea
                id="edit-back"
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                placeholder="Wpisz tył fiszki..."
                className="w-full min-h-[120px]"
                disabled={isSaving}
              />
            </div>

            {validationError && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive">{validationError}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button onClick={handleCancelEdit} variant="outline" disabled={isSaving}>
                Anuluj
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz"
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="text-xs font-medium text-muted-foreground mb-1">PRZÓD</div>
                <div className="text-lg">{flashcard.front}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="text-xs font-medium text-muted-foreground mb-1">TYŁ</div>
                <div className="text-lg">{flashcard.back}</div>
              </div>
            </div>

            {/* Action buttons - only for pending cards */}
            {!isReviewed && (
              <>
                {!deckSelected && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">Wybierz talię, aby móc zaakceptować lub edytować fiszki</p>
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleStartEdit}
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-[200px]"
                    disabled={isSaving || !deckSelected}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edytuj (E)
                  </Button>

                  <Button
                    onClick={onAccept}
                    size="lg"
                    className="flex-1 max-w-[200px] bg-green-600 hover:bg-green-700"
                    disabled={isSaving || !deckSelected}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Akceptuj (Enter)
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={onReject}
                    variant="outline"
                    size="lg"
                    className="flex-1 max-w-[200px] text-red-600 border-red-600 hover:bg-red-50"
                    disabled={isSaving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Odrzuć (Del)
                  </Button>
                </div>

                <div className="text-sm text-center text-muted-foreground">
                  Skróty: <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> - Akceptuj,{" "}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">E</kbd> - Edytuj,{" "}
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Delete</kbd> - Odrzuć
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="border-t p-4 flex items-center justify-between bg-gray-50">
        <Button onClick={onPrevious} variant="ghost" disabled={!canNavigatePrev || isSaving} size="sm">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Poprzednia
        </Button>

        <div className="text-sm text-muted-foreground">
          Skróty: <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd> Poprzednia,{" "}
          <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd> Następna
        </div>

        <Button onClick={onNext} variant="ghost" disabled={!canNavigateNext || isSaving} size="sm">
          Następna
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
