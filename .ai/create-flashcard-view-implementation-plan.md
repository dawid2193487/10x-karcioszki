# Plan implementacji widoku Tworzenia fiszki manualnie

## 1. Przegląd

Widok Tworzenia fiszki manualnie to modalowy formularz umożliwiający użytkownikowi szybkie dodanie pojedynczej fiszki do wybranej talii. Formularz zawiera pola na przód (pytanie) i tył (odpowiedź) fiszki oraz mechanizm wyboru talii z możliwością utworzenia nowej talii bezpośrednio z poziomu formularza. Widok implementuje optymistyczne aktualizacje, pełną walidację po stronie klienta oraz obsługę błędów z API.

Komponent będzie dostępny zarówno z poziomu dashboardu (lista talii), jak i z widoku pojedynczej talii, umożliwiając szybkie dodawanie fiszek w różnych kontekstach aplikacji.

## 2. Routing widoku

Widok jest modalem, więc nie posiada dedykowanej ścieżki URL. Będzie dostępny poprzez:

- **Dashboard (główny widok talii)**: Przycisk "Dodaj fiszkę" w głównym widoku
- **Widok pojedynczej talii**: Przycisk "Dodaj fiszkę" w widoku szczegółów talii

Modal będzie renderowany jako komponent React wbudowany w strukturę stron Astro:
- `src/pages/index.astro` (dashboard)
- Przyszłe strony widoku talii (np. `src/pages/decks/[id].astro`)

## 3. Struktura komponentów

```
CreateFlashcardButton.tsx (główny komponent)
├── Dialog (Shadcn/ui - wrapper modalu)
│   ├── DialogTrigger (przycisk otwierający modal)
│   └── DialogContent (zawartość modalu)
│       ├── DialogHeader
│       │   ├── DialogTitle
│       │   └── DialogDescription
│       ├── Form (formularz tworzenia)
│       │   ├── Textarea (front - pytanie)
│       │   ├── Textarea (back - odpowiedź)
│       │   └── DeckSelector (wybór talii)
│       │       ├── Select (Shadcn/ui dropdown)
│       │       └── CreateDeckInline (opcjonalny inline form)
│       └── DialogFooter
│           ├── Button (Anuluj)
│           └── Button (Dodaj fiszkę)
└── Toast/Notification (komunikaty o sukcesie/błędzie)
```

### Komponenty do stworzenia:
1. **CreateFlashcardButton.tsx** - główny komponent z modalem
2. **DeckSelector.tsx** - reusable komponent do wyboru/tworzenia talii

### Komponenty istniejące (Shadcn/ui):
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
- Button
- Input
- Label

### Komponenty do dodania (Shadcn/ui):
- **Textarea** - brakujący komponent, należy dodać z Shadcn/ui
- **Select** - komponent dropdown do wyboru talii (lub wykorzystać DropdownMenu)

## 4. Szczegóły komponentów

### CreateFlashcardButton.tsx

**Opis komponentu:**
Główny komponent odpowiedzialny za wyświetlanie przycisku "Dodaj fiszkę" oraz modalowego formularza tworzenia fiszki. Zarządza całym stanem formularza, walidacją, interakcją z API oraz obsługą błędów.

