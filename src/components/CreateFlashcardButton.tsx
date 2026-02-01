import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeckSelector } from "./DeckSelector";
import type { CreateFlashcardCommand, FlashcardDTO } from "@/types";

interface CreateFlashcardButtonProps {
  preselectedDeckId?: string;
  onFlashcardCreated?: (flashcard: FlashcardDTO) => void;
}

export function CreateFlashcardButton({ preselectedDeckId, onFlashcardCreated }: CreateFlashcardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(preselectedDeckId || null);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selectedDeckId if preselectedDeckId changes
  useEffect(() => {
    if (preselectedDeckId) {
      setSelectedDeckId(preselectedDeckId);
    }
  }, [preselectedDeckId]);

  // Validation functions
  const validateFront = (value: string): string | null => {
    if (value.trim().length === 0) return "Pytanie jest wymagane";
    if (value.length > 1000) return "Pytanie jest za długie (max 1000 znaków)";
    return null;
  };

  const validateBack = (value: string): string | null => {
    if (value.trim().length === 0) return "Odpowiedź jest wymagana";
    if (value.length > 1000) return "Odpowiedź jest za długa (max 1000 znaków)";
    return null;
  };

  const validateDeck = (deckId: string | null): string | null => {
    if (!deckId) return "Wybierz talię";
    return null;
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      front.trim().length > 0 &&
      front.length <= 1000 &&
      back.trim().length > 0 &&
      back.length <= 1000 &&
      selectedDeckId !== null
    );
  }, [front, back, selectedDeckId]);

  // Handle input changes with validation
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFront(value);
    setFrontError(validateFront(value));
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBack(value);
    setBackError(validateBack(value));
  };

  const handleDeckSelect = (deckId: string) => {
    setSelectedDeckId(deckId);
    setDeckError(validateDeck(deckId));
  };

  const handleDeckCreated = () => {
    // Deck is already selected by DeckSelector
    setDeckError(null);
  };

  // Reset form
  const resetForm = () => {
    setFront("");
    setBack("");
    setSelectedDeckId(preselectedDeckId || null);
    setFrontError(null);
    setBackError(null);
    setDeckError(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };

  // Handle submit
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Final validation
    const frontErr = validateFront(front);
    const backErr = validateBack(back);
    const deckErr = validateDeck(selectedDeckId);

    if (frontErr || backErr || deckErr) {
      setFrontError(frontErr);
      setBackError(backErr);
      setDeckError(deckErr);
      return;
    }

    setIsSubmitting(true);

    try {
      const command: CreateFlashcardCommand = {
        deck_id: selectedDeckId as string,
        front: front.trim(),
        back: back.trim(),
        source: "manual",
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się dodać fiszki");
      }

      const createdFlashcard: FlashcardDTO = await response.json();

      // Success
      onFlashcardCreated?.(createdFlashcard);

      // Show success toast
      toast.success("Fiszka została dodana!");

      // Close modal and reset form
      setIsOpen(false);
      resetForm();

      // Refresh page to show new flashcard
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się dodać fiszki. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter submits the form
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>➕ Dodaj fiszkę</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <DialogDescription>
            Utwórz nową fiszkę manualnie. Wypełnij pytanie, odpowiedź i wybierz talię.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front (question) */}
          <div className="space-y-2">
            <Label htmlFor="front">Przód (pytanie)</Label>
            <Textarea
              id="front"
              value={front}
              onChange={handleFrontChange}
              placeholder="Wpisz pytanie..."
              maxLength={1000}
              rows={3}
              className={frontError ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{front.length}/1000</span>
              {frontError && <span className="text-red-600">{frontError}</span>}
            </div>
          </div>

          {/* Back (answer) */}
          <div className="space-y-2">
            <Label htmlFor="back">Tył (odpowiedź)</Label>
            <Textarea
              id="back"
              value={back}
              onChange={handleBackChange}
              placeholder="Wpisz odpowiedź..."
              maxLength={1000}
              rows={3}
              className={backError ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{back.length}/1000</span>
              {backError && <span className="text-red-600">{backError}</span>}
            </div>
          </div>

          {/* Deck selector */}
          <DeckSelector
            selectedDeckId={selectedDeckId}
            onDeckSelect={handleDeckSelect}
            onDeckCreated={handleDeckCreated}
            error={deckError || undefined}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? "Dodawanie..." : "Dodaj fiszkę"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
