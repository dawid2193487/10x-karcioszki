import { useEffect } from "react";
import type { ReviewRating } from "../../types";

interface UseKeyboardShortcutsProps {
  isAnswerRevealed: boolean;
  onReveal: () => void;
  onRate: (rating: ReviewRating) => void;
  onShowHelp: () => void;
}

export function useKeyboardShortcuts({
  isAnswerRevealed,
  onReveal,
  onRate,
  onShowHelp,
}: UseKeyboardShortcutsProps): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Handle keyboard shortcuts
      switch (event.key) {
        case " ":
        case "Spacebar":
          if (!isAnswerRevealed) {
            event.preventDefault();
            onReveal();
          }
          break;

        case "1":
          if (isAnswerRevealed) {
            event.preventDefault();
            onRate(1);
          }
          break;

        case "2":
          if (isAnswerRevealed) {
            event.preventDefault();
            onRate(2);
          }
          break;

        case "3":
          if (isAnswerRevealed) {
            event.preventDefault();
            onRate(3);
          }
          break;

        case "4":
          if (isAnswerRevealed) {
            event.preventDefault();
            onRate(4);
          }
          break;

        case "?":
          event.preventDefault();
          onShowHelp();
          break;

        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnswerRevealed, onReveal, onRate, onShowHelp]);
}
