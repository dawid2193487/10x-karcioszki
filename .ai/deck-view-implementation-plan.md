# Plan implementacji widoku Talii - Lista fiszek

## 1. Przegląd

Widok talii (`/decks/:id`) umożliwia przeglądanie i zarządzanie fiszkami w ramach konkretnej talii. Użytkownik może edytować nazwę talii, przeglądać listę fiszek z możliwością edycji inline, dodawać nowe fiszki manualnie, generować fiszki przez AI oraz rozpoczynać sesję nauki. Widok obsługuje paginację dla talii z dużą liczbą fiszek i zapewnia responsywny interfejs dla urządzeń mobilnych i desktopowych.

## 2. Routing widoku

**Ścieżka:** `/decks/:id`

**Typ strony:** Astro SSR (Server-Side Rendered)

**Plik:** `src/pages/decks/[id].astro`

**Layout:** `DashboardLayout.astro`

**Parametry URL:**
- `:id` - UUID talii (wymagany)
- `?page` - Numer strony paginacji (opcjonalny, domyślnie: 1)
- `?limit` - Liczba fiszek na stronę (opcjonalny, domyślnie: 20)

**Middleware:** Wymagana autentykacja użytkownika (sprawdzenie tokenu)

**Weryfikacja dostępu:** Backend weryfikuje czy talia należy do zalogowanego użytkownika (RLS w Supabase)

## 3. Struktura komponentów

```
src/pages/decks/[id].astro (SSR)
├── DashboardLayout.astro
    └── DeckViewContainer
        ├── DeckHeader.tsx (React - client-side)
        │   ├── BackButton
        │   ├── EditableDeckName.tsx (React)
        │   ├── DeckStats (inline)
        │   └── DeckActions.tsx (React)
        │       ├── Button (Dodaj fiszkę)
        │       ├── Button (Generuj AI)
        │       └── Button (Rozpocznij naukę)
        │
        ├── CreateFlashcardForm.tsx (React - conditional render)
        │   ├── Textarea (Front)
        │   ├── Textarea (Back)
        │   └── Button (Zapisz/Anuluj)
        │
        ├── FlashcardTable.astro (SSR/hybrid)
        │   └── FlashcardList
        │       └── FlashcardRow.tsx (React - each item)
        │           ├── EditableFlashcardCell.tsx (Front)
        │           ├── EditableFlashcardCell.tsx (Back)
        │           └── DeleteButton.tsx
        │
        ├── EmptyState.astro (conditional)
        │
        ├── Pagination.tsx (React)
        │   ├── PageControls
        │   ├── PageInfo
        │   └── LimitSelector.tsx
        │
        └── DeleteConfirmationDialog.tsx (React - modal)
            ├── Dialog (shadcn/ui)
            └── DialogContent
```

## 4. Szczegóły komponentów

### 4.1. DeckHeader.tsx (React)

**Opis:**
Komponent wyświetla nagłówek widoku talii zawierający przycisk powrotu, edytowalną nazwę talii, statystyki (liczba fiszek) oraz główne akcje (dodaj fiszkę, generuj AI, rozpocznij naukę).

**Główne elementy:**
- `<header>` - kontener nagłówka
- `<Button>` - przycisk powrotu (← Wstecz)
- `<EditableDeckName>` - komponent edytowalnej nazwy talii
- `<div>` - statystyki (liczba fiszek)
- `<DeckActions>` - kontener z przyciskami akcji
- `<HelpButton>` - przycisk pomocy (?)

**Obsługiwane interakcje:**
- Kliknięcie przycisku "Wstecz" → powrót do dashboardu (`/`)
- Kliknięcie przycisku "Dodaj fiszkę" → wyświetlenie formularza tworzenia fiszki
- Kliknięcie przycisku "Generuj AI" → przekierowanie do widoku generowania AI
- Kliknięcie przycisku "Rozpocznij naukę" → rozpoczęcie sesji nauki dla talii (jeśli są fiszki do powtórki)
- Kliknięcie przycisku "?" → wyświetlenie pomocy ze skrótami klawiszowymi

**Obsługiwana walidacja:**
- Przycisk "Rozpocznij naukę" jest nieaktywny gdy `due_count === 0`
- Przycisk "Generuj AI" jest zawsze aktywny

**Typy:**
- `DeckHeaderProps` - propsy komponentu
- `Deck` - typ danych talii (z API)

**Propsy:**
```typescript
interface DeckHeaderProps {
  deck: Deck;
  onAddFlashcard: () => void;
  onGenerateAI: () => void;
  onStartStudy: () => void;
  onDeckUpdate: (updatedDeck: Deck) => void;
}
```

### 4.2. EditableDeckName.tsx (React)

**Opis:**
Komponent umożliwiający inline edycję nazwy talii. Po kliknięciu na nazwę, tekst zamienia się w pole input z autofocus. Zmiany są zapisywane automatycznie po opuszczeniu pola (blur) lub naciśnięciu Enter.

**Główne elementy:**
- `<h1>` lub `<input>` w zależności od trybu edycji
- Visual feedback: border highlight podczas edycji
- Spinner → checkmark po zapisaniu

**Obsługiwane interakcje:**
- Kliknięcie na nazwę → włączenie trybu edycji
- Blur lub Enter → autosave i wyłączenie trybu edycji
- Esc → anulowanie edycji i przywrócenie poprzedniej nazwy

**Obsługiwana walidacja:**
- Nazwa talii: min 1 znak, max 100 znaków
- Nie może być pusta
- Wyświetlanie błędu walidacji przy próbie zapisu nieprawidłowej wartości

**Typy:**
- `EditableDeckNameProps`
- `UpdateDeckRequest` (DTO do API)
- `Deck` (response z API)

**Propsy:**
```typescript
interface EditableDeckNameProps {
  deckId: string;
  initialName: string;
  onUpdate: (newName: string) => void;
}
```

### 4.3. CreateFlashcardForm.tsx (React)

**Opis:**
Formularz do ręcznego tworzenia nowej fiszki. Wyświetlany po kliknięciu przycisku "Dodaj fiszkę". Zawiera dwa pola textarea (front i back) oraz przyciski zapisz/anuluj.

**Główne elementy:**
- `<form>` - kontener formularza
- `<Textarea>` (shadcn/ui) - pole "Przód" (front)
- `<Textarea>` (shadcn/ui) - pole "Tył" (back)
- `<Button>` - przycisk "Zapisz" (submit)
- `<Button>` - przycisk "Anuluj" (cancel)
- Liczniki znaków dla każdego pola

**Obsługiwane interakcje:**
- Wpisywanie w textarea → aktualizacja licznika znaków
- Enter w textarea → nowa linia (NIE submit)
- Ctrl+Enter → submit formularza
- Kliknięcie "Zapisz" → walidacja i wysłanie POST do API
- Kliknięcie "Anuluj" → zamknięcie formularza bez zapisu
- Esc → zamknięcie formularza

