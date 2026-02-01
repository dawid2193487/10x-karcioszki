import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import type { DueFlashcardDTO } from "../types";

interface FlashcardDisplayProps {
  card: DueFlashcardDTO;
  isRevealed: boolean;
  onReveal: () => void;
}

export default function FlashcardDisplay({ card, isRevealed, onReveal }: FlashcardDisplayProps) {
  const [displayedCard, setDisplayedCard] = useState(card);
  const previousCardId = useRef(card.id);

  useEffect(() => {
    // Sprawdź czy karta się zmieniła
    if (card.id !== previousCardId.current) {
      // Karta się zmieniła - zawsze czekaj 500ms na zakończenie animacji odwracania
      const timer = setTimeout(() => {
        setDisplayedCard(card);
        previousCardId.current = card.id;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [card]);

  return (
    <div className="relative w-full min-h-[400px] mb-8">
      {/* Flashcard container with 3D perspective */}
      <div className="relative w-full h-full" style={{ perspective: "1000px" }}>
        {/* Card inner wrapper for flip animation */}
        <div
          className={`relative w-full min-h-[400px] transition-transform duration-500 preserve-3d ${
            isRevealed ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front of card */}
          <div
            className="absolute inset-0 w-full min-h-[400px] backface-hidden bg-card border-2 border-border rounded-lg p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-sm text-muted-foreground mb-4">Pytanie</div>
            <div className="text-2xl text-center text-foreground font-medium">{displayedCard.front}</div>
          </div>

          {/* Back of card */}
          <div
            className="absolute inset-0 w-full min-h-[400px] backface-hidden bg-card border-2 border-border rounded-lg p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="text-sm text-muted-foreground mb-4">Odpowiedź</div>
            <div className="text-2xl text-center text-foreground font-medium">{displayedCard.back}</div>
          </div>
        </div>
      </div>

      {/* Reveal button - only visible when answer is hidden */}
      {!isRevealed && (
        <div className="mt-6 flex justify-center">
          <Button onClick={onReveal} size="lg" className="min-w-[200px]" aria-label="Pokaż odpowiedź">
            Pokaż odpowiedź
            <span className="ml-2 text-xs text-muted-foreground">(Spacja)</span>
          </Button>
        </div>
      )}
    </div>
  );
}
