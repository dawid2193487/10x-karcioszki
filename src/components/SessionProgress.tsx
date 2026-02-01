interface SessionProgressProps {
  cardsRemaining: number;
  totalCards: number;
  showProgressBar?: boolean;
}

export default function SessionProgress({
  cardsRemaining,
  totalCards,
  showProgressBar = true,
}: SessionProgressProps) {
  const cardsReviewed = totalCards - cardsRemaining;
  const progressPercentage = totalCards > 0 ? (cardsReviewed / totalCards) * 100 : 0;

  const remainingText =
    cardsRemaining === 1
      ? '1 fiszka pozostała'
      : `${cardsRemaining} fiszek pozostało`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{remainingText}</span>
        <span>
          {cardsReviewed} / {totalCards}
        </span>
      </div>
      {showProgressBar && (
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={cardsReviewed}
            aria-valuemin={0}
            aria-valuemax={totalCards}
            aria-label={`Postęp: ${cardsReviewed} z ${totalCards} fiszek przejrzanych`}
          />
        </div>
      )}
    </div>
  );
}