**Obsługiwana walidacja:**
- Front: wymagane, min 1 znak, max 1000 znaków
- Back: wymagane, min 1 znak, max 1000 znaków
- Przycisk "Zapisz" nieaktywny gdy walidacja nie przechodzi
- Wyświetlanie błędów walidacji pod polami

**Typy:**
- `CreateFlashcardFormProps`
- `CreateFlashcardRequest` (DTO)
- `Flashcard` (response)

**Propsy:**
```typescript
interface CreateFlashcardFormProps {
  deckId: string;
  onSuccess: (flashcard: Flashcard) => void;
  onCancel: () => void;
}
```

### 4.4. FlashcardRow.tsx (React)

**Opis:**
Komponent reprezentujący pojedynczą fiszkę w liście/tabeli. Umożliwia inline edycję pól front i back. Zawiera przycisk usuwania.

**Główne elementy:**
- Desktop: `<tr>` z trzema `<td>` (front, back, actions)
- Mobile: `<div>` z kartą
- `<EditableFlashcardCell>` dla front i back
- `<Button>` (delete icon)

**Obsługiwane interakcje:**
- Kliknięcie na tekst (front lub back) → włączenie trybu edycji
- Blur lub Enter → autosave
- Esc → anulowanie edycji
- Kliknięcie delete → wyświetlenie dialogu potwierdzenia

**Obsługiwana walidacja:**
- Front/Back: min 1 znak, max 1000 znaków
- Rollback przy błędzie zapisu

**Typy:**
- `FlashcardRowProps`
- `Flashcard`
- `UpdateFlashcardRequest` (DTO)

**Propsy:**
```typescript
interface FlashcardRowProps {
  flashcard: Flashcard;
  onUpdate: (id: string, updates: Partial<Flashcard>) => void;
  onDelete: (id: string) => void;
}
```

### 4.5. EditableFlashcardCell.tsx (React)

**Opis:**
Komponent reprezentujący edytowalną komórkę (front lub back fiszki). Obsługuje inline editing z autosave.

**Główne elementy:**
- `<div>` lub `<textarea>` w zależności od trybu
- Visual feedback: border highlight, spinner, checkmark
- Debounce 500ms dla autosave

**Obsługiwane interakcje:**
- Kliknięcie → włączenie trybu edycji, autofocus, select all
- Blur → autosave z debounce
- Enter → autosave i wyłączenie edycji
- Esc → anulowanie bez zapisu

**Obsługiwana walidacja:**
- Min 1 znak, max 1000 znaków
- Wyświetlanie błędu przy nieprawidłowej wartości

**Typy:**
- `EditableFlashcardCellProps`

**Propsy:**
```typescript
interface EditableFlashcardCellProps {
  value: string;
  flashcardId: string;
  field: 'front' | 'back';
  onSave: (flashcardId: string, field: string, value: string) => Promise<void>;
}
```

### 4.6. Pagination.tsx (React)

**Opis:**
Komponent paginacji umożliwiający nawigację między stronami oraz zmianę liczby elementów na stronę.

**Główne elementy:**
- `<nav>` - kontener paginacji
- `<Button>` - Previous
- Przyciski numerów stron (1, 2, 3, ...)
- `<Button>` - Next
- `<select>` lub `<DropdownMenu>` - wybór limitu (20, 50, 100)
- Info text: "Pokazuję X-Y z Z fiszek"

**Obsługiwane interakcje:**
- Kliknięcie Previous → poprzednia strona (jeśli nie pierwsza)
- Kliknięcie Next → następna strona (jeśli nie ostatnia)
- Kliknięcie numeru strony → przejście do strony
- Zmiana limitu → przejście do strony 1 z nowym limitem
- Po zmianie strony → scroll to top

**Obsługiwana walidacja:**
- Previous nieaktywny gdy `page === 1`
- Next nieaktywny gdy `page === totalPages`
- Limity: tylko 20, 50, 100

**Typy:**
- `PaginationProps`
- `PaginationInfo` (z API response)

