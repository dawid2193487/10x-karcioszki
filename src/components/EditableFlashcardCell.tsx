import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

interface EditableFlashcardCellProps {
  value: string;
  flashcardId: string;
  field: "front" | "back";
  onSave: (flashcardId: string, field: string, value: string) => Promise<void>;
}

export function EditableFlashcardCell({ value, flashcardId, field, onSave }: EditableFlashcardCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with prop changes
  useEffect(() => {
    setCurrentValue(value);
    setTempValue(value);
  }, [value]);

  // Focus and select all when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();

      // Auto-resize textarea
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const validateValue = (val: string): string | null => {
    const trimmed = val.trim();
    if (trimmed.length === 0) {
      return "Pole nie może być puste";
    }
    if (trimmed.length > 1000) {
      return "Maksymalnie 1000 znaków";
    }
    return null;
  };

  const handleSave = async () => {
    const trimmed = tempValue.trim();
    const validationError = validateValue(trimmed);

    if (validationError) {
      setError(validationError);
      return;
    }

    // No changes - just exit edit mode
    if (trimmed === currentValue) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(flashcardId, field, trimmed);
      setCurrentValue(trimmed);
      setIsEditing(false);

      // Show success checkmark
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Error updating flashcard:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      // Revert to original value
      setTempValue(currentValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempValue(currentValue);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTempValue(newValue);
    setError(null);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce autosave (500ms)
    saveTimeoutRef.current = setTimeout(() => {
      if (newValue.trim() !== currentValue && !validateValue(newValue)) {
        handleSave();
      }
    }, 500);
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  return (
    <div className="relative group">
      {isEditing ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={tempValue}
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={cn(
              "w-full border-2 rounded px-3 py-2 resize-none overflow-hidden transition-colors min-h-[60px]",
              error
                ? "border-red-500 focus:border-red-600 focus:outline-none"
                : "border-blue-500 focus:border-blue-600 focus:outline-none",
              isSaving && "opacity-50 cursor-wait"
            )}
            maxLength={1000}
          />
          {isSaving && (
            <div className="absolute right-3 top-3">
              <svg
                className="animate-spin h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      ) : (
        <div className="relative">
          <div
            onClick={handleClick}
            className="cursor-pointer hover:bg-blue-50 px-3 py-2 rounded transition-colors min-h-[40px] whitespace-pre-wrap break-words"
          >
            {currentValue}
          </div>
          {showSuccess && (
            <div className="absolute -right-6 top-2">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
