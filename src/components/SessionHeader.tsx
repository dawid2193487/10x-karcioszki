import { X } from 'lucide-react';
import { Button } from './ui/button';
import SessionProgress from './SessionProgress';

interface SessionHeaderProps {
  deckName: string;
  cardsRemaining: number;
  totalCards: number;
  onExit: () => void;
}

export default function SessionHeader({
  deckName,
  cardsRemaining,
  totalCards,
  onExit,
}: SessionHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">{deckName}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          aria-label="Wyjdź z sesji"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <SessionProgress
        cardsRemaining={cardsRemaining}
        totalCards={totalCards}
      />
    </header>
  );
}
