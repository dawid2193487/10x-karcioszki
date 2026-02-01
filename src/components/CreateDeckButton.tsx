import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateDeckButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 100;
  const isValid = name.trim().length > 0 && name.length <= maxLength;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się utworzyć talii");
      }

      // Success - reload page to show new deck
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setName("");
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center gap-2">
          <span className="text-lg">➕</span>
          <span>Nowa talia</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Utwórz nową talię</DialogTitle>
            <DialogDescription>Podaj nazwę dla swojej nowej talii fiszek</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Input
                id="deck-name"
                placeholder="np. Angielski - Poziom B2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={maxLength}
                disabled={isLoading}
                className={error ? "border-red-500" : ""}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={`${error ? "text-red-600" : "text-gray-500"}`}>{error || "Nazwa talii"}</span>
                <span className={`${name.length >= maxLength ? "text-red-600 font-medium" : "text-gray-400"}`}>
                  {name.length}/{maxLength}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? "Tworzenie..." : "Utwórz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
