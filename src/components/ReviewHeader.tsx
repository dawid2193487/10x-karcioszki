import { DeckSelector } from "./DeckSelector";

interface ReviewStats {
  total: number;
  current: number;
  acceptedCount: number;
  editedCount: number;
  rejectedCount: number;
  remaining: number;
}

interface ReviewHeaderProps {
  selectedDeckId: string | null;
  onDeckChange: (deckId: string) => void;
  stats: ReviewStats;
}

export default function ReviewHeader({ selectedDeckId, onDeckChange, stats }: ReviewHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recenzja wygenerowanych fiszek</h1>
        <div className="text-sm text-muted-foreground">
          {stats.current} / {stats.total}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Talia docelowa</label>
          <DeckSelector selectedDeckId={selectedDeckId} onDeckSelect={onDeckChange} />
        </div>

        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.acceptedCount}</div>
            <div className="text-muted-foreground">Zaakceptowane</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejectedCount}</div>
            <div className="text-muted-foreground">Odrzucone</div>
          </div>
        </div>
      </div>
    </div>
  );
}
