import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface SessionSummaryProps {
  isOpen: boolean;
  cardsReviewed: number;
  durationSeconds: number;
  ratingsBreakdown: RatingsBreakdown;
  onClose: () => void;
  onRepeat: () => void;
}

interface RatingsBreakdown {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export default function SessionSummary({
  isOpen,
  cardsReviewed,
  durationSeconds,
  ratingsBreakdown,
  onClose,
  onRepeat,
}: SessionSummaryProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes} min ${secs} s`;
    }
    return `${secs} s`;
  };

  const totalRatings = Object.values(ratingsBreakdown).reduce((a, b) => a + b, 0);
  const successRate =
    totalRatings > 0 ? Math.round(((ratingsBreakdown.good + ratingsBreakdown.easy) / totalRatings) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Sesja zakończona! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            Świetna robota! Oto podsumowanie twojej sesji nauki.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-foreground">{cardsReviewed}</div>
              <div className="text-sm text-muted-foreground">Przejrzane fiszki</div>
            </div>

            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-foreground">{successRate}%</div>
              <div className="text-sm text-muted-foreground">Skuteczność</div>
            </div>
          </div>

          {/* Ratings Breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Rozkład ocen</h3>
            <div className="space-y-2">
              {ratingsBreakdown.again > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-destructive">Again</span>
                  <span className="font-medium">{ratingsBreakdown.again}</span>
                </div>
              )}
              {ratingsBreakdown.hard > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600">Hard</span>
                  <span className="font-medium">{ratingsBreakdown.hard}</span>
                </div>
              )}
              {ratingsBreakdown.good > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Good</span>
                  <span className="font-medium">{ratingsBreakdown.good}</span>
                </div>
              )}
              {ratingsBreakdown.easy > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">Easy</span>
                  <span className="font-medium">{ratingsBreakdown.easy}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Zakończ
          </Button>
          <Button onClick={onRepeat}>Rozpocznij ponownie</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
