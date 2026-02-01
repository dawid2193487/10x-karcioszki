# Plan implementacji widoku generowania fiszek przez AI

## 1. Przegląd

Widok generowania fiszek przez AI składa się z dwóch kluczowych ekranów:
1. **Formularz generowania (`/generate`)** - przyjmuje tekst edukacyjny od użytkownika i wysyła do API w celu wygenerowania propozycji fiszek
2. **Widok recenzji (`/generate/review`)** - wyświetla wygenerowane fiszki i umożliwia ich akceptację, edycję lub odrzucenie przed ostatecznym zapisem

Głównym celem jest umożliwienie użytkownikowi szybkiego przekształcenia materiału edukacyjnego w fiszki przy zachowaniu pełnej kontroli nad jakością końcowego materiału.

## 2. Routing widoku

- **Formularz generowania**: `/generate` (strona Astro)
- **Widok recenzji**: `/generate/review` (strona Astro)

Oba widoki wymagają uwierzytelnienia użytkownika (middleware przekieruje niezalogowanych użytkowników do `/login`).

## 3. Struktura komponentów

```
generate.astro (Astro Layout)
├── AIGenerateForm.tsx (React - główny formularz)
│   ├── CharacterCounter.tsx (React - licznik znaków)
│   ├── EstimatedCount.tsx (React - szacowana liczba fiszek)
│   └── DeckSelector.tsx (React - istniejący komponent)

review.astro (Astro Layout)
└── AIReviewInterface.tsx (React - główny interfejs recenzji)
    ├── ReviewHeader.tsx (React - header z licznikami i wyborem talii)
    │   └── DeckSelector.tsx (React - istniejący komponent)
    ├── FlashcardReviewCard.tsx (React - pojedyncza fiszka do recenzji)
    │   ├── FlashcardEditMode.tsx (React - tryb edycji fiszki)
    │   └── FlashcardActionButtons.tsx (React - przyciski akcji)
    ├── ReviewProgress.tsx (React - pasek postępu i liczniki)
    ├── ReviewSummary.tsx (React - podsumowanie po zakończeniu)
    └── LoadingSpinner.tsx (React - podczas generowania)
```

## 4. Szczegóły komponentów

### 4.1 AIGenerateForm.tsx

**Opis**: Główny formularz do wprowadzenia tekstu edukacyjnego i wywołania generowania fiszek przez AI.

**Główne elementy HTML i komponenty**:
- `<form>` - główny kontener formularza
- `<Textarea>` (Shadcn/ui) - pole tekstowe do wprowadzenia materiału edukacyjnego
- `CharacterCounter` - komponent wyświetlający licznik znaków
- `EstimatedCount` - komponent wyświetlający szacowaną liczbę fiszek
- `DeckSelector` - komponent wyboru/utworzenia talii
- `<Button>` (Shadcn/ui) - przycisk "Generuj fiszki"
- `LoadingSpinner` - wyświetlany podczas generowania

**Obsługiwane interakcje**:
- Wpisywanie tekstu w textarea (real-time update licznika)
- Wybór talii z dropdown lub utworzenie nowej
- Kliknięcie przycisku "Generuj fiszki"
- Skrót klawiszowy `Ctrl+Enter` dla submitu (gdy walidacja OK)
- Obsługa błędów API (toast notifications)

**Warunki walidacji**:
- Tekst: minimum 100 znaków, maksimum 5000 znaków
- Talia: musi być wybrana (istniejąca lub nowo utworzona)
- Submit disabled gdy:
  - Tekst < 100 znaków
  - Tekst > 5000 znaków
  - Brak wybranej talii
  - Trwa generowanie (loading state)

**Typy**:
- `GenerateFlashcardsCommand` - request body
- `GenerateFlashcardsResponseDTO` - response z API
- `DeckListItemDTO` - dla talii w selectorze
- `ErrorResponseDTO` - dla błędów API

**Propsy**:
```typescript
interface AIGenerateFormProps {
  initialDeckId?: string; // Opcjonalna początkowa talia
}
```

### 4.2 CharacterCounter.tsx

**Opis**: Komponent wyświetlający licznik znaków z kolorową informacją zwrotną.

**Główne elementy HTML**:
- `<div>` z tekstem formatu "1,234 / 5,000 znaków"
- Kolory zależne od walidacji

**Obsługiwane interakcje**:
- Brak (tylko wyświetlanie)
- `aria-live="polite"` dla screen readers

**Warunki walidacji**:
- `< 100` znaków: kolor czerwony (text-destructive)
- `100-5000` znaków: kolor zielony (text-success)
- `> 5000` znaków: kolor czerwony (text-destructive)

**Typy**: Brak niestandardowych typów

**Propsy**:
```typescript
interface CharacterCounterProps {
  current: number;
  max: number;
  min: number;
}
```

### 4.3 EstimatedCount.tsx

**Opis**: Komponent wyświetlający szacowaną liczbę fiszek na podstawie długości tekstu.

**Główne elementy HTML**:
- `<p>` z tekstem formatu "Szacowana liczba fiszek: ~5"

**Obsługiwane interakcje**:
- Brak (tylko wyświetlanie)

**Warunki walidacji**:
- Formuła: `Math.max(1, Math.floor(textLength / 250))`

**Typy**: Brak niestandardowych typów

**Propsy**:
```typescript
interface EstimatedCountProps {
  textLength: number;
}
```

### 4.4 AIReviewInterface.tsx

**Opis**: Główny interfejs recenzji wygenerowanych fiszek. Zarządza stanem wszystkich wygenerowanych fiszek i obsługuje akcje użytkownika.

**Główne elementy HTML i komponenty**:
- `ReviewHeader` - nagłówek z wyborem talii i licznikami
- `ReviewProgress` - pasek postępu
- `FlashcardReviewCard` - aktualna fiszka do recenzji
- `ReviewSummary` - podsumowanie (widoczne po zakończeniu)
- Keyboard handler dla skrótów klawiszowych