**Główne elementy:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>➕ Dodaj fiszkę</Button>
  </DialogTrigger>
  
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dodaj nową fiszkę</DialogTitle>
      <DialogDescription>Utwórz nową fiszkę...</DialogDescription>
    </DialogHeader>
    
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Pole Front (pytanie) */}
        <div>
          <Label htmlFor="front">Przód (pytanie)</Label>
          <Textarea
            id="front"
            value={front}
            onChange={handleFrontChange}
            placeholder="Wpisz pytanie..."
            maxLength={1000}
            rows={3}
          />
          <div className="text-xs">
            <span>{front.length}/1000</span>
            {frontError && <span className="text-red-600">{frontError}</span>}
          </div>
        </div>
        
        {/* Pole Back (odpowiedź) */}
        <div>
          <Label htmlFor="back">Tył (odpowiedź)</Label>
          <Textarea
            id="back"
            value={back}
            onChange={handleBackChange}
            placeholder="Wpisz odpowiedź..."
            maxLength={1000}
            rows={3}
          />
          <div className="text-xs">
            <span>{back.length}/1000</span>
            {backError && <span className="text-red-600">{backError}</span>}
          </div>
        </div>
        
        {/* Wybór talii */}
        <DeckSelector
          selectedDeckId={selectedDeckId}
          onDeckSelect={setSelectedDeckId}
          onDeckCreated={handleDeckCreated}
        />
      </div>
    </form>
    
    <DialogFooter>
      <Button variant="outline" onClick={handleCancel}>Anuluj</Button>
      <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
        {isSubmitting ? "Dodawanie..." : "Dodaj fiszkę"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Obsługiwane interakcje:**
- Kliknięcie przycisku "Dodaj fiszkę" - otwiera modal
- Wprowadzanie tekstu w textarea Front - aktualizuje stan, waliduje na bieżąco
- Wprowadzanie tekstu w textarea Back - aktualizuje stan, waliduje na bieżąco
- Enter w textarea - wstawia nową linię (nie submituje formularza)
- Ctrl+Enter (Cmd+Enter na Mac) - submituje formularz
- Esc - zamyka modal
- Wybór talii z dropdown - aktualizuje selectedDeckId
- Kliknięcie "Utwórz nową talię" - przełącza na inline creation mode
- Kliknięcie "Anuluj" - zamyka modal, resetuje formularz
- Kliknięcie "Dodaj fiszkę" - waliduje i wysyła do API
- Focus trap - Tab/Shift+Tab porusza się tylko w obrębie modalu

**Obsługiwana walidacja:**
- **Front (pytanie)**:
  - Wymagane pole (min 1 znak)
  - Maksymalnie 1000 znaków
  - Wyświetlanie błędu: "Pytanie jest wymagane" gdy puste
  - Wyświetlanie błędu: "Pytanie jest za długie" gdy > 1000 znaków
  - Real-time feedback podczas wpisywania
  
- **Back (odpowiedź)**:
  - Wymagane pole (min 1 znak)
  - Maksymalnie 1000 znaków
  - Wyświetlanie błędu: "Odpowiedź jest wymagana" gdy puste
  - Wyświetlanie błędu: "Odpowiedź jest za długa" gdy > 1000 znaków
  - Real-time feedback podczas wpisywania
  
- **Deck (talia)**:
  - Wymagane pole
  - Musi być wybrana istniejąca talia lub utworzona nowa
  - Wyświetlanie błędu: "Wybierz talię" gdy nie wybrano
  
- **Walidacja formularza**:
  - Przycisk "Dodaj fiszkę" disabled gdy:
    - Front jest pusty lub > 1000 znaków
    - Back jest pusty lub > 1000 znaków
    - Nie wybrano talii
    - Formularz jest w trakcie wysyłania (isSubmitting)

**Typy:**
```typescript
// Lokalne typy komponentu
interface CreateFlashcardButtonProps {
  preselectedDeckId?: string; // Opcjonalnie pre-wybrана talia (z widoku talii)
  onFlashcardCreated?: (flashcard: FlashcardDTO) => void; // Callback po utworzeniu
}

// Importowane z types.ts
import type { CreateFlashcardCommand, FlashcardDTO } from "@/types";
```

**Propsy:**
```typescript
interface CreateFlashcardButtonProps {
  preselectedDeckId?: string;        // UUID talii pre-wybranej (opcjonalne)
  onFlashcardCreated?: (flashcard: FlashcardDTO) => void; // Callback po sukcesie
}
```

### DeckSelector.tsx

**Opis komponentu:**
Reusable komponent do wyboru talii z dropdown z możliwością inline creation nowej talii. Komponent jest używany zarówno w CreateFlashcardButton jak i w przyszłym AI Generation flow.

**Główne elementy:**
```tsx
<div className="space-y-2">
  <Label htmlFor="deck-select">Dodaj do talii</Label>
  
  {!isCreatingNewDeck ? (
    <>
      <Select value={selectedDeckId} onValueChange={handleDeckChange}>
        <SelectTrigger>
          <SelectValue placeholder="Wybierz talię..." />
        </SelectTrigger>
        <SelectContent>
          {decks.map(deck => (
            <SelectItem key={deck.id} value={deck.id}>
              {deck.name} ({deck.flashcard_count} fiszek)
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value="__create_new__">
            ➕ Utwórz nową talię
          </SelectItem>
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
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleCreateDeck} disabled={!newDeckName.trim()}>
          Utwórz
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancelCreate}>
          Anuluj
        </Button>
      </div>
      <span className="text-xs text-gray-500">{newDeckName.length}/100</span>
    </div>
  )}
</div>
```

**Obsługiwane interakcje:**
- Kliknięcie dropdown - rozwija listę talii
- Wybór talii z listy - aktualizuje selectedDeckId, wywołuje onDeckSelect
- Kliknięcie "Utwórz nową talię" - przełącza w tryb inline creation
- Wpisywanie nazwy nowej talii - aktualizuje newDeckName
- Kliknięcie "Utwórz" - wywołuje API POST /api/decks, dodaje do listy, wywołuje onDeckCreated
- Kliknięcie "Anuluj" - wraca do dropdown selection mode
- Autofocus na input po przełączeniu w tryb creation

**Obsługiwana walidacja:**
- **Dropdown selection**:
  - Wymagany wybór (nie może być puste)
  - Wyświetlanie błędu: "Wybierz talię" gdy selectedDeckId === null
  
- **Inline deck creation**:
  - Nazwa talii: min 1 znak, max 100 znaków
  - Przycisk "Utwórz" disabled gdy newDeckName.trim() === ""
  - Real-time licznik znaków
  
**Typy:**
```typescript
interface DeckSelectorProps {
  selectedDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  onDeckCreated?: (deck: DeckDTO) => void;
  error?: string;
}

// Importowane z types.ts
import type { DeckListItemDTO, CreateDeckCommand, DeckDTO } from "@/types";
```

**Propsy:**
```typescript
interface DeckSelectorProps {
  selectedDeckId: string | null;                    // Aktualnie wybrana talia
  onDeckSelect: (deckId: string) => void;           // Callback przy wyborze talii
  onDeckCreated?: (deck: DeckDTO) => void;          // Callback po utworzeniu nowej talii
  error?: string;                                    // Błąd walidacji do wyświetlenia
}
```

### Textarea (Shadcn/ui)

**Opis komponentu:**
Komponent textarea z Shadcn/ui do wprowadzania dłuższego tekstu. Należy dodać do projektu, ponieważ obecnie go brakuje.

**Główne elementy:**
Standardowy komponent Shadcn/ui textarea z auto-resize support (opcjonalnie).

**Obsługiwane interakcje:**
- Wprowadzanie tekstu
- Enter - nowa linia
- Auto-resize (opcjonalnie - rozszerzanie wysokości podczas wpisywania)

**Obsługiwana walidacja:**
- Obsługuje atrybut maxLength
- Obsługuje disabled state

**Typy:**
```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}
```

**Propsy:**
Standardowe propsy textarea HTML + className.

## 5. Typy

### Typy istniejące w projekcie (src/types.ts):

```typescript
// DTO dla fiszki (odpowiedź z API)
export interface FlashcardDTO {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source: FlashcardSource;
  next_review_date: string | null;
  easiness_factor: number | null;
  interval: number | null;
  repetitions: number | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Command do tworzenia fiszki (request do API)
export interface CreateFlashcardCommand {
  deck_id: string;
  front: string;
  back: string;
  source: FlashcardSource; // "ai" | "manual"
}

// Źródło fiszki
export type FlashcardSource = "ai" | "manual";

// DTO dla listy talii
export interface DeckListItemDTO {
  id: string;
  name: string;
  flashcard_count: number;
  due_count: number;
  created_at: string;
  updated_at: string;
}

// Command do tworzenia talii (inline creation)
export interface CreateDeckCommand {
  name: string;
}

// DTO dla talii (odpowiedź z API)
export type DeckDTO = DeckDetailDTO;
```

### Nowe typy dla widoku (definiowane lokalnie w komponentach):

```typescript
// CreateFlashcardButton.tsx
interface CreateFlashcardButtonProps {
  preselectedDeckId?: string;                         // UUID pre-wybranej talii (opcjonalne)
  onFlashcardCreated?: (flashcard: FlashcardDTO) => void; // Callback po utworzeniu fiszki
}

// ViewModel dla stanu formularza
interface FlashcardFormState {
  front: string;                // Wartość pola front
  back: string;                 // Wartość pola back
  selectedDeckId: string | null; // ID wybranej talii
  frontError: string | null;    // Błąd walidacji front
  backError: string | null;     // Błąd walidacji back
  deckError: string | null;     // Błąd walidacji deck
  isSubmitting: boolean;        // Czy formularz jest w trakcie wysyłania
  isOpen: boolean;              // Czy modal jest otwarty
}

// DeckSelector.tsx
interface DeckSelectorProps {
  selectedDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  onDeckCreated?: (deck: DeckDTO) => void;
  error?: string;
}

// ViewModel dla stanu DeckSelector
interface DeckSelectorState {
  decks: DeckListItemDTO[];      // Lista dostępnych talii
  isLoadingDecks: boolean;       // Czy trwa ładowanie listy talii
  isCreatingNewDeck: boolean;    // Czy w trybie inline creation
  newDeckName: string;           // Nazwa nowej talii
  isCreatingDeck: boolean;       // Czy trwa tworzenie nowej talii
}
```

### Typy błędów API:

```typescript
// Struktura odpowiedzi błędu z API (już istniejąca w projekcie)
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}
```

## 6. Zarządzanie stanem

### Stan w CreateFlashcardButton.tsx:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [front, setFront] = useState("");
const [back, setBack] = useState("");
const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
const [frontError, setFrontError] = useState<string | null>(null);
const [backError, setBackError] = useState<string | null>(null);
const [deckError, setDeckError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [generalError, setGeneralError] = useState<string | null>(null);
```

**Inicjalizacja stanu:**
- Przy otwarciu modalu: wszystkie pola puste
- Gdy preselectedDeckId podane: selectedDeckId = preselectedDeckId
- Gdy modal zamykany: reset wszystkich pól do wartości domyślnych

**Walidacja w czasie rzeczywistym:**
```typescript
const validateFront = (value: string): string | null => {
  if (value.trim().length === 0) return "Pytanie jest wymagane";
  if (value.length > 1000) return "Pytanie jest za długie (max 1000 znaków)";
  return null;
};

const validateBack = (value: string): string | null => {
  if (value.trim().length === 0) return "Odpowiedź jest wymagana";
  if (value.length > 1000) return "Odpowiedź jest za długa (max 1000 znaków)";
  return null;
};

const validateDeck = (deckId: string | null): string | null => {
  if (!deckId) return "Wybierz talię";
  return null;
};

const isFormValid = useMemo(() => {
  return (
    front.trim().length > 0 &&
    front.length <= 1000 &&
    back.trim().length > 0 &&
    back.length <= 1000 &&
    selectedDeckId !== null
  );
}, [front, back, selectedDeckId]);
```

### Stan w DeckSelector.tsx:

```typescript
const [decks, setDecks] = useState<DeckListItemDTO[]>([]);
const [isLoadingDecks, setIsLoadingDecks] = useState(true);
const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
const [newDeckName, setNewDeckName] = useState("");
const [isCreatingDeck, setIsCreatingDeck] = useState(false);
```

**Ładowanie listy talii:**
- useEffect przy montowaniu komponentu: fetchDecks()
- fetchDecks() wywołuje GET /api/decks?limit=100
- Aktualizuje setDecks() i setIsLoadingDecks(false)

**Tworzenie nowej talii:**
- handleCreateDeck() wywołuje POST /api/decks
- Po sukcesie: dodaje nową talię do listy, wywołuje onDeckCreated(), przełącza tryb
- Po błędzie: wyświetla toast z błędem

### Nie jest wymagany custom hook

Stan jest zarządzany lokalnie w komponentach za pomocą useState i useMemo. Nie ma potrzeby tworzenia dedykowanego custom hooka, ponieważ:
- Logika jest prosta i specyficzna dla każdego komponentu
- Nie ma skomplikowanych interakcji między wieloma stanami
- Nie ma potrzeby reużywania tej logiki w innych miejscach aplikacji

W przyszłości, jeśli formularz będzie używany w wielu miejscach z podobną logiką, można rozważyć ekstrakcję do `useFlashcardForm()` custom hooka.

## 7. Integracja API

### Endpoint tworzenia fiszki:

**POST /api/flashcards**

**Request:**
```typescript
// Typ: CreateFlashcardCommand
{
  deck_id: string;     // UUID talii (wymagane)
  front: string;       // Pytanie, 1-1000 znaków (wymagane)
  back: string;        // Odpowiedź, 1-1000 znaków (wymagane)
  source: "manual";    // Zawsze "manual" dla tego widoku
}
```

**Response (201 Created):**
```typescript
// Typ: FlashcardDTO
{
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source: "manual";
  next_review_date: string | null;
  easiness_factor: number | null;
  interval: number | null;
  repetitions: number | null;
  last_reviewed_at: null;
  created_at: string;
  updated_at: string;
}
```

**Error Responses:**
- **400 Bad Request** - Walidacja nie powiodła się
- **401 Unauthorized** - Brak lub nieprawidłowy token
- **404 Not Found** - Talia nie istnieje lub nie należy do użytkownika

**Implementacja w komponencie:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Walidacja przed wysłaniem
  const frontErr = validateFront(front);
  const backErr = validateBack(back);
  const deckErr = validateDeck(selectedDeckId);
  
  if (frontErr || backErr || deckErr) {
    setFrontError(frontErr);
    setBackError(backErr);
    setDeckError(deckErr);
    return;
  }
  
  setIsSubmitting(true);
  setGeneralError(null);
  
  try {
    const command: CreateFlashcardCommand = {
      deck_id: selectedDeckId!,
      front: front.trim(),
      back: back.trim(),
      source: "manual",
    };
    
    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    
    if (!response.ok) {
      const errorData: ErrorResponseDTO = await response.json();
      throw new Error(errorData.error.message);
    }
    
    const createdFlashcard: FlashcardDTO = await response.json();
    
    // Sukces
    onFlashcardCreated?.(createdFlashcard);
    
    // Wyświetl toast sukcesu
    toast.success("Fiszka została dodana!");
    
    // Zamknij modal i zresetuj formularz
    setIsOpen(false);
    resetForm();
    
    // Odśwież stronę (lub zaktualizuj lokalny stan)
    window.location.reload();
    
  } catch (error) {
    setGeneralError(error instanceof Error ? error.message : "Nie udało się dodać fiszki");
    toast.error("Nie udało się dodać fiszki. Spróbuj ponownie.");
  } finally {
    setIsSubmitting(false);
  }
};
```

### Endpoint pobierania listy talii (dla DeckSelector):

**GET /api/decks?limit=100**

**Response (200 OK):**
```typescript
// Typ: DeckListResponseDTO
{
  data: DeckListItemDTO[];
  pagination: {
    page: 1;
    limit: 100;
    total: number;
    total_pages: number;
  };
}
```

**Implementacja w DeckSelector:**
```typescript
useEffect(() => {
  const fetchDecks = async () => {
    try {
      setIsLoadingDecks(true);
      
      const response = await fetch("/api/decks?limit=100");
      
      if (!response.ok) {
        throw new Error("Nie udało się pobrać listy talii");
      }
      
      const data: DeckListResponseDTO = await response.json();
      setDecks(data.data);
      
    } catch (error) {
      console.error("Error fetching decks:", error);
      toast.error("Nie udało się pobrać listy talii");
    } finally {
      setIsLoadingDecks(false);
    }
  };
  
  fetchDecks();
}, []);
```

### Endpoint tworzenia talii (inline creation w DeckSelector):

**POST /api/decks**

**Request:**
```typescript
// Typ: CreateDeckCommand
{
  name: string; // 1-100 znaków
}
```

**Response (201 Created):**
```typescript
// Typ: DeckDTO
{
  id: string;
  name: string;
  flashcard_count: 0;
  due_count: 0;
  new_count: 0;
  created_at: string;
  updated_at: string;
}
```

**Implementacja w DeckSelector:**
```typescript
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
      const errorData: ErrorResponseDTO = await response.json();
      throw new Error(errorData.error.message);
    }
    
    const createdDeck: DeckDTO = await response.json();
    
    // Dodaj do listy talii
    setDecks(prev => [...prev, createdDeck]);
    
    // Wybierz nowo utworzoną talię
    onDeckSelect(createdDeck.id);
    
    // Wywołaj callback
    onDeckCreated?.(createdDeck);
    
    // Wróć do selection mode
    setIsCreatingNewDeck(false);
    setNewDeckName("");
    
    toast.success("Talia została utworzona!");
    
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Nie udało się utworzyć talii");
  } finally {
    setIsCreatingDeck(false);
  }
};
```

## 8. Interakcje użytkownika

### Przepływ podstawowy (happy path):

1. **Użytkownik klika przycisk "Dodaj fiszkę"**
   - Modal się otwiera
   - Focus automatycznie na textarea Front
   - Wszystkie pola puste (lub pre-wybrana talia jeśli podano)

2. **Użytkownik wpisuje pytanie w pole Front**
   - Real-time licznik znaków: "0/1000" → "15/1000"
   - Walidacja na bieżąco (brak błędu jeśli 1-1000 znaków)
   - Enter wstawia nową linię

3. **Użytkownik wpisuje odpowiedź w pole Back**
   - Real-time licznik znaków: "0/1000" → "20/1000"
   - Walidacja na bieżąco (brak błędu jeśli 1-1000 znaków)
   - Enter wstawia nową linię

4. **Użytkownik wybiera talię z dropdown**
   - Kliknięcie dropdown → lista talii się rozwija
   - Każda talia pokazuje: "Nazwa talii (X fiszek)"
   - Użytkownik klika na talię → dropdown się zamyka, talia wybrana
   - selectedDeckId zostaje zaktualizowany

5. **Użytkownik klika "Dodaj fiszkę"** (lub Ctrl+Enter)
   - Przycisk disabled jeśli formularz nieprawidłowy
   - Walidacja finalna przed wysłaniem
   - Loading state: przycisk zmienia tekst na "Dodawanie..."
   - Request do POST /api/flashcards

6. **API zwraca sukces (201)**
   - Toast: "Fiszka została dodana!"
   - Modal zamyka się automatycznie
   - Formularz resetuje się
   - Strona odświeża się (window.location.reload()) lub lokalny stan aktualizuje
   - Użytkownik widzi nową fiszkę w liście

### Przepływ alternatywny - tworzenie nowej talii:

1. **Użytkownik klika dropdown talii**
   - Lista talii się rozwija

2. **Użytkownik klika "➕ Utwórz nową talię"**
   - Dropdown zamyka się
   - Pojawia się inline form z inputem
   - Autofocus na input
   - Placeholder: "Nazwa nowej talii..."

3. **Użytkownik wpisuje nazwę talii**
   - Real-time licznik znaków: "0/100" → "15/100"
   - Przycisk "Utwórz" disabled jeśli pole puste

4. **Użytkownik klika "Utwórz"**
   - Loading state
   - Request do POST /api/decks
   - API zwraca nową talię
   - Talia dodana do listy
   - Talia automatycznie wybrana (selectedDeckId)
   - Powrót do selection mode
   - Toast: "Talia została utworzona!"

5. **Użytkownik kontynuuje wypełnianie fiszki**
   - Front i Back już wypełnione
   - Talia już wybrana
   - Może kliknąć "Dodaj fiszkę"

### Interakcje klawiaturowe:

- **Tab** - poruszanie się między polami (Front → Back → Deck selector → Anuluj → Dodaj fiszkę)
- **Shift+Tab** - poruszanie się w odwrotnym kierunku
- **Enter w textarea** - nowa linia (nie submit)
- **Ctrl+Enter** (Cmd+Enter na Mac) - submit formularza
- **Esc** - zamknięcie modalu
- **Space/Enter na przycisku** - kliknięcie przycisku
- **Focus trap** - Tab nie wychodzi poza modal

### Interakcje z błędami:

1. **Użytkownik próbuje submitować pusty formularz**
   - Przycisk "Dodaj fiszkę" jest disabled
   - Kliknięcie nie robi nic

2. **Użytkownik wpisuje tekst > 1000 znaków**
   - Real-time error: "Pytanie jest za długie (max 1000 znaków)"
   - Licznik znaków czerwony: "1050/1000"
   - Przycisk "Dodaj fiszkę" disabled

3. **Błąd API (400, 404, 500)**
   - Toast error: "Nie udało się dodać fiszki. Spróbuj ponownie."
   - Modal pozostaje otwarty
   - Dane w formularzu zachowane
   - Użytkownik może poprawić i spróbować ponownie

4. **Użytkownik klika Anuluj**
   - Modal zamyka się
   - Wszystkie dane tracone
   - Brak zapisu do API

## 9. Warunki i walidacja

### Walidacja Front (pytanie):

**Miejsce weryfikacji:** CreateFlashcardButton.tsx

**Warunki:**
1. **Wymagane pole**: `front.trim().length > 0`
   - Błąd: "Pytanie jest wymagane"
   - Wpływ na UI: Disabled przycisk "Dodaj fiszkę", czerwony border na textarea (opcjonalnie)

2. **Maksymalna długość**: `front.length <= 1000`
   - Błąd: "Pytanie jest za długie (max 1000 znaków)"
   - Wpływ na UI: Disabled przycisk, czerwony licznik znaków, komunikat błędu

**Moment walidacji:**
- Real-time podczas wpisywania (onChange)
- Przed wysłaniem formularza (onSubmit)

**Implementacja:**
```typescript
const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setFront(value);
  setFrontError(validateFront(value));
};

const validateFront = (value: string): string | null => {
  if (value.trim().length === 0) return "Pytanie jest wymagane";
  if (value.length > 1000) return "Pytanie jest za długie (max 1000 znaków)";
  return null;
};
```

### Walidacja Back (odpowiedź):

**Miejsce weryfikacji:** CreateFlashcardButton.tsx

**Warunki:**
1. **Wymagane pole**: `back.trim().length > 0`
   - Błąd: "Odpowiedź jest wymagana"
   - Wpływ na UI: Disabled przycisk "Dodaj fiszkę"

2. **Maksymalna długość**: `back.length <= 1000`
   - Błąd: "Odpowiedź jest za długa (max 1000 znaków)"
   - Wpływ na UI: Disabled przycisk, czerwony licznik znaków, komunikat błędu

**Moment walidacji:**
- Real-time podczas wpisywania (onChange)
- Przed wysłaniem formularza (onSubmit)

**Implementacja:**
```typescript
const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setBack(value);
  setBackError(validateBack(value));
};

const validateBack = (value: string): string | null => {
  if (value.trim().length === 0) return "Odpowiedź jest wymagana";
  if (value.length > 1000) return "Odpowiedź jest za długa (max 1000 znaków)";
  return null;
};
```

### Walidacja Deck (talia):

**Miejsce weryfikacji:** CreateFlashcardButton.tsx

**Warunki:**
1. **Wymagany wybór**: `selectedDeckId !== null`
   - Błąd: "Wybierz talię"
   - Wpływ na UI: Disabled przycisk "Dodaj fiszkę"

2. **Talia musi istnieć**: Sprawdzane przez API (404 jeśli nie)
   - Błąd API: "Deck not found or does not belong to user"
   - Wpływ na UI: Toast error

**Moment walidacji:**
- Przed wysłaniem formularza (onSubmit)
- Po wyborze talii (onChange dropdown)

**Implementacja:**
```typescript
const handleDeckSelect = (deckId: string) => {
  setSelectedDeckId(deckId);
  setDeckError(validateDeck(deckId));
};

const validateDeck = (deckId: string | null): string | null => {
  if (!deckId) return "Wybierz talię";
  return null;
};
```

### Walidacja całego formularza:

**Miejsce weryfikacji:** CreateFlashcardButton.tsx

**Warunki:**
```typescript
const isFormValid = useMemo(() => {
  return (
    front.trim().length > 0 &&
    front.length <= 1000 &&
    back.trim().length > 0 &&
    back.length <= 1000 &&
    selectedDeckId !== null
  );
}, [front, back, selectedDeckId]);
```

**Wpływ na UI:**
```tsx
<Button 
  onClick={handleSubmit} 
  disabled={!isFormValid || isSubmitting}
>
  {isSubmitting ? "Dodawanie..." : "Dodaj fiszkę"}
</Button>
```

### Walidacja inline deck creation (DeckSelector):

**Miejsce weryfikacji:** DeckSelector.tsx

**Warunki:**
1. **Nazwa talii wymagana**: `newDeckName.trim().length > 0`
   - Wpływ na UI: Disabled przycisk "Utwórz"

2. **Maksymalna długość**: `newDeckName.length <= 100`
   - Wpływ na UI: maxLength na input (hard limit)

**Implementacja:**
```typescript
<Button 
  size="sm" 
  onClick={handleCreateDeck} 
  disabled={!newDeckName.trim() || isCreatingDeck}
>
  {isCreatingDeck ? "Tworzenie..." : "Utwórz"}
</Button>
```

## 10. Obsługa błędów

### Błędy walidacji (400 Bad Request):

**Scenariusz:** API zwraca błąd walidacji (np. front jest za długi, deck_id nieprawidłowy UUID)

**Struktura błędu:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "String must contain at most 1000 character(s)"
      }
    ]
  }
}
```

**Obsługa:**
```typescript
if (!response.ok) {
  const errorData: ErrorResponseDTO = await response.json();
  
  if (errorData.error.code === "VALIDATION_ERROR" && errorData.error.details) {
    // Mapowanie błędów na odpowiednie pola
    errorData.error.details.forEach(detail => {
      if (detail.field === "front") setFrontError(detail.message);
      if (detail.field === "back") setBackError(detail.message);
      if (detail.field === "deck_id") setDeckError(detail.message);
    });
  } else {
    // Ogólny błąd
    setGeneralError(errorData.error.message);
  }
  
  toast.error("Popraw błędy w formularzu");
  return;
}
```

### Błąd autoryzacji (401 Unauthorized):

**Scenariusz:** Użytkownik niezalogowany lub sesja wygasła

**Obsługa:**
```typescript
if (response.status === 401) {
  toast.error("Sesja wygasła. Zaloguj się ponownie.");
  // Przekierowanie na stronę logowania
  window.location.href = "/login";
  return;
}
```

### Błąd nie znaleziono talii (404 Not Found):

**Scenariusz:** Wybrana talia nie istnieje lub nie należy do użytkownika

**Obsługa:**
```typescript
if (response.status === 404) {
  toast.error("Wybrana talia nie istnieje. Odśwież stronę.");
  setDeckError("Talia nie istnieje");
  // Opcjonalnie: odśwież listę talii
  return;
}
```

### Błąd serwera (500 Internal Server Error):

**Scenariusz:** Nieoczekiwany błąd po stronie serwera

**Obsługa:**
```typescript
if (response.status >= 500) {
  toast.error("Wystąpił błąd serwera. Spróbuj ponownie później.");
  setGeneralError("Błąd serwera");
  return;
}
```

### Błąd sieci (Network Error):

**Scenariusz:** Brak połączenia z internetem, timeout

**Obsługa:**
```typescript
try {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    toast.error("Brak połączenia z internetem. Sprawdź swoje połączenie.");
  } else {
    toast.error("Nie udało się dodać fiszki. Spróbuj ponownie.");
  }
  setGeneralError("Błąd sieci");
}
```

### Edge case: Bardzo długi tekst mimo maxLength:

**Scenariusz:** Użytkownik wkleja tekst > 1000 znaków (maxLength na textarea może nie zadziałać przy paste)

**Obsługa:**
```typescript
const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  let value = e.target.value;
  
  // Hard limit przy paste
  if (value.length > 1000) {
    value = value.substring(0, 1000);
    toast.warning("Tekst został skrócony do 1000 znaków");
  }
  
  setFront(value);
  setFrontError(validateFront(value));
};
```

### Edge case: Modal zamknięty podczas submitu:

**Scenariusz:** Użytkownik klika Esc podczas wysyłania formularza

**Obsługa:**
```typescript
const handleOpenChange = (open: boolean) => {
  // Zapobiegaj zamknięciu podczas submitu
  if (!open && isSubmitting) {
    toast.info("Poczekaj, trwa dodawanie fiszki...");
    return;
  }
  
  setIsOpen(open);
  if (!open) {
    resetForm();
  }
};
```

### Edge case: Duplikat fiszki:

**Scenariusz:** Użytkownik tworzy fiszkę z tym samym front/back co istniejąca

**Obsługa:**
Nie ma walidacji po stronie API na duplikaty. Jeśli to wymagane:
- Dodać walidację do API
- Obsłużyć błąd 409 Conflict
- Wyświetlić komunikat: "Taka fiszka już istnieje w tej talii"

### Strategia retry:

Dla błędów przejściowych (500, timeout):
```typescript
const MAX_RETRIES = 2;
let retries = 0;

