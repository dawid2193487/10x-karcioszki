import { Button } from "./ui/button";
import { EditableDeckName } from "./EditableDeckName";
import { HelpButton } from "./HelpButton";
import { CreateFlashcardButton } from "./CreateFlashcardButton";
import type { DeckDetailDTO, FlashcardDTO } from "../types";

interface DeckHeaderProps {
  deck: DeckDetailDTO;
  onGenerateAI: () => void;
  onStartStudy: () => void;
  onDeckUpdate: (updatedDeck: DeckDetailDTO) => void;
  onFlashcardCreated?: (flashcard: FlashcardDTO) => void;
}

export function DeckHeader({ deck, onGenerateAI, onStartStudy, onDeckUpdate, onFlashcardCreated }: DeckHeaderProps) {
  const handleDeckNameUpdate = (newName: string) => {
    // Update the deck object with new name
    onDeckUpdate({
      ...deck,
      name: newName,
    });
  };

  const handleBackClick = () => {
    window.location.href = "/";
  };

  const canStartStudy = deck.due_count > 0;

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Wstecz
          </Button>
        </div>

        <HelpButton />
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <EditableDeckName deckId={deck.id} initialName={deck.name} onUpdate={handleDeckNameUpdate} />

          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>{deck.flashcard_count} fiszek</span>
            <span>•</span>
            <span>{deck.due_count} do powtórki</span>
            <span>•</span>
            <span>{deck.new_count} nowych</span>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <CreateFlashcardButton preselectedDeckId={deck.id} onFlashcardCreated={onFlashcardCreated} />

          <Button onClick={onGenerateAI} variant="outline" className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generuj AI
          </Button>

          <Button onClick={onStartStudy} disabled={!canStartStudy} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Rozpocznij naukę
          </Button>
        </div>
      </div>
    </header>
  );
}