**Obsługiwane interakcje**:
- Nawigacja między fiszkami (Tab/Shift+Tab, strzałki)
- Akceptacja fiszki (Enter, przycisk)
- Edycja fiszki (E, przycisk)
- Odrzucenie fiszki (Delete, przycisk)
- Zmiana talii docelowej

**Warunki walidacji**:
- Talia musi być wybrana przed akceptacją fiszki

**Typy**:
- `GeneratedFlashcardDTO` - pojedyncza wygenerowana fiszka
- `ReviewState` - stan recenzji (custom type)
- `ReviewAction` - typ akcji (custom type)

**Propsy**:
```typescript
interface AIReviewInterfaceProps {
  generationLogId: string;
  flashcards: GeneratedFlashcardDTO[];
  initialDeckId?: string;
}
```

### 4.5 ReviewHeader.tsx

**Opis**: Nagłówek widoku recenzji z wyborem talii i licznikami.

**Główne elementy HTML i komponenty**:
- Tytuł "Recenzja wygenerowanych fiszek"
- `DeckSelector` - wybór talii docelowej
- Liczniki: aktualna pozycja / total, zaakceptowane, odrzucone

**Obsługiwane interakcje**:
- Zmiana talii przez `DeckSelector`

**Warunki walidacji**:
- Talia musi być wybrana

**Typy**:
- `ReviewStats` (custom type)

**Propsy**:
```typescript
interface ReviewHeaderProps {
  selectedDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  currentIndex: number;
  total: number;
  acceptedCount: number;
  rejectedCount: number;
}
```

### 4.6 FlashcardReviewCard.tsx

**Opis**: Komponent pojedynczej fiszki w widoku recenzji z możliwością edycji.

**Główne elementy HTML i komponenty**:
- `<div>` z frontem i backiem fiszki
- `FlashcardEditMode` - tryb edycji (conditional)
- `FlashcardActionButtons` - przyciski akcji

**Obsługiwane interakcje**:
- Przełączanie do trybu edycji
- Akceptacja (wysłanie do API)
- Odrzucenie (lokalne, bez API)

**Warunki walidacji**:
- W trybie edycji: front i back wymagane (1-1000 znaków)

**Typy**:
- `GeneratedFlashcardDTO`
- `EditedFlashcard` (custom type)

**Propsy**:
```typescript
interface FlashcardReviewCardProps {
  flashcard: GeneratedFlashcardDTO;
  deckId: string;
  generationLogId: string;
  isActive: boolean;
  onAccept: (flashcardId: string) => void;
  onReject: (flashcardId: string) => void;
  onEdit: (flashcardId: string, edited: EditedFlashcard) => void;
}
```

### 4.7 FlashcardEditMode.tsx

**Opis**: Inline edycja fiszki w widoku recenzji.

**Główne elementy HTML**:
- `<Input>` (Shadcn/ui) - pole edycji front
- `<Textarea>` (Shadcn/ui) - pole edycji back
- `<Button>` - Zapisz / Anuluj

**Obsługiwane interakcje**:
- Edycja tekstu
- Zapisanie zmian (Enter)
- Anulowanie (Esc)

**Warunki walidacji**:
- Front: 1-1000 znaków
- Back: 1-1000 znaków

**Typy**:
- `EditedFlashcard` (custom type)

**Propsy**:
```typescript
interface FlashcardEditModeProps {
  originalFront: string;
  originalBack: string;
  onSave: (edited: EditedFlashcard) => void;
  onCancel: () => void;
}
```

### 4.8 FlashcardActionButtons.tsx

**Opis**: Przyciski akcji dla fiszki w recenzji.

**Główne elementy HTML**:
- `<Button>` - Akceptuj (zielony)
- `<Button>` - Edytuj (niebieski)
- `<Button>` - Odrzuć (czerwony)

**Obsługiwane interakcje**:
- Kliknięcie przycisków
- Keyboard shortcuts (Enter, E, Delete)

**Warunki walidacji**: Brak

**Typy**: Brak niestandardowych typów

**Propsy**:
```typescript
interface FlashcardActionButtonsProps {
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
  isEditMode: boolean;
  disabled: boolean;
}
```

### 4.9 ReviewProgress.tsx

**Opis**: Pasek postępu recenzji z wizualizacją.

**Główne elementy HTML**:
- `<div>` - progress bar
- Liczniki: pozostało, zaakceptowane, odrzucone

**Obsługiwane interakcje**: Brak (tylko wyświetlanie)

**Warunki walidacji**: Brak

**Typy**:
- `ReviewStats` (custom type)

**Propsy**:
```typescript
interface ReviewProgressProps {
  current: number;
  total: number;
  acceptedCount: number;
  rejectedCount: number;
}
```

### 4.10 ReviewSummary.tsx

**Opis**: Podsumowanie po zakończeniu recenzji wszystkich fiszek.

**Główne elementy HTML**:
- Statystyki: zaakceptowane, edytowane, odrzucone
- Nazwa talii docelowej
- `<Button>` - "Zamknij" (przekierowanie do talii)
- `<Button>` - "Dodaj więcej fiszek" (powrót do formularza)

**Obsługiwane interakcje**:
- Kliknięcie przycisków nawigacyjnych

**Warunki walidacji**: Brak

**Typy**:
- `ReviewSummaryData` (custom type)

**Propsy**:
```typescript
interface ReviewSummaryProps {
  acceptedCount: number;
  editedCount: number;
  rejectedCount: number;
  deckId: string;
  deckName: string;
  onClose: () => void;
  onAddMore: () => void;
}
```

### 4.11 LoadingSpinner.tsx

**Opis**: Komponent ładowania wyświetlany podczas generowania fiszek.

**Główne elementy HTML**:
- Spinner animation
- Tekst "Generowanie fiszek..."

**Obsługiwane interakcje**: Brak

**Warunki walidacji**: Brak

**Typy**: Brak niestandardowych typów

**Propsy**:
```typescript
interface LoadingSpinnerProps {
  message?: string;
}
```

## 5. Typy

### 5.1 Istniejące typy (z types.ts)

