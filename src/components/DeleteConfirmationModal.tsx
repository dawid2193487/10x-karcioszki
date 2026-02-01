import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  deckName: string;
  flashcardCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  deckName,
  flashcardCount,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Usuń talię</DialogTitle>
          <DialogDescription>Czy na pewno chcesz usunąć tę talię? Ta akcja jest nieodwracalna.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nazwa talii:</span>
              <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{deckName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Liczba fiszek:</span>
              <span className="text-sm font-medium text-gray-900">{flashcardCount}</span>
            </div>
          </div>

          {flashcardCount > 0 && (
            <p className="text-sm text-amber-600 mt-4 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>Wszystkie fiszki w tej talii ({flashcardCount}) zostaną trwale usunięte.</span>
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Usuwanie..." : "Usuń talię"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
