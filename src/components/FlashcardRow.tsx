import { EditableFlashcardCell } from "./EditableFlashcardCell";
import { Button } from "./ui/button";
import type { FlashcardListItemDTO } from "../types";

interface FlashcardRowProps {
  flashcard: FlashcardListItemDTO;
  onUpdate: (id: string, field: "front" | "back", value: string) => Promise<void>;
  onDelete: (id: string) => void;
}

// Desktop table row component
export function FlashcardTableRow({ flashcard, onUpdate, onDelete }: FlashcardRowProps) {
  const handleSave = async (flashcardId: string, field: string, value: string) => {
    await onUpdate(flashcardId, field as "front" | "back", value);
  };

  const handleDeleteClick = () => {
    onDelete(flashcard.id);
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-6 py-4 text-sm text-foreground">
        <EditableFlashcardCell value={flashcard.front} flashcardId={flashcard.id} field="front" onSave={handleSave} />
      </td>
      <td className="px-6 py-4 text-sm text-foreground">
        <EditableFlashcardCell value={flashcard.back} flashcardId={flashcard.id} field="back" onSave={handleSave} />
      </td>
      <td className="px-6 py-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteClick}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </td>
    </tr>
  );
}

// Mobile card component
export function FlashcardCard({ flashcard, onUpdate, onDelete }: FlashcardRowProps) {
  const handleSave = async (flashcardId: string, field: string, value: string) => {
    await onUpdate(flashcardId, field as "front" | "back", value);
  };

  const handleDeleteClick = () => {
    onDelete(flashcard.id);
  };

  return (
    <div className="bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Przód</label>
          <EditableFlashcardCell value={flashcard.front} flashcardId={flashcard.id} field="front" onSave={handleSave} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Tył</label>
          <EditableFlashcardCell value={flashcard.back} flashcardId={flashcard.id} field="back" onSave={handleSave} />
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Usuń
          </Button>
        </div>
      </div>
    </div>
  );
}