```typescript
// Request/Response dla API generowania
export interface GenerateFlashcardsCommand {
  text: string;
  language?: string;
}

export interface GeneratedFlashcardDTO {
  front: string;
  back: string;
}

export interface GenerateFlashcardsResponseDTO {
  generation_log_id: string;
  flashcards: GeneratedFlashcardDTO[];
  count: number;
  estimated_count: number;
}

// Request/Response dla logowania akcji recenzji
export type AiReviewActionType = "accepted" | "edited" | "rejected";

export interface LogAiReviewActionCommand {
  generation_log_id: string;
  flashcard_id: string | null;
  action_type: AiReviewActionType;
  original_front: string;
  original_back: string;
  edited_front?: string;
  edited_back?: string;
}

export interface AiReviewActionDTO {
  id: string;
  generation_log_id: string;
  flashcard_id: string | null;
  action_type: AiReviewActionType;
  created_at: string;
}

// Tworzenie fiszki
export interface CreateFlashcardCommand {
  deck_id: string;
  front: string;
  back: string;
  source: FlashcardSource; // "ai" | "manual"
}

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
```

### 5.2 Nowe typy (ViewModels dla komponentów)

```typescript
// Stan pojedynczej fiszki w recenzji
export interface ReviewFlashcard extends GeneratedFlashcardDTO {
  id: string; // temporary ID dla zarządzania stanem
  status: "pending" | "accepted" | "edited" | "rejected";
  flashcardId?: string; // ID po zapisie w bazie (tylko dla accepted/edited)
}

// Stan edytowanej fiszki
export interface EditedFlashcard {
  front: string;
  back: string;
}

// Stan całej recenzji
export interface ReviewState {
  flashcards: ReviewFlashcard[];
  currentIndex: number;
  selectedDeckId: string | null;
  generationLogId: string;
  isLoading: boolean;
  error: string | null;
}

// Statystyki recenzji
export interface ReviewStats {
  total: number;
  current: number;
  accepted: number;
  edited: number;
  rejected: number;
  remaining: number;
}

// Dane podsumowania
export interface ReviewSummaryData {
  acceptedCount: number;
  editedCount: number;
  rejectedCount: number;
  deckId: string;
  deckName: string;
}

// Stan formularza generowania
export interface GenerateFormState {
  text: string;
  selectedDeckId: string | null;
  isGenerating: boolean;
  error: string | null;
}

// Walidacja formularza
export interface GenerateFormValidation {
  isValid: boolean;
  errors: {
    text?: string;
    deck?: string;
  };
}
```

## 6. Zarządzanie stanem

### 6.1 AIGenerateForm - useState

Stan lokalny zarządzany przez `useState`:

```typescript
const [text, setText] = useState<string>("");
const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
const [isGenerating, setIsGenerating] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

Obliczenia derived state:
- `characterCount = text.length`
- `estimatedCount = Math.max(1, Math.floor(text.length / 250))`
- `isValid = text.length >= 100 && text.length <= 5000 && selectedDeckId !== null`

### 6.2 AIReviewInterface - Custom Hook: useReviewState

Ze względu na złożoność logiki recenzji, zalecane jest utworzenie custom hook `useReviewState`:

```typescript
function useReviewState(
  initialFlashcards: GeneratedFlashcardDTO[],
  generationLogId: string,
  initialDeckId?: string
) {
  const [state, setState] = useState<ReviewState>({
    flashcards: initialFlashcards.map((f, index) => ({
      ...f,
      id: `temp-${index}`,
      status: "pending",
    })),
    currentIndex: 0,
    selectedDeckId: initialDeckId || null,
    generationLogId,
    isLoading: false,
    error: null,
  });

  // Akcje
  const acceptFlashcard = async (tempId: string) => { /* ... */ };
  const editFlashcard = async (tempId: string, edited: EditedFlashcard) => { /* ... */ };
  const rejectFlashcard = (tempId: string) => { /* ... */ };
  const navigateNext = () => { /* ... */ };
  const navigatePrev = () => { /* ... */ };
  const setDeck = (deckId: string) => { /* ... */ };

  // Computed values
  const stats = useMemo(() => calculateStats(state), [state]);
  const isComplete = useMemo(() => checkIfComplete(state), [state]);
  const currentFlashcard = state.flashcards[state.currentIndex];

  return {
    state,
    currentFlashcard,
    stats,
    isComplete,
    acceptFlashcard,
    editFlashcard,
    rejectFlashcard,
    navigateNext,
    navigatePrev,
    setDeck,
  };
}
```

### 6.3 Keyboard Handlers - Custom Hook: useKeyboardShortcuts

Dla obu widoków zalecany jest custom hook do obsługi skrótów klawiszowych:

```typescript
function useKeyboardShortcuts(handlers: {
  onEnter?: () => void;
  onSpace?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onEscape?: () => void;
}, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignoruj gdy focus na input/textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key) {
        case "Enter":
          if (e.ctrlKey) handlers.onEnter?.();
          break;
        case " ":
          e.preventDefault();
          handlers.onSpace?.();
          break;
        case "e":
        case "E":
          handlers.onEdit?.();
          break;
        case "Delete":
          handlers.onDelete?.();
          break;
        case "Tab":
          e.preventDefault();
          e.shiftKey ? handlers.onPrev?.() : handlers.onNext?.();
          break;
        case "Escape":
          handlers.onEscape?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, enabled]);
}
```

## 7. Integracja API

### 7.1 POST /api/ai/generate

**Używany w**: `AIGenerateForm.tsx`

**Request**:
```typescript
const command: GenerateFlashcardsCommand = {
  text: text.trim(),
  language: "pl", // opcjonalnie
};