**Propsy:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}
```

### 4.7. DeleteConfirmationDialog.tsx (React)

**Opis:**
Modal potwierdzający usunięcie fiszki. Wykorzystuje komponent Dialog z shadcn/ui.

**Główne elementy:**
- `<Dialog>` (shadcn/ui)
- `<DialogContent>`
- `<DialogHeader>` z tytułem
- `<DialogDescription>` z pytaniem potwierdzającym
- `<DialogFooter>` z przyciskami
- `<Button variant="destructive">` - Usuń
- `<Button variant="outline">` - Anuluj

**Obsługiwane interakcje:**
- Kliknięcie "Usuń" → wywołanie DELETE API i zamknięcie dialogu
- Kliknięcie "Anuluj" → zamknięcie dialogu bez akcji
- Kliknięcie poza dialogiem → zamknięcie (opcjonalnie)
- Esc → zamknięcie dialogu

**Obsługiwana walidacja:**
- Brak specyficznej walidacji

**Typy:**
- `DeleteConfirmationDialogProps`
- `Flashcard`

**Propsy:**
```typescript
interface DeleteConfirmationDialogProps {
  flashcard: Flashcard | null;
  isOpen: boolean;
  onConfirm: (flashcardId: string) => void;
  onCancel: () => void;
}
```

### 4.8. EmptyState.astro

**Opis:**
Komponent wyświetlany gdy talia jest pusta (brak fiszek). Zachęca użytkownika do dodania pierwszej fiszki lub wygenerowania przez AI.

**Główne elementy:**
- `<div>` - kontener z centrowaniem
- Ikona lub ilustracja
- Nagłówek: "Brak fiszek w talii"
- Opis: "Dodaj pierwszą fiszkę lub wygeneruj z AI"
- `<Button>` - Dodaj fiszkę
- `<Button>` - Generuj AI

**Obsługiwane interakcje:**
- Kliknięcie "Dodaj fiszkę" → wyświetlenie formularza
- Kliknięcie "Generuj AI" → przekierowanie do generatora

**Propsy:**
```typescript
interface EmptyStateProps {
  onAddFlashcard: () => void;
  onGenerateAI: () => void;
}
```

## 5. Typy

### 5.1. Typy encji (z database.types.ts)

```typescript
// Deck - typ zwracany przez GET /api/decks/:id
interface Deck {
  id: string; // UUID
  name: string; // 1-100 znaków
  flashcard_count: number;
  due_count: number;
  new_count: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Flashcard - typ zwracany przez GET /api/flashcards/:id
interface Flashcard {
  id: string; // UUID
  deck_id: string; // UUID
  deck_name: string; // Nazwa talii (z JOIN)
  front: string; // 1-1000 znaków
  back: string; // 1-1000 znaków
  source: 'ai' | 'manual';
  next_review_date: string; // ISO timestamp
  easiness_factor?: number; // Opcjonalne dla szczegółów
  interval?: number;
  repetitions?: number;
  last_reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}
```

### 5.2. DTO - Request Types

```typescript
// POST /api/flashcards
interface CreateFlashcardRequest {
  deck_id: string; // UUID, wymagany
  front: string; // 1-1000 znaków, wymagany
  back: string; // 1-1000 znaków, wymagany
  source: 'ai' | 'manual'; // wymagany
}

// PATCH /api/flashcards/:id
interface UpdateFlashcardRequest {
  front?: string; // 1-1000 znaków, opcjonalny
  back?: string; // 1-1000 znaków, opcjonalny
  // Co najmniej jedno pole musi być podane
}

// PATCH /api/decks/:id
interface UpdateDeckRequest {
  name?: string; // 1-100 znaków, opcjonalny
}

// GET /api/flashcards query params
interface ListFlashcardsParams {
  deck_id?: string; // UUID
  source?: 'ai' | 'manual';
  page?: number; // >= 1, domyślnie 1
  limit?: number; // >= 1, <= 100, domyślnie 20
}
```

### 5.3. DTO - Response Types

```typescript
// GET /api/flashcards
interface ListFlashcardsResponse {
  data: Flashcard[];
  pagination: PaginationInfo;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Error Response (wszystkie endpointy)
interface ApiErrorResponse {
  error: {
    code: string; // np. 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED'
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}
```

### 5.4. ViewModel Types (Frontend)

```typescript
// Stan widoku talii
interface DeckViewState {
  deck: Deck | null;
  flashcards: Flashcard[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  isCreatingFlashcard: boolean;
  flashcardToDelete: Flashcard | null;
}

// Stan formularza tworzenia fiszki
interface CreateFlashcardFormState {
  front: string;
  back: string;
  errors: {
    front?: string;
    back?: string;
  };
  isSubmitting: boolean;
}

// Stan inline edycji
interface InlineEditState {
  isEditing: boolean;
  value: string;
  originalValue: string;
  isSaving: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

### 6.1. Server-Side State (Astro SSR)

**Pobieranie danych początkowych:**
W pliku `src/pages/decks/[id].astro` wykonujemy SSR fetch:

```typescript
// Pobieranie danych talii
const deckResponse = await fetch(`http://localhost:3000/api/decks/${id}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Pobieranie fiszek
const flashcardsResponse = await fetch(
  `http://localhost:3000/api/flashcards?deck_id=${id}&page=${page}&limit=${limit}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

**Przekazywanie do komponentów:**
Dane są przekazywane jako propsy do głównego kontenera React.

### 6.2. Client-Side State (React)

**Custom Hook: `useDeckView`**

Hook zarządzający całym stanem widoku talii:

```typescript
interface UseDeckViewReturn {
  deck: Deck | null;
  flashcards: Flashcard[];
  pagination: PaginationInfo;
  isLoading: boolean;
  error: string | null;
  isCreatingFlashcard: boolean;
  flashcardToDelete: Flashcard | null;
  
  // Actions
  setIsCreatingFlashcard: (value: boolean) => void;
  handleCreateFlashcard: (data: CreateFlashcardRequest) => Promise<void>;
  handleUpdateFlashcard: (id: string, updates: UpdateFlashcardRequest) => Promise<void>;
  handleDeleteFlashcard: (id: string) => Promise<void>;
  handleUpdateDeck: (updates: UpdateDeckRequest) => Promise<void>;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
  setFlashcardToDelete: (flashcard: Flashcard | null) => void;
}

function useDeckView(initialDeck: Deck, initialFlashcards: Flashcard[], initialPagination: PaginationInfo): UseDeckViewReturn {
  // State
  const [deck, setDeck] = useState<Deck | null>(initialDeck);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<Flashcard | null>(null);
  
  // Actions implementation...
  
  return {
    deck,
    flashcards,
    pagination,
    isLoading,
    error,
    isCreatingFlashcard,
    flashcardToDelete,
    setIsCreatingFlashcard,
    handleCreateFlashcard,
    handleUpdateFlashcard,
    handleDeleteFlashcard,
    handleUpdateDeck,
    handlePageChange,
    handleLimitChange,
    setFlashcardToDelete,
  };
}
```

**Custom Hook: `useInlineEdit`**

Hook do obsługi inline edycji z debounce:

```typescript
interface UseInlineEditReturn {
  isEditing: boolean;
  value: string;
  isSaving: boolean;
  error: string | null;
  startEdit: () => void;
  cancelEdit: () => void;
  handleChange: (newValue: string) => void;
  handleSave: () => Promise<void>;
}

function useInlineEdit(
  initialValue: string,
  onSave: (value: string) => Promise<void>,
  debounceMs: number = 500
): UseInlineEditReturn {
  // Implementation...
}
```

**Custom Hook: `useAutosave`** (już istnieje w projekcie)

Hook obsługujący autosave z debounce - wykorzystany w `EditableFlashcardCell`.

### 6.3. Optimistic Updates

Dla lepszego UX implementujemy optimistic updates:

1. **Tworzenie fiszki:**
   - Natychmiastowe dodanie do listy (z tymczasowym ID)
   - Wysłanie POST do API
   - Zamiana tymczasowego ID na rzeczywiste
   - Rollback przy błędzie

2. **Aktualizacja fiszki:**
   - Natychmiastowa aktualizacja w liście
   - Wysłanie PATCH do API
   - Rollback przy błędzie

3. **Usuwanie fiszki:**
   - Natychmiastowe usunięcie z listy
   - Wysłanie DELETE do API
   - Przywrócenie przy błędzie

## 7. Integracja API

### 7.1. GET /api/decks/:id

**Kiedy:** SSR (server-side) przy ładowaniu strony

**Request:**
```typescript
GET /api/decks/:id
Headers: {
  'Authorization': 'Bearer <token>'
}
```

**Response (200 OK):**
```typescript
{
  id: string,
  name: string,
  flashcard_count: number,
  due_count: number,
  new_count: number,
  created_at: string,
  updated_at: string
}
```

**Typ żądania:** Brak body

**Typ odpowiedzi:** `Deck`

**Obsługa błędów:**
- 401: Przekierowanie do `/login`
- 404: Wyświetlenie strony 404 "Talia nie istnieje"

### 7.2. GET /api/flashcards

**Kiedy:** 
- SSR przy ładowaniu strony
- Client-side przy zmianie strony/limitu

**Request:**
```typescript
GET /api/flashcards?deck_id=<uuid>&page=<number>&limit=<number>
Headers: {
  'Authorization': 'Bearer <token>'
}
```

**Query parameters:**
- `deck_id`: UUID (wymagany)
- `page`: number >= 1 (opcjonalny, domyślnie 1)
- `limit`: number >= 1, <= 100 (opcjonalny, domyślnie 20)

**Response (200 OK):**
```typescript
{
  data: Flashcard[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    total_pages: number
  }
}
```

**Typ żądania:** Query params `ListFlashcardsParams`

**Typ odpowiedzi:** `ListFlashcardsResponse`

### 7.3. POST /api/flashcards

**Kiedy:** Zapisywanie nowej fiszki z formularza

**Request:**
```typescript
POST /api/flashcards
Headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
Body: {
  deck_id: string,
  front: string,
  back: string,
  source: 'manual'
}
```

**Response (201 Created):**
```typescript
{
  id: string,
  deck_id: string,
  front: string,
  back: string,
  source: string,
  next_review_date: string,
  easiness_factor: number,
  interval: number,
  repetitions: number,
  last_reviewed_at: null,
  created_at: string,
  updated_at: string
}
```

**Typ żądania:** `CreateFlashcardRequest`

**Typ odpowiedzi:** `Flashcard`

**Walidacja:**
- `deck_id`: UUID, wymagany, musi istnieć i należeć do użytkownika
- `front`: string, 1-1000 znaków, wymagany
- `back`: string, 1-1000 znaków, wymagany
- `source`: 'manual', wymagany

**Obsługa błędów:**
- 400: Wyświetlenie błędów walidacji
- 401: Przekierowanie do logowania
- 404: "Talia nie istnieje"

### 7.4. PATCH /api/flashcards/:id

**Kiedy:** Autosave podczas inline editing

**Request:**
```typescript
PATCH /api/flashcards/:id
Headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
Body: {
  front?: string,
  back?: string
}
```

**Response (200 OK):**
```typescript
{
  id: string,
  deck_id: string,
  front: string,
  back: string,
  source: string,
  next_review_date: string,
  created_at: string,
  updated_at: string
}
```

**Typ żądania:** `UpdateFlashcardRequest`

**Typ odpowiedzi:** `Flashcard`

**Walidacja:**
- Co najmniej jedno pole (front lub back) musi być podane
- `front`: string, 1-1000 znaków (jeśli podany)
- `back`: string, 1-1000 znaków (jeśli podany)

**Obsługa błędów:**
- 400: Rollback + wyświetlenie błędu walidacji
- 401: Przekierowanie do logowania
- 404: "Fiszka nie istnieje"

### 7.5. DELETE /api/flashcards/:id

**Kiedy:** Potwierdzenie usunięcia w dialogu

**Request:**
```typescript
DELETE /api/flashcards/:id
Headers: {
  'Authorization': 'Bearer <token>'
}
```

**Response (204 No Content):** Brak body

**Typ żądania:** Brak body

**Typ odpowiedzi:** Brak (204)

**Obsługa błędów:**
- 401: Przekierowanie do logowania
- 404: "Fiszka nie istnieje" (optimistic update już usunął, więc toast informacyjny)

### 7.6. PATCH /api/decks/:id

**Kiedy:** Edycja nazwy talii (autosave)

**Request:**
```typescript
PATCH /api/decks/:id
Headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
Body: {
  name?: string
}
```

**Response (200 OK):**
```typescript
{
  id: string,
  name: string,
  flashcard_count: number,
  due_count: number,
  new_count: number,
  created_at: string,
  updated_at: string
}
```

**Typ żądania:** `UpdateDeckRequest`

**Typ odpowiedzi:** `Deck`

**Walidacja:**
- `name`: string, 1-100 znaków, niepuste

## 8. Interakcje użytkownika

### 8.1. Edycja nazwy talii

**Trigger:** Kliknięcie na nazwę talii w nagłówku

**Flow:**
1. Użytkownik klika na nazwę talii
2. Tekst zamienia się w pole input z autofocus i selected text
3. Użytkownik edytuje nazwę
4. Użytkownik naciska Enter lub klika poza pole (blur)
5. System waliduje nazwę (1-100 znaków)
6. Jeśli walidacja OK: wyświetla spinner, wysyła PATCH do API
7. Po sukcesie: wyświetla checkmark, wraca do trybu wyświetlania
8. Jeśli błąd: wyświetla toast z błędem, rollback do poprzedniej wartości

**Keyboard shortcuts:**
- Enter → zapisz i wyjdź z edycji
- Esc → anuluj i przywróć poprzednią wartość

**Oczekiwany rezultat:**
- Zaktualizowana nazwa talii w nagłówku
- Toast z potwierdzeniem "Nazwa talii została zaktualizowana"
- Zaktualizowana wartość `updated_at`

### 8.2. Dodawanie nowej fiszki

**Trigger:** Kliknięcie przycisku "Dodaj fiszkę"

**Flow:**
1. Użytkownik klika "Dodaj fiszkę" w nagłówku lub w EmptyState
2. Wyświetla się formularz CreateFlashcardForm (inline lub jako modal)
3. Użytkownik wypełnia pola "Przód" i "Tył"
4. System wyświetla licznik znaków (X/1000) pod każdym polem
5. Przycisk "Zapisz" jest aktywny gdy oba pola mają 1-1000 znaków
6. Użytkownik klika "Zapisz" lub naciska Ctrl+Enter
7. System waliduje dane
8. Jeśli OK: wyświetla spinner, wysyła POST do API
9. Po sukcesie: 
   - Optimistic update - dodaje fiszkę do listy natychmiast
   - Zamyka formularz
   - Wyświetla toast "Fiszka została utworzona"
   - Aktualizuje licznik fiszek w nagłówku
10. Jeśli błąd: wyświetla toast z błędem, nie zamyka formularza

**Keyboard shortcuts:**
- Enter w textarea → nowa linia (NIE submit)
- Ctrl+Enter → submit formularza
- Esc → anuluj i zamknij formularz

**Oczekiwany rezultat:**
- Nowa fiszka pojawia się na liście
- Zaktualizowana liczba fiszek w nagłówku
- Formularz jest zamknięty i wyczyszczony

### 8.3. Inline edycja fiszki

**Trigger:** Kliknięcie na tekst fiszki (front lub back)

**Flow:**
1. Użytkownik klika na pole "Przód" lub "Tył" fiszki
2. Tekst zamienia się w textarea z autofocus i selected text
3. Pojawia się border highlight podczas edycji
4. Użytkownik edytuje treść
5. Po 500ms od ostatniej zmiany (debounce) lub blur/Enter:
   - System waliduje treść (1-1000 znaków)
   - Jeśli OK: wyświetla spinner, wysyła PATCH do API
   - Po sukcesie: wyświetla checkmark, wraca do trybu wyświetlania
   - Jeśli błąd: wyświetla toast, rollback do poprzedniej wartości
6. Esc → anuluj edycję i przywróć poprzednią wartość

**Ograniczenia:**
- Tylko jedna fiszka może być edytowana na raz
- Próba edycji drugiej fiszki → automatyczny blur pierwszej (autosave)

**Keyboard shortcuts:**
- Enter → zapisz i wyjdź z edycji
- Esc → anuluj i przywróć poprzednią wartość

**Oczekiwany rezultat:**
- Zaktualizowana treść fiszki
- Zaktualizowana wartość `updated_at`
- Toast z potwierdzeniem (opcjonalnie)

### 8.4. Usuwanie fiszki

**Trigger:** Kliknięcie przycisku usuwania (ikona kosza)

**Flow:**
1. Użytkownik klika ikonę kosza przy fiszce
2. Wyświetla się DeleteConfirmationDialog
3. Dialog wyświetla:
   - Tytuł: "Usuń fiszkę"
   - Opis: "Czy na pewno chcesz usunąć tę fiszkę? Historia powtórek zostanie również usunięta."
   - Podgląd: Front i Back fiszki
   - Przyciski: "Anuluj" i "Usuń"
4. Użytkownik klika "Usuń"
5. System:
   - Optimistic update - usuwa fiszkę z listy natychmiast
   - Wysyła DELETE do API
   - Po sukcesie: wyświetla toast "Fiszka została usunięta"
   - Aktualizuje licznik fiszek
   - Jeśli to była ostatnia fiszka na stronie: przekierowanie do poprzedniej strony
6. Jeśli błąd: przywraca fiszkę, wyświetla toast z błędem

**Keyboard shortcuts:**
- Esc → zamknij dialog bez usuwania
- Enter → potwierdź usunięcie

**Oczekiwany rezultat:**
- Fiszka znika z listy
- Zaktualizowana liczba fiszek
- Toast z potwierdzeniem

### 8.5. Paginacja

**Trigger:** Kliknięcie przycisku Previous/Next lub numeru strony

**Flow:**
1. Użytkownik klika Previous/Next/numer strony
2. System:
   - Aktualizuje URL query param `?page=X`
   - Wyświetla loading state
   - Wysyła GET /api/flashcards z nową stroną
   - Po otrzymaniu danych: aktualizuje listę fiszek
   - Scrolluje do góry strony
   - Ukrywa loading state
3. Jeśli błąd: wyświetla toast, zostaje na aktualnej stronie

**Zmiana limitu:**
1. Użytkownik wybiera nowy limit z dropdown (20/50/100)
2. System:
   - Aktualizuje URL query params `?page=1&limit=X`
   - Resetuje stronę do 1
   - Wysyła GET /api/flashcards
   - Aktualizuje listę

**Oczekiwany rezultat:**
- Załadowana nowa strona z fiszkami
- Zaktualizowane kontrolki paginacji
- Scroll na górę strony

### 8.6. Rozpoczęcie nauki

**Trigger:** Kliknięcie przycisku "Rozpocznij naukę"

**Flow:**
1. Użytkownik klika "Rozpocznij naukę"
2. System sprawdza `due_count > 0`
3. Jeśli OK: przekierowanie do `/study-sessions` z `deck_id` w query param lub state
4. Jeśli `due_count === 0`: przycisk jest nieaktywny, tooltip "Brak fiszek do powtórki"

**Oczekiwany rezultat:**
- Przekierowanie do widoku sesji nauki
- Rozpoczęcie sesji z fiszkami z aktualnej talii

### 8.7. Generowanie AI

**Trigger:** Kliknięcie przycisku "Generuj AI"

**Flow:**
1. Użytkownik klika "Generuj AI"
2. System przekierowuje do widoku generowania AI
3. W widoku AI: deck_id jest pre-selected jako talia docelowa

**Oczekiwany rezultat:**
- Przekierowanie do widoku generowania AI
- Pre-selected talia docelowa

## 9. Warunki i walidacja

### 9.1. Walidacja nazwy talii (EditableDeckName)

**Warunki:**
- Minimalna długość: 1 znak
- Maksymalna długość: 100 znaków
- Nie może być pusta (tylko białe znaki)

**Komunikaty błędów:**
- Pusta: "Nazwa talii nie może być pusta"
- Za długa: "Nazwa talii nie może przekraczać 100 znaków"

**Wpływ na UI:**
- Błąd walidacji → input z czerwonym borderem
- Błąd walidacji → komunikat błędu pod inputem
- Nieprawidłowa wartość → przycisk zapisz nieaktywny (jeśli explicit save button)
- Rollback do poprzedniej wartości przy błędzie API

### 9.2. Walidacja fiszki - pole Front/Back (CreateFlashcardForm, EditableFlashcardCell)

**Warunki:**
- Minimalna długość: 1 znak
- Maksymalna długość: 1000 znaków
- Wymagane (w przypadku tworzenia)

**Komunikaty błędów:**
- Puste (create): "To pole jest wymagane"
- Za długie: "Treść nie może przekraczać 1000 znaków"

**Wpływ na UI:**
- Licznik znaków: `{current}/1000` - czerwony gdy > 1000
- Błąd walidacji → textarea z czerwonym borderem
- Błąd walidacji → komunikat pod polem
- Przycisk "Zapisz" nieaktywny gdy walidacja nie przechodzi
- Inline edit: rollback przy błędzie

### 9.3. Walidacja paginacji

**Warunki:**
- `page`: >= 1, liczba całkowita
- `limit`: >= 1, <= 100, wartości: 20, 50, 100
- `total_pages`: obliczane na podstawie `total` i `limit`

**Komunikaty błędów:**
- Błędna strona z URL → domyślnie page = 1
- Błędny limit z URL → domyślnie limit = 20

**Wpływ na UI:**
- Previous nieaktywny gdy `page === 1`
- Next nieaktywny gdy `page === total_pages`
- Brak fiszek → info "Brak fiszek do wyświetlenia"

### 9.4. Warunki dostępności akcji

**"Rozpocznij naukę" aktywny gdy:**
- `deck.due_count > 0`

**"Rozpocznij naukę" nieaktywny gdy:**
- `deck.due_count === 0`
- Tooltip: "Brak fiszek do powtórki"

**"Zapisz" (create form) aktywny gdy:**
- `front.length >= 1 && front.length <= 1000`
- `back.length >= 1 && back.length <= 1000`
- `!isSubmitting`

**Delete button (każda fiszka):**
- Zawsze aktywny (walidacja następuje po kliknięciu)

### 9.5. Walidacja źródła fiszki

**Warunki:**
- `source` musi być 'manual' przy ręcznym tworzeniu
- `source` musi być 'ai' przy akceptacji z AI review

**Wpływ na UI:**
- Brak bezpośredniego wpływu - source jest automatycznie ustawiane
- Możliwe wyświetlanie ikony/badge AI vs Manual w przyszłości

## 10. Obsługa błędów

### 10.1. Błędy ładowania strony (SSR)

**Scenariusze:**
1. **401 Unauthorized** - brak tokenu lub nieprawidłowy token
   - Przekierowanie do `/login`
   - Query param: `?redirect=/decks/:id`

2. **404 Not Found** - talia nie istnieje lub nie należy do użytkownika
   - Wyświetlenie strony 404 z komunikatem "Talia nie istnieje"
   - Link powrotny do dashboardu

3. **500 Server Error** - błąd serwera podczas pobierania danych
   - Wyświetlenie strony błędu z komunikatem "Nie udało się załadować talii"
   - Przycisk "Spróbuj ponownie" - reload strony

### 10.2. Błędy tworzenia fiszki

**Scenariusze:**
1. **400 Validation Error** - nieprawidłowe dane
   - Wyświetlenie komunikatów błędów pod polami formularza
   - Utrzymanie formularza otwartego z wprowadzonymi danymi
   - Focus na pierwszym polu z błędem

2. **404 Deck Not Found** - talia została usunięta
   - Toast: "Talia nie istnieje. Przekierowuję do dashboardu..."
   - Przekierowanie do `/` po 2 sekundach

3. **500 Server Error**
   - Toast: "Nie udało się utworzyć fiszki. Spróbuj ponownie."
   - Przycisk "Spróbuj ponownie" w toaście
   - Formularz pozostaje otwarty

### 10.3. Błędy edycji fiszki (inline)

**Scenariusze:**
1. **400 Validation Error** - nieprawidłowe dane
   - Rollback do poprzedniej wartości
   - Toast: "Treść fiszki musi mieć od 1 do 1000 znaków"
   - Wyłączenie trybu edycji

2. **404 Flashcard Not Found** - fiszka została usunięta
   - Rollback
   - Toast: "Fiszka nie istnieje. Odświeżam listę..."
   - Przeładowanie listy fiszek

3. **500 Server Error**
   - Rollback do poprzedniej wartości
   - Toast: "Nie udało się zapisać zmian. Spróbuj ponownie."
   - Wyłączenie trybu edycji

### 10.4. Błędy usuwania fiszki

**Scenariusze:**
1. **404 Flashcard Not Found** - fiszka już nie istnieje
   - Optimistic update już usunął z UI
   - Toast informacyjny: "Fiszka została usunięta"
   - Kontynuacja (brak akcji)

2. **500 Server Error**
   - Rollback - przywrócenie fiszki do listy
   - Toast: "Nie udało się usunąć fiszki. Spróbuj ponownie."
   - Zamknięcie dialogu

### 10.5. Błędy paginacji

**Scenariusze:**
1. **Strona poza zakresem** (np. ?page=999 gdy total_pages=3)
   - Przekierowanie do page=1
   - Toast: "Nieprawidłowy numer strony"

2. **Błąd ładowania strony**
   - Zostanie na aktualnej stronie
   - Toast: "Nie udało się załadować fiszek. Spróbuj ponownie."
   - Przycisk retry

3. **Network error**
   - Toast: "Brak połączenia z internetem"
   - Przycisk retry

### 10.6. Edge cases

1. **Usunięcie ostatniej fiszki na stronie**
   - Jeśli `page > 1` → przekierowanie do `page - 1`
   - Jeśli `page === 1` → wyświetlenie EmptyState

2. **Próba edycji dwóch fiszek jednocześnie**
   - Automatyczny blur pierwszej fiszki (autosave)
   - Rozpoczęcie edycji drugiej

3. **Talia pusta (0 fiszek)**
   - Wyświetlenie EmptyState
   - Przyciski: "Dodaj fiszkę" i "Generuj AI"
   - Ukrycie tabeli i paginacji

4. **Bardzo długi tekst w fiszce**
   - Ograniczenie wysokości komórki (max-height)
   - "Show more/less" button lub tooltip przy hover

5. **Konflikt wersji** (użytkownik edytuje starą wersję)
   - Brak obsługi w MVP - last write wins
   - W przyszłości: conflict resolution UI

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików i podstawowego routingu

**Zadania:**
1. Utworzyć plik `src/pages/decks/[id].astro`
2. Dodać podstawowy layout z `DashboardLayout.astro`
3. Zaimplementować pobieranie parametru `id` z URL
4. Dodać podstawową strukturę HTML strony
5. Skonfigurować prerendering (SSR): `export const prerender = false`

**Pliki do utworzenia:**
- `src/pages/decks/[id].astro`

**Oczekiwany rezultat:**
- Strona dostępna pod `/decks/:id`
- Wyświetla podstawowy layout z DashboardLayout

### Krok 2: Implementacja SSR - pobieranie danych talii i fiszek

**Zadania:**
1. W pliku `[id].astro` dodać fetch do `GET /api/decks/:id`
2. Dodać fetch do `GET /api/flashcards?deck_id=:id&page=1&limit=20`
3. Zaimplementować obsługę błędów (401, 404, 500)
4. Dodać przekierowania przy błędach
5. Pobrać query params `page` i `limit` z URL
6. Przekazać dane jako propsy do komponentów React

**Wymagane typy:**
- `Deck`
- `ListFlashcardsResponse`

**Oczekiwany rezultat:**
- Dane talii i fiszek pobierane podczas SSR
- Obsługa błędów autentykacji i not found
- Dane przekazane do komponentów

### Krok 3: Implementacja komponentu DeckHeader

**Zadania:**
1. Utworzyć plik `src/components/DeckHeader.tsx`
2. Zaimplementować strukturę HTML nagłówka
3. Dodać przycisk "Wstecz" z linkiem do `/`
4. Dodać statystyki talii (liczba fiszek)
5. Dodać przyciski akcji (Dodaj fiszkę, Generuj AI, Rozpocznij naukę)
6. Zaimplementować warunek dla przycisku "Rozpocznij naukę" (`due_count > 0`)
7. Dodać przycisk pomocy (?)
8. Dodać style Tailwind

**Pliki do utworzenia:**
- `src/components/DeckHeader.tsx`

**Propsy:**
```typescript
interface DeckHeaderProps {
  deck: Deck;
  onAddFlashcard: () => void;
  onGenerateAI: () => void;
  onStartStudy: () => void;
}
```

**Oczekiwany rezultat:**
- Nagłówek wyświetla nazwę talii i statystyki
- Przyciski akcji są funkcjonalne
- Przycisk "Rozpocznij naukę" nieaktywny gdy brak fiszek do powtórki

### Krok 4: Implementacja komponentu EditableDeckName

**Zadania:**
1. Utworzyć plik `src/components/EditableDeckName.tsx`
2. Zaimplementować state dla trybu edycji (`isEditing`)
3. Dodać obsługę kliknięcia → włączenie edycji
4. Zaimplementować autofocus i select all przy włączeniu edycji
5. Dodać obsługę Enter → zapisz, Esc → anuluj
6. Zaimplementować blur → autosave
7. Dodać walidację (1-100 znaków)
8. Zaimplementować wywołanie PATCH `/api/decks/:id`
9. Dodać visual feedback (spinner, checkmark)
10. Dodać obsługę błędów (rollback, toast)

**Pliki do utworzenia:**
- `src/components/EditableDeckName.tsx`

**Propsy:**
```typescript
interface EditableDeckNameProps {
  deckId: string;
  initialName: string;
  onUpdate: (newName: string) => void;
}
```

**Zależności:**
- `useState`, `useRef` (React)
- Fetch do `PATCH /api/decks/:id`
- Toast notifications (np. `react-hot-toast` lub implementacja własna)

**Oczekiwany rezultat:**
- Nazwa talii edytowalna inline
- Autosave po blur lub Enter
- Walidacja i obsługa błędów

### Krok 5: Integracja EditableDeckName w DeckHeader

**Zadania:**
1. W `DeckHeader.tsx` zastąpić statyczny nagłówek komponentem `EditableDeckName`
2. Przekazać propsy: `deckId`, `initialName`, `onUpdate`
3. Zaimplementować handler `onUpdate` do aktualizacji lokalnego stanu

**Oczekiwany rezultat:**
- Edytowalna nazwa talii w nagłówku
- Synchronizacja stanu po aktualizacji

### Krok 6: Implementacja komponentu FlashcardRow

**Zadania:**
1. Utworzyć plik `src/components/FlashcardRow.tsx`
2. Zaimplementować strukturę HTML (desktop: `<tr>`, mobile: `<div>`)
3. Dodać dwa komponenty `EditableFlashcardCell` dla front i back
4. Dodać przycisk usuwania z ikoną kosza
5. Dodać responsive styles (desktop table row, mobile card)
6. Zaimplementować handlery `onUpdate` i `onDelete`

**Pliki do utworzenia:**
- `src/components/FlashcardRow.tsx`

**Propsy:**
```typescript
interface FlashcardRowProps {
  flashcard: Flashcard;
  onUpdate: (id: string, updates: Partial<Flashcard>) => void;
  onDelete: (id: string) => void;
}
```

**Oczekiwany rezultat:**
- Pojedyncza fiszka wyświetlana jako wiersz tabeli (desktop) lub karta (mobile)
- Edytowalne pola front i back
- Przycisk usuwania

### Krok 7: Implementacja komponentu EditableFlashcardCell

**Zadania:**
1. Utworzyć plik `src/components/EditableFlashcardCell.tsx`
2. Zaimplementować state dla trybu edycji
3. Dodać obsługę kliknięcia → włączenie edycji (autofocus, select all)
4. Wykorzystać hook `useAutosave` (jeśli istnieje) lub zaimplementować debounce
5. Dodać walidację (1-1000 znaków)
6. Zaimplementować wywołanie PATCH `/api/flashcards/:id`
7. Dodać visual feedback (border highlight, spinner, checkmark)
8. Dodać obsługę Enter → zapisz, Esc → anuluj
9. Dodać obsługę błędów (rollback)

**Pliki do utworzenia:**
- `src/components/EditableFlashcardCell.tsx`

**Propsy:**
```typescript
interface EditableFlashcardCellProps {
  value: string;
  flashcardId: string;
  field: 'front' | 'back';
  onSave: (flashcardId: string, field: string, value: string) => Promise<void>;
}
```

**Zależności:**
- Hook `useAutosave` (src/components/hooks/useAutosave.ts)
- Fetch do `PATCH /api/flashcards/:id`

**Oczekiwany rezultat:**
- Edytowalna komórka z inline editing
- Autosave z debounce
- Walidacja i feedback

### Krok 8: Implementacja custom hook useDeckView

**Zadania:**
1. Utworzyć plik `src/components/hooks/useDeckView.ts`
2. Zaimplementować state management dla całego widoku:
   - `deck`, `flashcards`, `pagination`
   - `isLoading`, `error`
   - `isCreatingFlashcard`, `flashcardToDelete`
3. Zaimplementować handlery akcji:
   - `handleCreateFlashcard` - POST do API, optimistic update
   - `handleUpdateFlashcard` - PATCH do API, optimistic update
   - `handleDeleteFlashcard` - DELETE do API, optimistic update
   - `handleUpdateDeck` - PATCH do API
   - `handlePageChange` - update URL, fetch new page
   - `handleLimitChange` - update URL, fetch with new limit
4. Dodać obsługę błędów z rollback dla optimistic updates
5. Dodać toast notifications

**Pliki do utworzenia:**
- `src/components/hooks/useDeckView.ts`

**Oczekiwany rezultat:**
- Centralny hook zarządzający stanem widoku
- Optimistic updates z rollback
- Obsługa wszystkich akcji użytkownika

### Krok 9: Implementacja komponentu CreateFlashcardForm

**Zadania:**
1. Utworzyć plik `src/components/CreateFlashcardForm.tsx`
2. Zaimplementować formularz z dwoma polami textarea (front, back)
3. Dodać liczniki znaków (X/1000)
4. Zaimplementować walidację (1-1000 znaków, oba wymagane)
5. Dodać przyciski "Zapisz" i "Anuluj"
6. Zaimplementować keyboard shortcuts (Ctrl+Enter → submit, Esc → cancel)
7. Dodać obsługę submitu - wywołanie `onSuccess` z danymi
8. Dodać visual feedback (spinner podczas zapisu)
9. Dodać obsługę błędów walidacji (wyświetlanie pod polami)

**Pliki do utworzenia:**
- `src/components/CreateFlashcardForm.tsx`

**Propsy:**
```typescript
interface CreateFlashcardFormProps {
  deckId: string;
  onSuccess: (flashcard: Flashcard) => void;
  onCancel: () => void;
}
```

**Komponenty shadcn/ui:**
- `<Textarea>`
- `<Button>`
- `<Label>`

**Oczekiwany rezultat:**
- Funkcjonalny formularz tworzenia fiszki
- Walidacja i feedback
- Keyboard shortcuts

### Krok 10: Implementacja komponentu FlashcardTable

**Zadania:**
1. Utworzyć plik `src/components/FlashcardTable.astro`
2. Zaimplementować strukturę tabeli (desktop) i listy kart (mobile)
3. Dodać nagłówki kolumn (Przód, Tył, Akcje)
4. Renderować listę `FlashcardRow` komponentów
5. Dodać conditional rendering - gdy brak fiszek → EmptyState
6. Dodać responsive styles (desktop table, mobile cards)

**Pliki do utworzenia:**
- `src/components/FlashcardTable.astro`

**Propsy:**
```typescript
interface FlashcardTableProps {
  flashcards: Flashcard[];
  onUpdate: (id: string, updates: Partial<Flashcard>) => void;
  onDelete: (id: string) => void;
}
```

**Oczekiwany rezultat:**
- Responsywna tabela/lista fiszek
- Renderowanie FlashcardRow dla każdej fiszki
- EmptyState gdy brak fiszek

### Krok 11: Implementacja komponentu EmptyState

**Zadania:**
1. Utworzyć plik `src/components/EmptyState.astro` (lub przenieść istniejący)
2. Dodać wariację dla pustej talii
3. Wyświetlić komunikat "Brak fiszek w talii"
4. Dodać opis "Dodaj pierwszą fiszkę lub wygeneruj z AI"
5. Dodać przyciski "Dodaj fiszkę" i "Generuj AI"
6. Dodać ilustrację lub ikonę

**Pliki do utworzenia/edycji:**
- `src/components/EmptyState.astro`

**Propsy:**
```typescript
interface EmptyStateProps {
  type?: 'deck' | 'general';
  onAddFlashcard?: () => void;
  onGenerateAI?: () => void;
}
```

**Oczekiwany rezultat:**
- Przyjazny komunikat dla pustej talii
- Zachęta do akcji

### Krok 12: Implementacja komponentu Pagination

**Zadania:**
1. Utworzyć plik `src/components/Pagination.tsx`
2. Zaimplementować kontrolki Previous/Next
3. Dodać przyciski numerów stron (z elipsami dla dużej liczby)
4. Zaimplementować dropdown wyboru limitu (20, 50, 100)
5. Dodać info text "Pokazuję X-Y z Z fiszek"
6. Zaimplementować handlery `onPageChange` i `onLimitChange`
7. Dodać warunki disabled dla Previous (page === 1) i Next (page === totalPages)
8. Dodać styles Tailwind

**Pliki do utworzenia:**
- `src/components/Pagination.tsx`

**Propsy:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}
```

**Komponenty shadcn/ui:**
- `<Button>`
- `<DropdownMenu>` (dla limit selector)

**Oczekiwany rezultat:**
- Funkcjonalna paginacja
- Wybór limitu
- Informacja o zakresie wyświetlanych elementów

### Krok 13: Implementacja komponentu DeleteConfirmationDialog

**Zadania:**
1. Utworzyć plik `src/components/DeleteConfirmationDialog.tsx` (lub wykorzystać istniejący `DeleteConfirmationModal.tsx`)
2. Wykorzystać `<Dialog>` z shadcn/ui
3. Zaimplementować wyświetlanie informacji o fiszce (front, back)
4. Dodać przyciski "Anuluj" i "Usuń"
5. Zaimplementować handler `onConfirm`
6. Dodać keyboard shortcuts (Esc → cancel, Enter → confirm)
7. Dodać opis o usunięciu historii powtórek

**Pliki do utworzenia/edycji:**
- `src/components/DeleteConfirmationDialog.tsx`

**Propsy:**
```typescript
interface DeleteConfirmationDialogProps {
  flashcard: Flashcard | null;
  isOpen: boolean;
  onConfirm: (flashcardId: string) => void;
  onCancel: () => void;
}
```

**Komponenty shadcn/ui:**
- `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogFooter>`
- `<Button>`

**Oczekiwany rezultat:**
- Dialog potwierdzenia usunięcia
- Wyświetlanie podglądu fiszki
- Obsługa akcji

### Krok 14: Integracja wszystkich komponentów w głównym widoku

**Zadania:**
1. W pliku `[id].astro` zaimportować wszystkie komponenty
2. Utworzyć główny kontener React (`DeckViewContainer.tsx`)
3. Zintegrować hook `useDeckView` w kontenerze
4. Przekazać dane i handlery do komponentów
5. Zaimplementować conditional rendering:
   - `isCreatingFlashcard` → pokazać `CreateFlashcardForm`
   - `flashcards.length === 0` → pokazać `EmptyState`
   - `flashcardToDelete !== null` → pokazać `DeleteConfirmationDialog`
6. Dodać obsługę query params (page, limit) z URL

**Pliki do utworzenia:**
- `src/components/DeckViewContainer.tsx`

**Oczekiwany rezultat:**
- Wszystkie komponenty współpracują
- Pełny flow od ładowania do interakcji
- Synchronizacja stanu między komponentami

### Krok 15: Implementacja obsługi błędów i loading states

**Zadania:**
1. Dodać loading state podczas pobierania strony paginacji
2. Zaimplementować error boundaries
3. Dodać toast notifications dla wszystkich akcji (sukces, błąd)
4. Dodać skeleton loaders dla fiszek podczas ładowania
5. Zaimplementować retry mechanism dla błędów sieciowych
6. Dodać fallback UI dla błędów krytycznych

**Biblioteki:**
- `react-hot-toast` lub inna biblioteka do toastów

**Oczekiwany rezultat:**
- Graceful handling wszystkich błędów
- Przejrzyste komunikaty dla użytkownika
- Loading states podczas asynchronicznych operacji

### Krok 16: Implementacja scroll to top po zmianie strony

**Zadania:**
1. W funkcji `handlePageChange` dodać `window.scrollTo(0, 0)`
2. Alternatywnie: wykorzystać `useEffect` z zależnością `currentPage`
3. Opcjonalnie: smooth scroll

**Oczekiwany rezultat:**
- Automatyczne przewinięcie na górę po zmianie strony

### Krok 17: Testy manualne i poprawki

**Zadania:**
1. Przetestować wszystkie user flows:
   - Edycja nazwy talii
   - Dodawanie fiszki
   - Inline edycja fiszki
   - Usuwanie fiszki
   - Paginacja
   - Zmiana limitu
2. Przetestować keyboard shortcuts
3. Przetestować responsywność (mobile/desktop)
4. Przetestować edge cases:
   - Pusta talia
   - Ostatnia fiszka na stronie
   - Bardzo długi tekst
   - Błędy walidacji
5. Poprawić znalezione błędy

**Oczekiwany rezultat:**
- Wszystkie funkcjonalności działają poprawnie
- Brak błędów w konsoli
- Responsywny UI

### Krok 18: Optymalizacja i finalizacja

**Zadania:**
1. Przejrzeć i zoptymalizować renderowanie (React.memo gdzie potrzebne)
2. Sprawdzić accessibility (ARIA labels, keyboard navigation)
3. Dodać meta tags do strony
4. Sprawdzić performance (Lighthouse)
5. Dodać komentarze do kodu
6. Zaktualizować dokumentację

**Oczekiwany rezultat:**
- Zoptymalizowany widok
- Dostępność i SEO w porządku
- Czytelny, udokumentowany kod

### Krok 19: Implementacja dodatkowych funkcji (opcjonalnie)

**Zadania:**
1. Batch operations (zaznacz wiele fiszek → usuń)
2. Sortowanie fiszek (alfabetycznie, po dacie)
3. Filtrowanie (tylko AI, tylko manual)
4. Export fiszek (CSV, JSON)
5. Search/filter w liście fiszek

**Oczekiwany rezultat:**
- Rozszerzona funkcjonalność według potrzeb

### Krok 20: Deploy i monitoring

**Zadania:**
1. Zbudować aplikację (`npm run build`)
2. Przetestować wersję produkcyjną lokalnie
3. Deploy na serwer (Vercel, Netlify, etc.)
4. Skonfigurować monitoring błędów (Sentry)
5. Monitorować performance i błędy

**Oczekiwany rezultat:**
- Działająca aplikacja w produkcji
- Monitoring i alerty

---

## Podsumowanie

Plan implementacji obejmuje wszystkie aspekty widoku talii od struktury komponentów, przez zarządzanie stanem, integrację API, aż po obsługę błędów i edge cases. Implementacja powinna przebiegać iteracyjnie, z testowaniem każdego kroku przed przejściem do kolejnego. Kluczowe jest zachowanie spójności z istniejącymi wzorcami w projekcie (Astro + React, Tailwind, shadcn/ui) oraz przestrzeganie zasad z pliku `.github/copilot-instructions.md`.
