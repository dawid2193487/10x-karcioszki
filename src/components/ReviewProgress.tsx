interface ReviewStats {
  total: number;
  current: number;
  acceptedCount: number;
  editedCount: number;
  rejectedCount: number;
  remaining: number;
}

interface ReviewProgressProps {
  stats: ReviewStats;
}

export default function ReviewProgress({ stats }: ReviewProgressProps) {
  const progressPercentage = (stats.current / stats.total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Postęp recenzji</span>
        <span className="font-medium">
          {stats.remaining} pozostało
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