const response = await fetch("/api/ai/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(command),
});
```

**Response (200 OK)**:
```typescript
const data: GenerateFlashcardsResponseDTO = await response.json();
// {
//   generation_log_id: "uuid",
//   flashcards: [{ front: "...", back: "..." }],
//   count: 5,
//   estimated_count: 5
// }
```

**Obsługa błędów**:
- `400 Bad Request` - walidacja nie przeszła (toast: "Tekst musi mieć 100-5000 znaków")
- `429 Too Many Requests` - rate limit (toast: "Zbyt wiele prób. Spróbuj za X sekund")
- `500 Internal Server Error` - błąd AI (toast: "Nie udało się wygenerować fiszek. Spróbuj ponownie")
- `503 Service Unavailable` - timeout AI (toast: "Generowanie trwa zbyt długo. Spróbuj z krótszym tekstem")

**Po sukcesie**:
1. Zapisz `generation_log_id` w state/sessionStorage
2. Zapisz `flashcards` w state
3. Zapisz `selectedDeckId` w state
4. Przekieruj na `/generate/review` z danymi w URL params lub context

### 7.2 POST /api/flashcards

**Używany w**: `FlashcardReviewCard.tsx` (przy akceptacji/edycji)

**Request (dla akceptacji)**:
```typescript
const command: CreateFlashcardCommand = {
  deck_id: deckId,
  front: flashcard.front,
  back: flashcard.back,
  source: "ai",
};

