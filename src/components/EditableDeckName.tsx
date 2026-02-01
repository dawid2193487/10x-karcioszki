import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

interface EditableDeckNameProps {
  deckId: string;
  initialName: string;
  onUpdate: (newName: string) => void;
}

export function EditableDeckName({ deckId, initialName, onUpdate }: EditableDeckNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [tempName, setTempName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setName(initialName);
    setTempName(initialName);
  }, [initialName]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Nazwa talii nie może być pusta";
    }
    if (trimmed.length > 100) {
      return "Nazwa talii nie może przekraczać 100 znaków";
    }
    return null;
  };

  const handleSave = async () => {
    const trimmed = tempName.trim();
    const validationError = validateName(trimmed);

    if (validationError) {
      setError(validationError);
      return;
    }

    // No changes - just exit edit mode
    if (trimmed === name) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Błąd podczas aktualizacji");
      }

      const updatedDeck = await response.json();
      setName(trimmed);
      setIsEditing(false);
      onUpdate(trimmed);

      // Show success checkmark
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Error updating deck name:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      // Revert to original value
      setTempName(name);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempName(name);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  return (
    <div className="relative">
      {isEditing ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={cn(
              "text-3xl font-bold border-2 rounded-lg px-3 py-1 w-full max-w-2xl transition-colors",
              error
                ? "border-red-500 focus:border-red-600 focus:outline-none"
                : "border-blue-500 focus:border-blue-600 focus:outline-none",
              isSaving && "opacity-50 cursor-wait"
            )}
            maxLength={100}
          />
          {isSaving && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
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
        </div>
      ) : (
        <div className="relative inline-block">
          <h1
            onClick={handleClick}
            className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
          >
            {name}
          </h1>
          {showSuccess && (
            <div className="absolute -right-8 top-1/2 -translate-y-1/2">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-1 px-3">{error}</p>}
    </div>
  );
}
