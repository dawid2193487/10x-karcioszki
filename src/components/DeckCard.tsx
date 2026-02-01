import { useState, useRef, useEffect } from "react";
import type { DeckListItemDTO } from "@/types";
import { useAutosave } from "./hooks/useAutosave";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeckCardProps {
  deck: DeckListItemDTO;
}

export function DeckCard({ deck }: DeckCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(deck.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const originalName = useRef(deck.name);

  // Autosave hook
  const { isSaving, justSaved, error } = useAutosave(editedName, {
    delay: 500,
    onSave: async (value) => {
      if (value.trim() === originalName.current) {
        return; // No actual change
      }

      const response = await fetch(`/api/decks/${deck.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: value.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się zapisać");
      }

      originalName.current = value.trim();
    },
  });

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Revert to original if empty
    if (editedName.trim().length === 0) {
      setEditedName(originalName.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditedName(originalName.current);
      setIsEditing(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się usunąć talii");
      }

      // Success - reload page
      window.location.reload();
    } catch (err) {
      // Delete failed
      alert(err instanceof Error ? err.message : "Nie udało się usunąć talii");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleStudyClick = async () => {
    if (deck.due_count > 0) {
      try {
        // Create study session
        const response = await fetch("/api/study-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deck_id: deck.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to start study session");
        }

        const sessionData = await response.json();

        // Redirect to study session page
        window.location.href = `/study/${sessionData.id}`;
      } catch (error: any) {
        console.error("Error starting study session:", error);
        toast.error(error.message || "Nie udało się rozpocząć nauki");
      }
    }
  };

  const maxLength = 100;
  const isNameValid = editedName.trim().length > 0 && editedName.length <= maxLength;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
        {/* Deck Name - Editable */}
        <div className="mb-4">
          {isEditing ? (
            <div className="space-y-1">
              <Input
                ref={inputRef}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                className={`text-xl font-semibold ${!isNameValid ? "border-red-500" : ""}`}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={error ? "text-red-600" : "text-gray-500"}>
                  {error || (isSaving ? "Zapisywanie..." : justSaved ? "Zapisano ✓" : "")}
                </span>
                <span className={`${editedName.length >= maxLength ? "text-red-600 font-medium" : "text-gray-400"}`}>
                  {editedName.length}/{maxLength}
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNameClick}
              className="text-xl font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors w-full text-left"
              title="Kliknij aby edytować"
            >
              {editedName}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span className="font-medium">{deck.flashcard_count}</span>
            <span>fiszek</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-blue-600">{deck.due_count}</span>
            <span>do powtórki</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleStudyClick}
            disabled={deck.due_count === 0}
            className="flex-1"
            variant={deck.due_count > 0 ? "default" : "secondary"}
          >
            Ucz się
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.href = `/decks/${deck.id}`}
            title="Edytuj zestaw"
            className="hover:bg-gray-50"
          >
            ✏️
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleDeleteClick}
            title="Usuń talię"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        deckName={deck.name}
        flashcardCount={deck.flashcard_count}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </>
  );
}
