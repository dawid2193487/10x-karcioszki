interface EstimatedCountProps {
  textLength: number;
}

export default function EstimatedCount({ textLength }: EstimatedCountProps) {
  // Formula: approximately 1 flashcard per 250 characters, minimum 1
  const estimatedCount = Math.max(1, Math.floor(textLength / 250));

  return (
    <p id="estimated-count" className="text-muted-foreground">
      Szacowana liczba fiszek: ~{estimatedCount}
    </p>
  );
}