const response = await fetch("/api/flashcards", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(command),
});
```

**Request (dla edycji)**:
```typescript
const command: CreateFlashcardCommand = {
  deck_id: deckId,
  front: editedFlashcard.front, // zmienione
  back: editedFlashcard.back,   // zmienione
  source: "ai",
};
```

**Response (201 Created)**:
```typescript
const flashcard: FlashcardDTO = await response.json();
// Użyj flashcard.id dla logowania akcji
```

### 7.3 POST /api/ai/review-actions

**Używany w**: `FlashcardReviewCard.tsx` (po każdej akcji)

**Request (accepted)**:
```typescript
const command: LogAiReviewActionCommand = {
  generation_log_id: generationLogId,
  flashcard_id: flashcardId, // z odpowiedzi POST /api/flashcards
  action_type: "accepted",
  original_front: flashcard.front,
  original_back: flashcard.back,
};
```

**Request (edited)**:
```typescript
const command: LogAiReviewActionCommand = {
  generation_log_id: generationLogId,
  flashcard_id: flashcardId,
  action_type: "edited",
  original_front: flashcard.front,
  original_back: flashcard.back,
  edited_front: editedFlashcard.front,
  edited_back: editedFlashcard.back,
};
```

**Request (rejected)**:
```typescript
const command: LogAiReviewActionCommand = {
  generation_log_id: generationLogId,
  flashcard_id: null, // fiszka nie została zapisana
  action_type: "rejected",
  original_front: flashcard.front,
  original_back: flashcard.back,
};
```

**Response (201 Created)**:
```typescript
const action: AiReviewActionDTO = await response.json();
// Opcjonalnie użyj dla analytics
```

**Kolejność wywołań dla akceptacji/edycji**:
1. POST /api/flashcards → otrzymaj `flashcard_id`
2. POST /api/ai/review-actions → zaloguj akcję z `flashcard_id`

**Kolejność wywołań dla odrzucenia**:
1. POST /api/ai/review-actions → zaloguj akcję z `flashcard_id: null`
2. Brak zapisu fiszki

### 7.4 GET /api/decks

**Używany w**: `DeckSelector.tsx` (istniejący komponent)

**Request**:
```typescript
const response = await fetch("/api/decks?limit=100&page=1");
const data: DeckListResponseDTO = await response.json();
```

**Response**:
```typescript
{
  data: DeckListItemDTO[],
  pagination: { page: 1, limit: 100, total: 5, total_pages: 1 }
}
```

## 8. Interakcje użytkownika

### 8.1 Formularz generowania (/generate)

#### Wprowadzenie tekstu
1. Użytkownik klika w textarea
2. Użytkownik wpisuje/wkleja tekst
3. System real-time aktualizuje:
   - Licznik znaków (z kolorem: czerwony < 100, zielony 100-5000, czerwony > 5000)
   - Szacowaną liczbę fiszek (~1 na 250 znaków)
4. Przycisk "Generuj fiszki" jest enabled/disabled w zależności od walidacji

#### Wybór talii
1. Użytkownik klika dropdown "Dodaj do talii"
2. System wyświetla listę istniejących talii + opcja "Utwórz nową talię"
3. Użytkownik wybiera talię LUB klika "Utwórz nową talię"
4. Jeśli nowa talia:
   - Dropdown zamienia się w input field
   - Użytkownik wpisuje nazwę i klika Enter lub "Utwórz"
   - System tworzy talię (POST /api/decks)
   - Nowa talia jest auto-select
   - Dropdown wraca do normalnego stanu

#### Generowanie
1. Użytkownik klika "Generuj fiszki" LUB naciska Ctrl+Enter
2. System:
   - Disabled przycisk i pokazuje loading spinner
   - Wysyła POST /api/ai/generate
   - Wyświetla komunikat "Generowanie fiszek..."
3. Po sukcesie:
   - Zapisuje dane w state/sessionStorage
   - Przekierowuje na /generate/review
4. Po błędzie:
   - Wyświetla toast z odpowiednim komunikatem
   - Enabled przycisk z powrotem

### 8.2 Widok recenzji (/generate/review)

#### Wyświetlenie fiszek
1. System ładuje dane z poprzedniego ekranu
2. System wyświetla pierwszą fiszkę (index 0)
3. Aktualna fiszka jest wyróżniona (border, highlight)
4. Header pokazuje: "1 / 12", "Zaakceptowane: 0", "Odrzucone: 0"

#### Akceptacja fiszki
1. Użytkownik klika "Akceptuj" LUB naciska Enter
2. System:
   - Wysyła POST /api/flashcards
   - Otrzymuje flashcard_id
   - Wysyła POST /api/ai/review-actions (action_type: "accepted")
   - Oznacza fiszkę jako accepted
   - Wyświetla toast "Fiszka zaakceptowana"
   - Przechodzi do następnej fiszki (currentIndex++)
   - Aktualizuje liczniki

#### Edycja fiszki
1. Użytkownik klika "Edytuj" LUB naciska E
2. System włącza tryb edycji:
   - Front i back stają się editable (Input/Textarea)
   - Przycisk "Edytuj" zmienia się w "Zapisz"
   - Widoczny przycisk "Anuluj"
3. Użytkownik edytuje tekst
4. Użytkownik klika "Zapisz" LUB naciska Enter
5. System:
   - Waliduje (1-1000 znaków dla front i back)
   - Wysyła POST /api/flashcards z edited content
   - Otrzymuje flashcard_id
   - Wysyła POST /api/ai/review-actions (action_type: "edited")
   - Oznacza fiszkę jako edited
   - Wyświetla toast "Fiszka zapisana"
   - Przechodzi do następnej fiszki
   - Aktualizuje liczniki

#### Anulowanie edycji
1. Użytkownik klika "Anuluj" LUB naciska Esc
2. System:
   - Przywraca oryginalną treść
   - Wyłącza tryb edycji
   - Powrót do widoku normalnego

#### Odrzucenie fiszki
1. Użytkownik klika "Odrzuć" LUB naciska Delete
2. System:
   - Wysyła POST /api/ai/review-actions (action_type: "rejected", flashcard_id: null)
   - Oznacza fiszkę jako rejected
   - Fiszka znika z interfejsu (lub jest oznaczona jako odrzucona)
   - Przechodzi do następnej fiszki
   - Aktualizuje liczniki

#### Nawigacja
1. Użytkownik naciska Tab → następna fiszka
2. Użytkownik naciska Shift+Tab → poprzednia fiszka
3. Użytkownik naciska strzałkę w dół → następna fiszka
4. Użytkownik naciska strzałkę w górę → poprzednia fiszka
5. System aktualizuje currentIndex i wyświetla odpowiednią fiszkę

#### Zmiana talii
1. Użytkownik klika dropdown "Dodaj do talii" w header
2. System wyświetla listę talii + opcja "Utwórz nową talię"
3. Użytkownik wybiera inną talię
4. System aktualizuje selectedDeckId
5. Wszystkie kolejne akceptacje/edycje idą do nowej talii

#### Zakończenie recenzji
1. Użytkownik zaakceptował/odrzucił ostatnią fiszkę
2. System:
   - Wyświetla ReviewSummary z podsumowaniem
   - Pokazuje: zaakceptowane (X), edytowane (Y), odrzucone (Z)
   - Pokazuje nazwę talii docelowej
3. Użytkownik klika "Zamknij"
   - Przekierowanie do /decks/[deckId]
4. Użytkownik klika "Dodaj więcej fiszek"
   - Przekierowanie do /generate

## 9. Warunki i walidacja

### 9.1 Formularz generowania (/generate)

#### Walidacja tekstu (frontend + backend)
- **Komponent**: `AIGenerateForm.tsx`
- **Pole**: `text`
- **Warunki**:
  - Minimum: 100 znaków
  - Maximum: 5000 znaków
- **Weryfikacja frontend**:
  ```typescript
  const isTextValid = text.length >= 100 && text.length <= 5000;
  ```
- **Wpływ na UI**:
  - Licznik znaków: czerwony jeśli invalid, zielony jeśli valid
  - Komunikat błędu pod textarea:
    - "Minimum 100 znaków" jeśli < 100
    - "Maksimum 5000 znaków" jeśli > 5000
  - Przycisk "Generuj fiszki": disabled jeśli invalid

#### Walidacja talii
- **Komponent**: `DeckSelector.tsx`
- **Pole**: `selectedDeckId`
- **Warunki**:
  - Talia musi być wybrana (nie null)
- **Weryfikacja frontend**:
  ```typescript
  const isDeckValid = selectedDeckId !== null;
  ```
- **Wpływ na UI**:
  - Przycisk "Generuj fiszki": disabled jeśli brak talii
  - Komunikat błędu: "Wybierz talię" jeśli próba submitu bez talii

#### Submit disabled gdy
- `text.length < 100`
- `text.length > 5000`
- `selectedDeckId === null`
- `isGenerating === true`

### 9.2 Widok recenzji (/generate/review)

#### Walidacja talii przed akceptacją
- **Komponent**: `AIReviewInterface.tsx`
- **Warunki**:
  - `selectedDeckId !== null` przed wysłaniem POST /api/flashcards
- **Weryfikacja**:
  ```typescript
  if (!selectedDeckId) {
    setError("Wybierz talię przed zaakceptowaniem fiszki");
    return;
  }
  ```
- **Wpływ na UI**:
  - Toast error: "Wybierz talię przed zapisaniem fiszek"
  - Przyciski "Akceptuj" i "Edytuj": disabled jeśli brak talii

#### Walidacja edycji fiszki
- **Komponent**: `FlashcardEditMode.tsx`
- **Pola**: `front`, `back`
- **Warunki**:
  - Front: 1-1000 znaków
  - Back: 1-1000 znaków
  - Oba pola wymagane
- **Weryfikacja frontend**:
  ```typescript
  const isFrontValid = front.trim().length >= 1 && front.length <= 1000;
  const isBackValid = back.trim().length >= 1 && back.length <= 1000;
  const isEditValid = isFrontValid && isBackValid;
  ```
- **Wpływ na UI**:
  - Licznik znaków pod każdym polem (X/1000)
  - Przycisk "Zapisz": disabled jeśli invalid
  - Komunikaty błędów:
    - "Pole nie może być puste" jeśli < 1
    - "Maksimum 1000 znaków" jeśli > 1000

#### Przyciski disabled podczas loading
- **Komponenty**: `FlashcardActionButtons.tsx`
- **Warunki**:
  - `isLoading === true` (podczas POST request)
- **Wpływ na UI**:
  - Wszystkie przyciski akcji: disabled
  - Loading spinner przy aktualnym przycisku

## 10. Obsługa błędów

### 10.1 Błędy API generowania

#### 400 Bad Request - Walidacja
- **Przypadek**: Tekst < 100 lub > 5000 znaków (błąd backendu)
- **Obsługa**:
  ```typescript
  if (response.status === 400) {
    const error: ErrorResponseDTO = await response.json();
    toast.error("Tekst musi mieć 100-5000 znaków");
  }
  ```

#### 429 Too Many Requests - Rate Limit
- **Przypadek**: Użytkownik przekroczył 10 requestów/minutę
- **Obsługa**:
  ```typescript
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    toast.error(`Zbyt wiele prób. Spróbuj za ${retryAfter} sekund.`);
  }
  ```

#### 500 Internal Server Error - AI Error
- **Przypadek**: Błąd Google Gemini API
- **Obsługa**:
  ```typescript
  if (response.status === 500) {
    toast.error("Nie udało się wygenerować fiszek. Spróbuj ponownie.");
  }
  ```

#### 503 Service Unavailable - Timeout
- **Przypadek**: AI timeout (> 30s)
- **Obsługa**:
  ```typescript
  if (response.status === 503) {
    toast.error("Generowanie trwa zbyt długo. Spróbuj z krótszym tekstem.");
  }
  ```

#### Network Error
- **Przypadek**: Brak internetu, serwer nie odpowiada
- **Obsługa**:
  ```typescript
  try {
    const response = await fetch(...);
  } catch (error) {
    toast.error("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");
  }
  ```

### 10.2 Błędy recenzji

#### Brak talii
- **Przypadek**: Użytkownik próbuje zaakceptować fiszkę bez wybranej talii
- **Obsługa**:
  ```typescript
  if (!selectedDeckId) {
    toast.error("Wybierz talię przed zapisaniem fiszek");
    return;
  }
  ```

#### Błąd zapisu fiszki (POST /api/flashcards)
- **Przypadek**: Błąd 400/500 podczas tworzenia fiszki
- **Obsługa**:
  ```typescript
  if (!response.ok) {
    toast.error("Nie udało się zapisać fiszki. Spróbuj ponownie.");
    // Nie przechodzi do następnej fiszki
    return;
  }
  ```

#### Błąd logowania akcji (POST /api/ai/review-actions)
- **Przypadek**: Błąd podczas logowania akcji
- **Obsługa**:
  ```typescript
  // Logowanie akcji nie jest krytyczne
  // Fiszka została zapisana, więc można kontynuować
  if (!actionResponse.ok) {
    console.error("Failed to log review action");
    // Toast opcjonalny, nie blokuje procesu
  }
  ```

### 10.3 Edge Cases

#### Brak fiszek wygenerowanych
- **Przypadek**: AI zwróciło pustą tablicę fiszek
- **Obsługa**:
  ```typescript
  if (data.flashcards.length === 0) {
    toast.error("AI nie wygenerowało żadnych fiszek. Spróbuj z innym tekstem.");
    return; // nie przekierowuj do recenzji
  }
  ```

#### Utrata danych podczas recenzji
- **Przypadek**: Użytkownik odświeża stronę podczas recenzji
- **Obsługa**:
  - Zapisz stan recenzji w sessionStorage po każdej akcji
  - Przy inicjalizacji sprawdź sessionStorage
  - Zaproponuj wznowienie recenzji
  ```typescript
  useEffect(() => {
    const savedState = sessionStorage.getItem("review-state");
    if (savedState) {
      const shouldResume = confirm("Masz nieukończoną recenzję. Wznowić?");
      if (shouldResume) {
        setState(JSON.parse(savedState));
      } else {
        sessionStorage.removeItem("review-state");
      }
    }
  }, []);
  ```

#### Timeout podczas zapisywania fiszki
- **Przypadek**: Request trwa > 30s
- **Obsługa**:
  ```typescript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("/api/flashcards", {
      signal: controller.signal,
      ...
    });
  } catch (error) {
    if (error.name === "AbortError") {
      toast.error("Zapisywanie trwa zbyt długo. Sprawdź połączenie.");
    }
  } finally {
    clearTimeout(timeoutId);
  }
  ```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury routingu
1. Utwórz plik `src/pages/generate.astro` (formularz generowania)
2. Utwórz plik `src/pages/generate/review.astro` (widok recenzji)
3. Dodaj ochronę middleware (redirect niezalogowanych do `/login`)
4. Przetestuj routing: `/generate` i `/generate/review` powinny być dostępne tylko dla zalogowanych

### Krok 2: Implementacja komponentów pomocniczych
1. Utwórz `src/components/CharacterCounter.tsx`
   - Props: `current`, `max`, `min`
   - Logika kolorów (czerwony < min, zielony valid, czerwony > max)
   - Format: "X,XXX / 5,000 znaków"
   - aria-live="polite"

2. Utwórz `src/components/EstimatedCount.tsx`
   - Props: `textLength`
   - Formuła: `Math.max(1, Math.floor(textLength / 250))`
   - Format: "Szacowana liczba fiszek: ~X"

3. Utwórz `src/components/LoadingSpinner.tsx`
   - Props: `message?`
   - Spinner animation (użyj Tailwind lub Shadcn)
   - Domyślny message: "Ładowanie..."

### Krok 3: Implementacja formularza generowania
1. Utwórz `src/components/AIGenerateForm.tsx`
   - State: `text`, `selectedDeckId`, `isGenerating`, `error`
   - Struktura JSX:
     - Textarea z autofocus
     - CharacterCounter pod textarea
     - EstimatedCount pod licznikiem
     - DeckSelector (istniejący komponent)
     - Button "Generuj fiszki"
     - LoadingSpinner (conditional, podczas generowania)
   
2. Implementacja logiki walidacji:
   ```typescript
   const isValid = useMemo(() => {
     return text.length >= 100 && 
            text.length <= 5000 && 
            selectedDeckId !== null;
   }, [text, selectedDeckId]);
   ```

3. Implementacja handleSubmit:
   ```typescript
   const handleSubmit = async (e: FormEvent) => {
     e.preventDefault();
     
     if (!isValid) return;
     
     setIsGenerating(true);
     setError(null);
     
     try {
       const command: GenerateFlashcardsCommand = {
         text: text.trim(),
         language: "pl",
       };
       
       const response = await fetch("/api/ai/generate", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(command),
       });
       
       if (!response.ok) {
         // Obsługa błędów (patrz sekcja 10)
         handleApiError(response);
         return;
       }
       
       const data: GenerateFlashcardsResponseDTO = await response.json();
       
       // Zapisz w sessionStorage
       sessionStorage.setItem("generation-data", JSON.stringify({
         generationLogId: data.generation_log_id,
         flashcards: data.flashcards,
         deckId: selectedDeckId,
       }));
       
       // Przekieruj
       window.location.href = "/generate/review";
       
     } catch (error) {
       toast.error("Problem z połączeniem. Sprawdź internet.");
     } finally {
       setIsGenerating(false);
     }
   };
   ```

4. Integracja keyboard shortcut (Ctrl+Enter):
   ```typescript
   const handleKeyDown = (e: KeyboardEvent) => {
     if (e.ctrlKey && e.key === "Enter" && isValid) {
       handleSubmit(e);
     }
   };
   ```

5. Integruj formularz w `src/pages/generate.astro`:
   ```astro
   ---
   import Layout from "@/layouts/DashboardLayout.astro";
   import { AIGenerateForm } from "@/components/AIGenerateForm";
   ---
   <Layout title="Generuj fiszki z AI">
     <AIGenerateForm client:load />
   </Layout>
   ```

### Krok 4: Definicja typów dla recenzji
1. Dodaj nowe typy do `src/types.ts` lub utwórz `src/types/review.types.ts`:
   - `ReviewFlashcard`
   - `EditedFlashcard`
   - `ReviewState`
   - `ReviewStats`
   - `ReviewSummaryData`
   - `GenerateFormState`
   - `GenerateFormValidation`

### Krok 5: Implementacja custom hooks
1. Utwórz `src/components/hooks/useReviewState.ts`
   - Zarządzanie stanem recenzji
   - Akcje: accept, edit, reject, navigate
   - Computed values: stats, isComplete, currentFlashcard

2. Utwórz `src/components/hooks/useKeyboardShortcuts.ts`
   - Obsługa skrótów klawiszowych
   - Warunek: ignoruj gdy focus na input/textarea
   - Handlers dla: Enter, E, Delete, Tab, Shift+Tab, Esc

### Krok 6: Implementacja komponentów recenzji - podstawowe
1. Utwórz `src/components/ReviewProgress.tsx`
   - Props: `current`, `total`, `acceptedCount`, `rejectedCount`
   - Progress bar (Shadcn/ui)
   - Liczniki tekstowe

2. Utwórz `src/components/ReviewHeader.tsx`
   - Props: `selectedDeckId`, `onDeckSelect`, `currentIndex`, `total`, `acceptedCount`, `rejectedCount`
   - Tytuł "Recenzja wygenerowanych fiszek"
   - DeckSelector
   - Liczniki (aktualna/total, zaakceptowane, odrzucone)

3. Utwórz `src/components/FlashcardActionButtons.tsx`
   - Props: `onAccept`, `onEdit`, `onReject`, `isEditMode`, `disabled`
   - Trzy przyciski: Akceptuj (zielony), Edytuj (niebieski), Odrzuć (czerwony)
   - Button styling z Shadcn/ui

### Krok 7: Implementacja edycji fiszki
1. Utwórz `src/components/FlashcardEditMode.tsx`
   - Props: `originalFront`, `originalBack`, `onSave`, `onCancel`
   - State: `editedFront`, `editedBack`
   - Walidacja: 1-1000 znaków
   - Liczniki znaków
   - Input dla front, Textarea dla back
   - Przyciski: Zapisz, Anuluj
   - Keyboard: Enter = save, Esc = cancel

### Krok 8: Implementacja karty fiszki
1. Utwórz `src/components/FlashcardReviewCard.tsx`
   - Props: `flashcard`, `deckId`, `generationLogId`, `isActive`, `onAccept`, `onReject`, `onEdit`
   - State: `isEditMode`, `isLoading`
   - Toggle między display mode a edit mode
   - Display mode: FlashcardActionButtons
   - Edit mode: FlashcardEditMode
   
2. Implementacja handleAccept:
   ```typescript
   const handleAccept = async () => {
     if (!deckId) {
       toast.error("Wybierz talię");
       return;
     }
     
     setIsLoading(true);
     try {
       // 1. Utwórz fiszkę
       const createCommand: CreateFlashcardCommand = {
         deck_id: deckId,
         front: flashcard.front,
         back: flashcard.back,
         source: "ai",
       };
       
       const flashcardResponse = await fetch("/api/flashcards", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(createCommand),
       });
       
       if (!flashcardResponse.ok) {
         throw new Error("Failed to create flashcard");
       }
       
       const createdFlashcard: FlashcardDTO = await flashcardResponse.json();
       
       // 2. Zaloguj akcję
       const logCommand: LogAiReviewActionCommand = {
         generation_log_id: generationLogId,
         flashcard_id: createdFlashcard.id,
         action_type: "accepted",
         original_front: flashcard.front,
         original_back: flashcard.back,
       };
       
       await fetch("/api/ai/review-actions", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(logCommand),
       });
       
       // 3. Wywołaj callback
       onAccept(flashcard.id);
       toast.success("Fiszka zaakceptowana");
       
     } catch (error) {
       toast.error("Nie udało się zapisać fiszki");
     } finally {
       setIsLoading(false);
     }
   };
   ```

3. Implementacja handleEdit (podobna logika, action_type="edited")

4. Implementacja handleReject:
   ```typescript
   const handleReject = async () => {
     setIsLoading(true);
     try {
       // Tylko logowanie, bez tworzenia fiszki
       const logCommand: LogAiReviewActionCommand = {
         generation_log_id: generationLogId,
         flashcard_id: null,
         action_type: "rejected",
         original_front: flashcard.front,
         original_back: flashcard.back,
       };
       
       await fetch("/api/ai/review-actions", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(logCommand),
       });
       
       onReject(flashcard.id);
       toast.success("Fiszka odrzucona");
       
     } catch (error) {
       console.error("Failed to log rejection");
       // Nie blokuj procesu
       onReject(flashcard.id);
     } finally {
       setIsLoading(false);
     }
   };
   ```

### Krok 9: Implementacja podsumowania
1. Utwórz `src/components/ReviewSummary.tsx`
   - Props: `acceptedCount`, `editedCount`, `rejectedCount`, `deckId`, `deckName`, `onClose`, `onAddMore`
   - Wyświetl statystyki w czytelnym formacie
   - Dwa przyciski:
     - "Zamknij" → `onClose()` → redirect do `/decks/${deckId}`
     - "Dodaj więcej fiszek" → `onAddMore()` → redirect do `/generate`

### Krok 10: Implementacja głównego interfejsu recenzji
1. Utwórz `src/components/AIReviewInterface.tsx`
   - Props: `generationLogId`, `flashcards`, `initialDeckId?`
   - Użyj `useReviewState` hook
   - Użyj `useKeyboardShortcuts` hook
   
2. Struktura JSX:
   ```tsx
   return (
     <div className="space-y-6">
       <ReviewHeader
         selectedDeckId={state.selectedDeckId}
         onDeckSelect={setDeck}
         currentIndex={state.currentIndex}
         total={stats.total}
         acceptedCount={stats.accepted}
         rejectedCount={stats.rejected}
       />
       
       <ReviewProgress
         current={state.currentIndex + 1}
         total={stats.total}
         acceptedCount={stats.accepted}
         rejectedCount={stats.rejected}
       />
       
       {!isComplete ? (
         <FlashcardReviewCard
           flashcard={currentFlashcard}
           deckId={state.selectedDeckId!}
           generationLogId={state.generationLogId}
           isActive={true}
           onAccept={acceptFlashcard}
           onReject={rejectFlashcard}
           onEdit={editFlashcard}
         />
       ) : (
         <ReviewSummary
           acceptedCount={stats.accepted}
           editedCount={stats.edited}
           rejectedCount={stats.rejected}
           deckId={state.selectedDeckId!}
           deckName={deckName}
           onClose={() => window.location.href = `/decks/${state.selectedDeckId}`}
           onAddMore={() => window.location.href = "/generate"}
         />
       )}
     </div>
   );
   ```

3. Implementacja keyboard shortcuts:
   ```typescript
   useKeyboardShortcuts({
     onEnter: () => !isEditMode && acceptFlashcard(currentFlashcard.id),
     onEdit: () => !isEditMode && setEditMode(true),
     onDelete: () => !isEditMode && rejectFlashcard(currentFlashcard.id),
     onNext: () => navigateNext(),
     onPrev: () => navigatePrev(),
     onEscape: () => isEditMode && setEditMode(false),
   }, !state.isLoading);
   ```

4. Persistence do sessionStorage po każdej akcji:
   ```typescript
   useEffect(() => {
     sessionStorage.setItem("review-state", JSON.stringify(state));
   }, [state]);
   ```

### Krok 11: Integracja z Astro page
1. W `src/pages/generate/review.astro`:
   ```astro
   ---
   import Layout from "@/layouts/DashboardLayout.astro";
   import { AIReviewInterface } from "@/components/AIReviewInterface";
   
   // Sprawdź czy są dane w sessionStorage
   // W production można użyć URL params lub server-side props
   ---
   <Layout title="Recenzja fiszek">
     <AIReviewInterface client:load />
     
     <script>
       // Odczyt z sessionStorage i przekazanie do komponentu
       const data = sessionStorage.getItem("generation-data");
       if (!data) {
         window.location.href = "/generate";
       } else {
         const parsed = JSON.parse(data);
         // Przekaż do React komponentu przez window.__INITIAL_DATA__
         window.__INITIAL_DATA__ = parsed;
       }
     </script>
   </Layout>
   ```

2. Modyfikacja `AIReviewInterface.tsx` żeby odczytywać dane:
   ```typescript
   useEffect(() => {
     const initialData = (window as any).__INITIAL_DATA__;
     if (initialData) {
       // Inicjalizuj state z tych danych
     }
   }, []);
   ```

### Krok 12: Obsługa błędów i edge cases
1. Dodaj error boundaries w React komponentach
2. Dodaj timeout handling dla API calls
3. Dodaj retry logic dla failed requests (opcjonalne)
4. Dodaj komunikaty toast dla wszystkich błędów (patrz sekcja 10)

### Krok 13: Testowanie i optymalizacja
1. Testuj pełny flow: formularz → generowanie → recenzja → zapis
2. Testuj wszystkie edge cases:
   - Tekst < 100 i > 5000 znaków
   - Brak wybranej talii
   - Rate limiting (10 requestów/min)
   - Timeout AI
   - Błędy sieciowe
   - Odświeżenie strony podczas recenzji
   - Wszystkie keyboard shortcuts
3. Optymalizuj performance:
   - Memoizacja computed values
   - Debounce dla auto-save (jeśli będzie)
   - Lazy loading komponentów (opcjonalne)

### Krok 14: Dodanie pomocy użytkownika
1. Dodaj przycisk "?" w prawym górnym rogu obu widoków
2. Modal z listą skrótów klawiszowych:
   - Formularz: Ctrl+Enter = generuj
   - Recenzja: Enter = akceptuj, E = edytuj, Delete = odrzuć, Tab = następna, Shift+Tab = poprzednia, Esc = anuluj
3. Dodaj tooltips na przyciskach akcji (opcjonalne)

### Krok 15: Styling i responsywność
1. Użyj Tailwind CSS zgodnie z istniejącym design system
2. Wykorzystaj komponenty Shadcn/ui dla spójności
3. Testuj responsywność:
   - Mobile (320px+)
   - Tablet (768px+)
   - Desktop (1024px+)
4. Dodaj animacje:
   - Fade-in dla fiszek
   - Slide dla przejść między fiszkami
   - Loading spinners

### Krok 16: Finalne testy i deployment
1. Test E2E flow kilkukrotnie
2. Test accessibility (aria-labels, keyboard navigation, screen readers)
3. Test performance (Lighthouse)
4. Code review
5. Merge do main branch
6. Deploy

---

**Uwagi końcowe**:
- Wszystkie komponenty React powinny używać TypeScript
- Wszystkie API calls powinny mieć proper error handling
- Wszystkie formularze powinny mieć walidację frontend + backend
- Kod powinien być zgodny z praktykami z `.github/copilot-instructions.md`
- Używaj istniejących komponentów Shadcn/ui dla spójności (Button, Input, Textarea, Select, Dialog, etc.)
