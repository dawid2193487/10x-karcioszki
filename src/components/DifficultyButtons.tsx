import { Button } from "./ui/button";
import type { ReviewRating } from "../types";

interface DifficultyButtonsProps {
  isEnabled: boolean;
  onRate: (rating: ReviewRating) => void;
  nextReviewTimes?: NextReviewTimes;
}

interface NextReviewTimes {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

const DEFAULT_TIMES: NextReviewTimes = {
  again: "< 10 min",
  hard: "4 dni",
  good: "1 tydzień",
  easy: "2 tygodnie",
};

export default function DifficultyButtons({
  isEnabled,
  onRate,
  nextReviewTimes = DEFAULT_TIMES,
}: DifficultyButtonsProps) {
  const buttons = [
    {
      rating: 1 as ReviewRating,
      label: "Again",
      key: "1",
      time: nextReviewTimes.again,
      variant: "destructive" as const,
      ariaLabel: "Ocena: Ponownie - nie pamiętam",
    },
    {
      rating: 2 as ReviewRating,
      label: "Hard",
      key: "2",
      time: nextReviewTimes.hard,
      variant: "outline" as const,
      className: "border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950",
      ariaLabel: "Ocena: Trudne - pamiętam z trudem",
    },
    {
      rating: 3 as ReviewRating,
      label: "Good",
      key: "3",
      time: nextReviewTimes.good,
      variant: "default" as const,
      className: "bg-green-600 hover:bg-green-700 text-white",
      ariaLabel: "Ocena: Dobrze - pamiętam",
    },
    {
      rating: 4 as ReviewRating,
      label: "Easy",
      key: "4",
      time: nextReviewTimes.easy,
      variant: "secondary" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
      ariaLabel: "Ocena: Łatwe - pamiętam bez wysiłku",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {buttons.map((button) => (
        <Button
          key={button.rating}
          onClick={() => onRate(button.rating)}
          disabled={!isEnabled}
          variant={button.variant}
          className={`flex flex-col h-auto py-4 px-3 ${button.className || ""}`}
          aria-label={button.ariaLabel}
          aria-disabled={!isEnabled}
        >
          <span className="font-semibold text-base mb-1">
            {button.label} ({button.key})
          </span>
          <span className="text-xs opacity-80">{button.time}</span>
        </Button>
      ))}
    </div>
  );
}
