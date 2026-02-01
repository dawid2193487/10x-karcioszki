import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { DeckListItemDTO, DeckListResponseDTO, CreateDeckCommand, DeckDTO } from "@/types";

interface DeckSelectorProps {
  selectedDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  onDeckCreated?: (deck: DeckDTO) => void;
  error?: string;
}

export function DeckSelector({ selectedDeckId, onDeckSelect, onDeckCreated, error }: DeckSelectorProps) {
  const [decks, setDecks] = useState<DeckListItemDTO[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  // Fetch decks on mount
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setIsLoadingDecks(true);

        const response = await fetch("/api/decks?page=1&limit=100");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać listy talii");
        }

        const data: DeckListResponseDTO = await response.json();
        setDecks(data.data);
      } catch {
        toast.error("Nie udało się pobrać listy talii");
      } finally {
        setIsLoadingDecks(false);
      }
    };

    fetchDecks();
  }, []);

  const handleDeckChange = (value: string) => {
    if (value === "__create_new__") {
      setIsCreatingNewDeck(true);
    } else {
      onDeckSelect(value);
    }
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    setIsCreatingDeck(true);

    try {
      const command: CreateDeckCommand = {
        name: newDeckName.trim(),
      };

      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się utworzyć talii");
      }

      const createdDeck: DeckDTO = await response.json();

      // Add to decks list
      setDecks((prev) => [...prev, createdDeck]);

      // Select newly created deck
      onDeckSelect(createdDeck.id);

      // Call callback
      onDeckCreated?.(createdDeck);

      // Return to selection mode
      setIsCreatingNewDeck(false);
      setNewDeckName("");

      toast.success("Talia została utworzona!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się utworzyć talii");
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingNewDeck(false);
    setNewDeckName("");
  };

  if (isLoadingDecks) {
    return (
      <div className="space-y-2">
        <Label htmlFor="deck-select">Dodaj do talii</Label>
        <div className="h-9 animate-pulse rounded-md bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="deck-select">Dodaj do talii</Label>

      {!isCreatingNewDeck ? (
        <>
          <Select value={selectedDeckId || ""} onValueChange={handleDeckChange}>
            <SelectTrigger id="deck-select" className="w-full">
              <SelectValue placeholder="Wybierz talię..." />
            </SelectTrigger>
            <SelectContent>
              {decks.map((deck) => (
                <SelectItem key={deck.id} value={deck.id}>
                  {deck.name} ({deck.flashcard_count} {deck.flashcard_count === 1 ? "fiszka" : "fiszek"})
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="__create_new__">➕ Utwórz nową talię</SelectItem>
            </SelectContent>
          </Select>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </>
      ) : (
        <div className="space-y-2">
          <Input
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="Nazwa nowej talii..."
            maxLength={100}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateDeck} disabled={!newDeckName.trim() || isCreatingDeck}>
              {isCreatingDeck ? "Tworzenie..." : "Utwórz"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelCreate} disabled={isCreatingDeck}>
              Anuluj
            </Button>
          </div>
          <span className="text-xs text-gray-500">{newDeckName.length}/100</span>
        </div>
      )}
    </div>
  );
}
