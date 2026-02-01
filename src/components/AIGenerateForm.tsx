import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { GenerateFlashcardsCommand, GenerateFlashcardsResponseDTO } from "@/types";
import CharacterCounter from "@/components/CharacterCounter";
import EstimatedCount from "@/components/EstimatedCount";
import { DeckSelector } from "@/components/DeckSelector";

const MIN_CHARS = 100;
const MAX_CHARS = 5000;

interface AIGenerateFormProps {
  initialDeckId?: string;
}

export default function AIGenerateForm({ initialDeckId }: AIGenerateFormProps) {
  const [text, setText] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(initialDeckId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const characterCount = text.length;
  const isValid = characterCount >= MIN_CHARS && characterCount <= MAX_CHARS && selectedDeckId !== null;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isValid) {
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const command: GenerateFlashcardsCommand = {
          text: text.trim(),
          language: "pl",
        };

        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle specific error codes
          if (response.status === 400) {
            toast.error("Tekst musi mieć 100-5000 znaków");
          } else if (response.status === 429) {
            const retryAfter = errorData.error?.details?.retryAfter || "kilka";
            toast.error(`Zbyt wiele prób. Spróbuj za ${retryAfter} sekund`);
          } else if (response.status === 503) {
            toast.error("Generowanie trwa zbyt długo. Spróbuj z krótszym tekstem");
          } else {
            toast.error("Nie udało się wygenerować fiszek. Spróbuj ponownie");
          }
          return;
        }

        const data: GenerateFlashcardsResponseDTO = await response.json();

        // Store generation data in sessionStorage for review page
        sessionStorage.setItem("generationLogId", data.generation_log_id);
        sessionStorage.setItem("generatedFlashcards", JSON.stringify(data.flashcards));
        if (selectedDeckId) {
          sessionStorage.setItem("selectedDeckId", selectedDeckId);
        }

        // Redirect to review page
        window.location.href = "/generate/review";
      } catch (err) {
        // Log error for debugging
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Error generating flashcards:", err);
        }
        toast.error("Nie udało się wygenerować fiszek. Spróbuj ponownie");
        setError("Wystąpił błąd podczas generowania fiszek");
      } finally {
        setIsGenerating(false);
      }
    },
    [isValid, text, selectedDeckId]
  );

  // Keyboard shortcut for submit (Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && isValid && !isGenerating) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isValid, isGenerating, handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Text Input Section */}
      <div className="space-y-2">
        <label htmlFor="text-input" className="block text-sm font-medium">
          Tekst edukacyjny
        </label>
        <Textarea
          id="text-input"
          placeholder="Wklej tutaj materiał edukacyjny (np. fragment podręcznika, notatki z wykładu, artykuł)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[300px] resize-y"
          disabled={isGenerating}
          aria-describedby="char-counter estimated-count"
        />
        <div className="flex items-center justify-between text-sm">
          <CharacterCounter current={characterCount} max={MAX_CHARS} min={MIN_CHARS} />
          <EstimatedCount textLength={characterCount} />
        </div>
      </div>

      {/* Deck Selection */}
      <div className="space-y-2">
        <label htmlFor="deck-selector" className="block text-sm font-medium">
          Talia docelowa
        </label>
        <DeckSelector selectedDeckId={selectedDeckId} onDeckSelect={setSelectedDeckId} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Skrót: <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd>
        </p>
        <Button type="submit" size="lg" disabled={!isValid || isGenerating} className="min-w-[200px]">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generowanie...
            </>
          ) : (
            "Generuj fiszki"
          )}
        </Button>
      </div>
    </form>
  );
}