const submitWithRetry = async () => {
  try {
    // ... request
  } catch (error) {
    if (retries < MAX_RETRIES && shouldRetry(error)) {
      retries++;
      toast.info(`Ponawiam próbę... (${retries}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      return submitWithRetry();
    }
    // Handle error
  }
};
```

## 11. Kroki implementacji

### Krok 1: Dodanie brakującego komponentu Textarea

**Akcja:** Dodaj komponent Textarea z Shadcn/ui do projektu

**Plik:** `src/components/ui/textarea.tsx`

**Kod:**
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
```

### Krok 2: Dodanie komponentu Select (jeśli nie istnieje)

**Akcja:** Sprawdź czy Select istnieje w `src/components/ui/select.tsx`. Jeśli nie, dodaj z Shadcn/ui.

**Alternatywa:** Wykorzystaj istniejący DropdownMenu jako Select (mniej preferowane, ale możliwe)

### Krok 3: Utworzenie komponentu DeckSelector

**Akcja:** Stwórz reusable komponent do wyboru/tworzenia talii

**Plik:** `src/components/DeckSelector.tsx`

**Struktura:**
```tsx
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DeckListItemDTO, CreateDeckCommand, DeckDTO } from "@/types";

interface DeckSelectorProps {
  selectedDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  onDeckCreated?: (deck: DeckDTO) => void;
  error?: string;
}

export function DeckSelector({ ... }: DeckSelectorProps) {
  // Stan
  const [decks, setDecks] = useState<DeckListItemDTO[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  
  // useEffect - fetch decks
  useEffect(() => {
    const fetchDecks = async () => { /* ... */ };
    fetchDecks();
  }, []);
  
  // Handlers
  const handleDeckChange = (value: string) => { /* ... */ };
  const handleCreateDeck = async () => { /* ... */ };
  const handleCancelCreate = () => { /* ... */ };
  
  return (
    <div className="space-y-2">
      {/* Dropdown lub Inline Form */}
    </div>
  );
}
```

**Szczegóły implementacji:**
- Fetch decks przy montowaniu (GET /api/decks?limit=100)
- Select z listą talii + opcja "Utwórz nową talię"
- Inline creation mode z inputem i przyciskami
- Obsługa tworzenia talii (POST /api/decks)
- Error handling i loading states

### Krok 4: Utworzenie głównego komponentu CreateFlashcardButton

**Akcja:** Stwórz komponent z modalem i formularzem

**Plik:** `src/components/CreateFlashcardButton.tsx`

**Struktura:**
```tsx
import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DeckSelector } from "./DeckSelector";
import type { CreateFlashcardCommand, FlashcardDTO } from "@/types";

interface CreateFlashcardButtonProps {
  preselectedDeckId?: string;
  onFlashcardCreated?: (flashcard: FlashcardDTO) => void;
}

export function CreateFlashcardButton({ 
  preselectedDeckId, 
  onFlashcardCreated 
}: CreateFlashcardButtonProps) {
  // Stan formularza
  const [isOpen, setIsOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(
    preselectedDeckId || null
  );
  
  // Stan błędów
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // Stan submitu
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Walidacja
  const validateFront = (value: string): string | null => { /* ... */ };
  const validateBack = (value: string): string | null => { /* ... */ };
  const validateDeck = (deckId: string | null): string | null => { /* ... */ };
  
  const isFormValid = useMemo(() => { /* ... */ }, [front, back, selectedDeckId]);
  
  // Handlers
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { /* ... */ };
  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { /* ... */ };
  const handleSubmit = async (e: React.FormEvent) => { /* ... */ };
  const handleKeyDown = (e: React.KeyboardEvent) => { /* Ctrl+Enter */ };
  const handleOpenChange = (open: boolean) => { /* ... */ };
  const resetForm = () => { /* ... */ };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Trigger */}
      {/* Content */}
    </Dialog>
  );
}
```

**Szczegóły implementacji:**
- State management dla wszystkich pól
- Real-time walidacja
- Submit handler z API call
- Keyboard shortcuts (Ctrl+Enter, Esc)
- Error handling
- Loading states
- Toast notifications

### Krok 5: Implementacja logiki walidacji

**Akcja:** Zaimplementuj wszystkie funkcje walidacyjne zgodnie z sekcją 9

**Funkcje:**
- `validateFront(value: string): string | null`
- `validateBack(value: string): string | null`
- `validateDeck(deckId: string | null): string | null`
- `isFormValid` - computed value (useMemo)

### Krok 6: Implementacja API calls

**Akcja:** Zaimplementuj wszystkie wywołania API zgodnie z sekcją 7

**Funkcje:**
- `handleSubmit` - POST /api/flashcards
- `fetchDecks` (w DeckSelector) - GET /api/decks
- `handleCreateDeck` (w DeckSelector) - POST /api/decks

**Obsługa błędów:**
- Try-catch blocks
- Response status checking
- Error mapping na pola formularza
- Toast notifications

### Krok 7: Implementacja keyboard shortcuts

**Akcja:** Dodaj obsługę skrótów klawiszowych

**Kody:**
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
  // Ctrl+Enter lub Cmd+Enter - submit
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    handleSubmit(e);
  }
};

// Na Dialog
<Dialog open={isOpen} onOpenChange={handleOpenChange}>
  {/* Esc automatycznie obsługiwane przez Dialog */}
</Dialog>
```

**Focus trap:**
Dialog component z Radix UI automatycznie implementuje focus trap.

### Krok 8: Dodanie komponentu do stron

**Akcja:** Wstaw CreateFlashcardButton w odpowiednich miejscach

**Plik:** `src/pages/index.astro` (dashboard)

**Kod:**
```astro
---
import DashboardLayout from "@/layouts/DashboardLayout.astro";
import { CreateFlashcardButton } from "@/components/CreateFlashcardButton";
---

<DashboardLayout title="Dashboard">
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Moje talie</h1>
      <div class="flex gap-2">
        <CreateFlashcardButton client:load />
        <!-- ... inne przyciski ... -->
      </div>
    </div>
    <!-- ... reszta dashboardu ... -->
  </div>
</DashboardLayout>
```

**Uwaga:** Użyj `client:load` directive dla komponentu React w Astro.

### Krok 9: Styling i responsywność

**Akcja:** Dopracuj wygląd komponentów zgodnie z Tailwind

**Responsywność:**
```tsx
<DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
  {/* Formularz */}
</DialogContent>
```

**Textarea auto-resize (opcjonalne):**
Można dodać auto-resize dla textarea:
```typescript
const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  e.target.style.height = "auto";
  e.target.style.height = e.target.scrollHeight + "px";
};
```

### Krok 10: Dodanie toast notifications

**Akcja:** Dodaj bibliotekę toast notifications (np. sonner, react-hot-toast)

**Instalacja:**
```bash
npm install sonner
```

**Setup w layout:**
```astro
---
import { Toaster } from "sonner";
---

<html>
  <body>
    <slot />
    <Toaster position="top-right" />
  </body>
</html>
```

**Użycie:**
```typescript
import { toast } from "sonner";

toast.success("Fiszka została dodana!");
toast.error("Nie udało się dodać fiszki");
```

### Krok 11: Testy manualne

**Akcja:** Przetestuj wszystkie scenariusze

**Checklist:**
- [ ] Modal otwiera się po kliknięciu przycisku
- [ ] Focus na pierwszym polu (Front)
- [ ] Real-time walidacja działa poprawnie
- [ ] Liczniki znaków aktualizują się
- [ ] Dropdown talii ładuje listę
- [ ] Inline creation talii działa
- [ ] Submit formularza tworzy fiszkę
- [ ] Toast success pojawia się
- [ ] Modal zamyka się po sukcesie
- [ ] Formularz resetuje się
- [ ] Strona odświeża się / lokalny stan aktualizuje
- [ ] Ctrl+Enter submituje formularz
- [ ] Esc zamyka modal
- [ ] Tab navigation działa poprawnie
- [ ] Błędy API są wyświetlane
- [ ] Loading states działają
- [ ] Preselected deck działa (jeśli podany)
- [ ] Responsywność na mobile

### Krok 12: Optymalizacje (opcjonalne)

**Akcja:** Dodaj optymistyczne aktualizacje i lepsze UX

**Optimistic update:**
Zamiast `window.location.reload()`, zaktualizuj lokalny stan:
```typescript
// W parent component
const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);

const handleFlashcardCreated = (newFlashcard: FlashcardDTO) => {
  // Optimistic update
  setFlashcards(prev => [newFlashcard, ...prev]);
};

<CreateFlashcardButton 
  onFlashcardCreated={handleFlashcardCreated}
/>
```

**Debounce walidacji (jeśli potrzebne):**
```typescript
import { useDebouncedCallback } from "use-debounce";

const debouncedValidateFront = useDebouncedCallback(
  (value: string) => setFrontError(validateFront(value)),
  300
);
```

### Krok 13: Dokumentacja i cleanup

**Akcja:** Dodaj komentarze JSDoc i usuń console.logs

**Przykład:**
```typescript
/**
 * Component for creating a new flashcard with inline deck selection/creation
 * 
 * @param preselectedDeckId - Optional UUID of pre-selected deck
 * @param onFlashcardCreated - Callback after successful flashcard creation
 */
export function CreateFlashcardButton({ ... }: CreateFlashcardButtonProps) {
  // ...
}
```

### Krok 14: Integracja z istniejącym kodem

**Akcja:** Upewnij się, że komponent działa z resztą aplikacji

**Sprawdź:**
- Czy sesja użytkownika jest poprawnie przekazywana
- Czy middleware autoryzacji działa
- Czy API endpoints są dostępne
- Czy typy są zgodne z backend

### Krok 15: Finalne testy end-to-end

**Akcja:** Przetestuj cały flow od początku do końca

**Scenariusze:**
1. Nowy użytkownik bez talii → tworzy talię inline → tworzy fiszkę
2. Użytkownik z taliami → wybiera istniejącą → tworzy fiszkę
3. Użytkownik z widoku talii → pre-selected deck → tworzy fiszkę
4. Edge cases: długie teksty, błędy API, brak internetu

---

**Koniec planu implementacji**

Plan ten zawiera wszystkie szczegóły potrzebne do implementacji widoku tworzenia fiszki manualnie zgodnie z PRD, User Stories i dostarczonymi specyfikacjami API.
