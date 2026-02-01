interface CharacterCounterProps {
  current: number;
  max: number;
  min: number;
}

export default function CharacterCounter({ current, max, min }: CharacterCounterProps) {
  // Determine color based on validation state
  const getColorClass = () => {
    if (current < min) {
      return "text-destructive";
    }
    if (current > max) {
      return "text-destructive";
    }
    return "text-green-600 dark:text-green-500";
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("pl-PL");
  };

  return (
    <div
      id="char-counter"
      className={`${getColorClass()} font-medium`}
      aria-live="polite"
      aria-atomic="true"
    >
      {formatNumber(current)} / {formatNumber(max)} znaków
    </div>
  );
}
