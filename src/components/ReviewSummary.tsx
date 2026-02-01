import { Button } from "./ui/button";
import { CheckCircle2, TrendingUp, XCircle } from "lucide-react";

interface ReviewSummaryProps {
  acceptedCount: number;
  editedCount: number;
  rejectedCount: number;
  totalCount: number;
  deckId: string | null;
  onComplete: () => void;
  onAddMore: () => void;
}

export default function ReviewSummary({
  acceptedCount,
  editedCount,
  rejectedCount,
  totalCount,
  onComplete,
  onAddMore,
}: ReviewSummaryProps) {
  const savedCount = acceptedCount + editedCount;
  const successRate = totalCount > 0 ? Math.round((savedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center space-y-6">
      <div className="flex items-center justify-center">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-2">Recenzja zakończona!</h2>
        <p className="text-muted-foreground">Sprawdź podsumowanie i zdecyduj co dalej</p>
      </div>

      <div className="grid grid-cols-3 gap-6 py-6">
        <div className="space-y-2">
          <div className="text-4xl font-bold text-green-600">{acceptedCount}</div>
          <div className="text-sm text-muted-foreground">Zaakceptowane</div>
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-bold text-blue-600">{editedCount}</div>
          <div className="text-sm text-muted-foreground">Edytowane</div>
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-bold text-red-600">{rejectedCount}</div>
          <div className="text-sm text-muted-foreground">Odrzucone</div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-center gap-2 text-lg mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            Zapisano {savedCount} z {totalCount} fiszek
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Wskaźnik akceptacji: {successRate}%</p>
      </div>

      <div className="flex gap-4 justify-center pt-4">
        <Button onClick={onAddMore} variant="outline" size="lg">
          Dodaj więcej fiszek
        </Button>
        <Button onClick={onComplete} size="lg">
          Przejdź do talii
        </Button>
      </div>
    </div>
  );
}
