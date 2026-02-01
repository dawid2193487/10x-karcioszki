# Plan implementacji widoku Sesja nauki

## 1. Przegląd

Widok sesji nauki umożliwia użytkownikowi powtarzanie fiszek z wybranej talii przy użyciu algorytmu spaced repetition (SM-2). Użytkownik przegląda pojedyncze fiszki, odkrywa odpowiedzi i ocenia trudność każdej fiszki na skali 1-4 (Again, Hard, Good, Easy). System automatycznie planuje następne powtórki na podstawie algorytmu SM-2 i zapisuje postęp po każdej ocenie.

Kluczowe funkcjonalności:
- Wyświetlanie pojedynczych fiszek z animacją flip 3D
- Odkrywanie odpowiedzi (przycisk lub Spacja)
- Ocena trudności (4 przyciski lub klawisze 1-4)
- Śledzenie postępu (licznik i progress bar)
- Podsumowanie sesji po zakończeniu
- Kompleksowa obsługa skrótów klawiszowych
- Minimalistyczny interfejs bez rozpraszaczy

## 2. Routing widoku

**Ścieżka:** `/study/:sessionId`

**Parametry URL:**
- `sessionId` (string, UUID) - identyfikator sesji nauki utworzonej wcześniej

**Warunki dostępu:**
- Użytkownik musi być zalogowany (middleware)
- Sesja musi należeć do zalogowanego użytkownika
- Sesja nie może być już zakończona (ended_at === null)

**Navigacja:**
- Wejście: z widoku talii `/decks/:deckId` po kliknięciu "Rozpocznij naukę"
- Wyjście: powrót do `/decks/:deckId` po zakończeniu lub anulowaniu sesji

## 3. Struktura komponentów

```
src/pages/study/[sessionId].astro (Astro Page)
└── StudyLayout.astro (Layout)
    └── StudySessionProvider (React Context Provider)
        └── StudySession.tsx (React - główny kontener)
            ├── SessionHeader.tsx (React)
            │   ├── DeckName (inline)
            │   ├── SessionProgress.tsx (React)
            │   └── ExitButton (inline)
            ├── FlashcardDisplay.tsx (React)
            │   ├── CardFront (inline div)
            │   ├── CardBack (inline div)
            │   └── RevealButton (shadcn Button)
            ├── DifficultyButtons.tsx (React)
            │   ├── AgainButton (shadcn Button)
            │   ├── HardButton (shadcn Button)
            │   ├── GoodButton (shadcn Button)
            │   └── EasyButton (shadcn Button)
            ├── SessionSummary.tsx (React - shadcn Dialog)
            │   └── SummaryContent (inline)
            └── KeyboardShortcutsOverlay.tsx (React - shadcn Dialog)
                └── ShortcutsList (inline)
```

## 4. Szczegóły komponentów

### 4.1. StudySession.tsx (główny kontener)

**Opis:**
Główny komponent zarządzający całą sesją nauki. Inicjalizuje dane z API, zarządza stanem przez context, obsługuje logikę przechodzenia między fiszkami oraz komunikację z backendem.

**Główne elementy:**
- Container div z max-width i centered layout
- SessionHeader - nagłówek z nazwą talii, postępem i przyciskiem wyjścia
- FlashcardDisplay - główny obszar wyświetlający fiszkę
- DifficultyButtons - przyciski oceny trudności
- SessionSummary - modal podsumowania (kondycjonalnie)
- KeyboardShortcutsOverlay - modal z pomocą skrótów (kondycjonalnie przy pierwszej sesji)

**Obsługiwane zdarzenia:**
- `onRevealAnswer()` - odkrycie odpowiedzi, aktualizacja stanu
- `onRateCard(rating: ReviewRating)` - ocena fiszki, wywołanie API, przejście do następnej
- `onExitSession()` - wyjście z sesji z potwierdzeniem
- `onCompleteSession()` - zakończenie sesji, wywołanie API complete
- `onRepeatSession()` - ponowne rozpoczęcie sesji (nowe fiszki)

**Warunki walidacji:**
- `dueCards.length > 0` - musi być co najmniej jedna fiszka do nauki
- `sessionId` musi być prawidłowym UUID
- Sesja musi należeć do zalogowanego użytkownika (sprawdzane przez API/middleware)
- Sesja nie może być już zakończona (`ended_at === null`)

**Typy:**
- State: `StudySessionState` (z context)
- Props: `StudySessionProps` - sessionId, initialData (SSR)

**Props (interfejs komponentu):**
```typescript
interface StudySessionProps {
  sessionId: string;
  initialSessionData?: StudySessionDetailDTO;
  initialDueCards?: DueFlashcardDTO[];
}
```

### 4.2. SessionHeader.tsx

**Opis:**
Nagłówek sesji wyświetlający nazwę talii, postęp nauki i przycisk wyjścia.

**Główne elementy:**
- Flex container (justify-between)
- `<h1>` z nazwą talii
- `<SessionProgress>` - komponent licznika i progress bar
- `<Button>` Exit z ikoną X i confirm dialog

**Obsługiwane zdarzenia:**
- `onExit()` - kliknięcie Exit, wyświetla confirm dialog

**Warunki walidacji:**
- Brak szczególnych warunków walidacji

**Typy:**
- `SessionHeaderProps`

**Props:**
```typescript
interface SessionHeaderProps {
  deckName: string;
  cardsRemaining: number;
  totalCards: number;
  onExit: () => void;
}
```

### 4.3. SessionProgress.tsx

**Opis:**
Komponent wyświetlający postęp sesji - licznik pozostałych fiszek oraz opcjonalnie progress bar.

**Główne elementy:**
- `<div>` z tekstem "{cardsRemaining} fiszek pozostało" (lub "1 fiszka pozostała")
- `<div>` progress bar (opcjonalnie) - Tailwind width percentage

**Obsługiwane zdarzenia:**
- Brak - komponent prezentacyjny

**Warunki walidacji:**
- Brak

**Typy:**
- `SessionProgressProps`

**Props:**
```typescript
interface SessionProgressProps {
  cardsRemaining: number;
  totalCards: number;
  showProgressBar?: boolean; // default: true
}
```

### 4.4. FlashcardDisplay.tsx

**Opis:**
Komponent wyświetlający fiszkę z animacją flip 3D. Pokazuje front (pytanie), a po odkryciu również back (odpowiedź). Zawiera przycisk "Pokaż odpowiedź" widoczny tylko gdy odpowiedź jest ukryta.

**Główne elementy:**
- Container div z `perspective` dla efektu 3D
- Inner div z `transform-style: preserve-3d` dla flip animation
- CardFront - `<div>` z tekstem `card.front`, klasa `card-face card-front`
- CardBack - `<div>` z tekstem `card.back`, klasa `card-face card-back` (rotated 180deg)
- RevealButton - shadcn `<Button>` "Pokaż odpowiedź (Spacja)", widoczny tylko gdy `!isRevealed`

**Obsługiwane zdarzenia:**
- `onClick` na RevealButton - wywołuje `onReveal()`
- Keyboard: Spacja (obsługiwane przez hook w parent)

**Warunki walidacji:**
- RevealButton visible tylko gdy `!isRevealed`
- CSS transform animation: `rotateY(0deg)` -> `rotateY(180deg)` przy reveal

**Typy:**
- `FlashcardDisplayProps`
- `DueFlashcardDTO`

**Props:**
```typescript
interface FlashcardDisplayProps {
  card: DueFlashcardDTO;
  isRevealed: boolean;
  onReveal: () => void;
}
```

### 4.5. DifficultyButtons.tsx

**Opis:**
Komponent z czterema przyciskami oceny trudności fiszki. Każdy przycisk ma swój kolor, opis i przewidywany czas następnej powtórki. Przyciski są nieaktywne dopóki odpowiedź nie zostanie odkryta.

**Główne elementy:**
- Grid container (4 kolumny na desktop, 2 na mobile)
- AgainButton (1) - czerwony, tekst "Again (1)", czas "< 10 min"
- HardButton (2) - pomarańczowy, tekst "Hard (2)", czas "4 days"
- GoodButton (3) - zielony, tekst "Good (3)", czas "1 week"
- EasyButton (4) - niebieski, tekst "Easy (4)", czas "2 weeks"

Każdy przycisk to shadcn `<Button>` z:
- `variant` według koloru (destructive/warning/default/secondary)
- `disabled={!isEnabled}`
- `aria-disabled={!isEnabled}`
- Flex column layout (tekst + czas)

**Obsługiwane zdarzenia:**
- `onClick` dla każdego przycisku - wywołuje `onRate(rating)`
- Keyboard: 1-4 (obsługiwane przez hook w parent)

**Warunki walidacji:**
- Wszystkie przyciski `disabled` gdy `!isEnabled`
- `aria-disabled` dla accessibility
- `aria-label` z pełnym opisem dla screen readers

**Typy:**
- `DifficultyButtonsProps`
- `ReviewRating` (1 | 2 | 3 | 4)
- `NextReviewTimes` (opcjonalnie)

**Props:**
```typescript
interface DifficultyButtonsProps {
  isEnabled: boolean;
  onRate: (rating: ReviewRating) => void;
  nextReviewTimes?: NextReviewTimes; // opcjonalne, z API lub fixed
}

interface NextReviewTimes {
  again: string;  // "< 10 min"
  hard: string;   // "4 days"
  good: string;   // "1 week"
  easy: string;   // "2 weeks"
}
```

### 4.6. SessionSummary.tsx

**Opis:**
Modal wyświetlający podsumowanie zakończonej sesji nauki. Pokazuje liczbę przejrzanych fiszek, czas trwania, rozkład ocen oraz przyciski akcji.

**Główne elementy:**
- shadcn `<Dialog>` z `open={isOpen}`
- DialogContent:
  - DialogHeader z tytułem "Sesja zakończona! 🎉"
  - Statystyki:
    - Przejrzane fiszki: `{cardsReviewed}`
    - Czas trwania: formatowany `{duration}` (np. "15 min 32 s")
  - Rozkład ocen (lista):
    - Again: `{breakdown.again}`
    - Hard: `{breakdown.hard}`
    - Good: `{breakdown.good}`
    - Easy: `{breakdown.easy}`
  - DialogFooter:
    - shadcn `<Button variant="outline">` "Zamknij" -> `onClose()`
    - shadcn `<Button>` "Ucz się ponownie" -> `onRepeat()`

**Obsługiwane zdarzenia:**
- `onClose()` - zamknięcie modala, redirect do `/decks/:deckId`
- `onRepeat()` - rozpoczęcie nowej sesji (redirect lub reload)

**Warunki walidacji:**
- Wyświetlany tylko gdy `isOpen === true`
- `isOpen` ustawiane gdy `isSessionCompleted === true`

**Typy:**
- `SessionSummaryProps`
- `CompleteStudySessionResponseDTO`
- `RatingsBreakdown`

**Props:**
```typescript
interface SessionSummaryProps {
  isOpen: boolean;
  sessionData: CompleteStudySessionResponseDTO;
  ratingsBreakdown: RatingsBreakdown;
  onClose: () => void;
  onRepeat: () => void;
}

interface RatingsBreakdown {
  again: number;
  hard: number;
  good: number;
  easy: number;
}
```

### 4.7. KeyboardShortcutsOverlay.tsx

**Opis:**
Modal wyświetlający listę dostępnych skrótów klawiszowych. Pokazywany automatycznie przy pierwszej sesji użytkownika (opcjonalnie) lub po naciśnięciu `?`. Można go ukryć na stałe przez checkbox "Nie pokazuj ponownie".

**Główne elementy:**
- shadcn `<Dialog>` z `open={isOpen}`
- DialogContent:
  - DialogHeader z tytułem "Skróty klawiszowe"
  - Lista skrótów (grid 2 kolumny: klawisz | opis):
    - `Spacja` - Odkryj odpowiedź
    - `1` - Oceń jako Again
    - `2` - Oceń jako Hard
    - `3` - Oceń jako Good
    - `4` - Oceń jako Easy
    - `?` - Pokaż pomoc
    - `Esc` - Zamknij modal
  - Checkbox "Nie pokazuj ponownie" (opcjonalnie)
  - DialogFooter z przyciskiem "Zamknij"

**Obsługiwane zdarzenia:**
- `onClose()` - zamknięcie modala
- `onDismissForever()` - zaznaczenie checkbox, zapis do localStorage

**Warunki walidacji:**
- Wyświetlany gdy `isOpen === true`
- Sprawdzenie localStorage `hideShortcutsOverlay` przy mount

**Typy:**
- `KeyboardShortcutsOverlayProps`

**Props:**
```typescript
interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  showDismissOption?: boolean; // default: true
}
```

### 4.8. StudyLayout.astro

**Opis:**
Minimalny layout dla widoku sesji nauki. Usuwa standardową nawigację i stopkę, pozostawia tylko główną zawartość.

**Główne elementy:**
- `<html>` z `lang="pl"`
- `<head>` z meta tags, title "Sesja nauki - AI Flashcards"
- `<body>` z:
  - Main container (max-width, centered)
  - `<slot />` dla zawartości React

**Obsługiwane zdarzenia:**
- Brak

**Warunki walidacji:**
- Brak

**Typy:**
- Brak specjalnych props

**Props:**
```typescript
interface StudyLayoutProps {
  title?: string; // default: "Sesja nauki"
}
```

## 5. Typy

### 5.1. Istniejące typy (z types.ts)

Wykorzystywane bezpośrednio:
- `StudySessionDetailDTO` - pełne dane sesji z deck_name
- `DueFlashcardDTO` - fiszka do nauki z polami SM-2
- `SubmitReviewCommand` - payload do POST /api/study-sessions/:sessionId/reviews
- `SubmitReviewResponseDTO` - odpowiedź po zapisaniu oceny
- `CompleteStudySessionResponseDTO` - odpowiedź po zakończeniu sesji
- `ReviewRating` - typ 1 | 2 | 3 | 4

### 5.2. Nowe typy dla widoku

```typescript
// ============================================================================
// Context State
// ============================================================================

/**
 * Stan sesji nauki zarządzany przez StudySessionContext
 */
interface StudySessionState {
  // Dane sesji
  sessionId: string;
  deckId: string;
  deckName: string;
  
  // Fiszki
  dueCards: DueFlashcardDTO[];
  currentCardIndex: number;
  
  // Stan aktualnej fiszki
  isAnswerRevealed: boolean;
  
  // Statystyki
  cardsReviewed: number;
  reviewStartTimes: Map<string, number>; // flashcard_id -> timestamp (ms)
  ratings: Map<string, ReviewRating>; // flashcard_id -> rating (dla summary)
  
  // Stan sesji
  isSessionCompleted: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Akcje dostępne w StudySessionContext
 */
interface StudySessionActions {
  revealAnswer: () => void;
  submitReview: (rating: ReviewRating) => Promise<void>;
  completeSession: () => Promise<void>;
  exitSession: () => void;
}

/**
 * Pełny context type
 */
type StudySessionContextType = StudySessionState & StudySessionActions;

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props dla głównego komponentu StudySession
 */
interface StudySessionProps {
  sessionId: string;
  initialSessionData?: StudySessionDetailDTO;
  initialDueCards?: DueFlashcardDTO[];
}

/**
 * Props dla SessionHeader
 */
interface SessionHeaderProps {
  deckName: string;
  cardsRemaining: number;
  totalCards: number;
  onExit: () => void;
}

/**
 * Props dla SessionProgress
 */
interface SessionProgressProps {
  cardsRemaining: number;
  totalCards: number;
  showProgressBar?: boolean;
}

/**
 * Props dla FlashcardDisplay
 */
interface FlashcardDisplayProps {
  card: DueFlashcardDTO;
  isRevealed: boolean;
  onReveal: () => void;
}

/**
 * Props dla DifficultyButtons
 */
interface DifficultyButtonsProps {
  isEnabled: boolean;
  onRate: (rating: ReviewRating) => void;
  nextReviewTimes?: NextReviewTimes;
}

/**
 * Przewidywane czasy następnych powtórek dla każdej oceny
 * Opcjonalnie mogą być pobierane z API lub obliczane frontend
 */
interface NextReviewTimes {
  again: string;  // np. "< 10 min"
  hard: string;   // np. "4 days"
  good: string;   // np. "1 week"
  easy: string;   // np. "2 weeks"
}

/**
 * Props dla SessionSummary
 */
interface SessionSummaryProps {
  isOpen: boolean;
  sessionData: CompleteStudySessionResponseDTO;
  ratingsBreakdown: RatingsBreakdown;
  onClose: () => void;
  onRepeat: () => void;
}

/**
 * Rozkład ocen dla summary
 */
interface RatingsBreakdown {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

/**
 * Props dla KeyboardShortcutsOverlay
 */
interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  showDismissOption?: boolean;
}

/**
 * Props dla StudyLayout
 */
interface StudyLayoutProps {
  title?: string;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Typ dla pojedynczego skrótu klawiszowego
 */
interface KeyboardShortcut {
  key: string;
  description: string;
  condition?: string; // opcjonalny warunek, np. "gdy odpowiedź ukryta"
}

/**
 * Grupy skrótów klawiszowych
 */
interface ShortcutsGroup {
  title: string;
  shortcuts: KeyboardShortcut[];
}
```

## 6. Zarządzanie stanem

### 6.1. React Context: StudySessionContext

Context zarządza całym stanem sesji nauki i dostarcza akcje do manipulacji tym stanem.

**Provider:** `StudySessionProvider`
- Inicjalizacja z props (SSR data) lub fetch z API
- Zarządzanie state przez `useState` lub `useReducer`
- Dostarczanie value przez `StudySessionContext.Provider`

**Stan (StudySessionState):**
```typescript
{
  // Dane sesji
  sessionId: string,              // z URL params
  deckId: string,                 // z API
  deckName: string,               // z API
  
  // Fiszki
  dueCards: DueFlashcardDTO[],    // lista fiszek do nauki
  currentCardIndex: number,        // indeks aktualnej fiszki (0-based)
  
  // Stan aktualnej fiszki
  isAnswerRevealed: boolean,       // czy odpowiedź odkryta
  
  // Statystyki
  cardsReviewed: number,           // liczba przejrzanych fiszek
  reviewStartTimes: Map<string, number>, // timestamp odkrycia dla response_time_ms
  ratings: Map<string, ReviewRating>,    // oceny dla statystyk summary
  
  // Stan sesji
  isSessionCompleted: boolean,     // czy sesja zakończona
  isLoading: boolean,              // loading state podczas API calls
  error: string | null             // błędy
}
```

**Akcje (StudySessionActions):**

1. **revealAnswer()**
   - Ustawia `isAnswerRevealed = true`
   - Zapisuje timestamp w `reviewStartTimes` dla aktualnej fiszki
   - Używane przez: FlashcardDisplay, keyboard hook (Spacja)

2. **submitReview(rating: ReviewRating)**
   - Async function
   - Waliduje: `isAnswerRevealed === true`
   - Pobiera `flashcard_id` z `dueCards[currentCardIndex]`
   - Oblicza `response_time_ms` z `reviewStartTimes`
   - Wywołuje API: `POST /api/study-sessions/:sessionId/reviews`
   - Request body: `{ flashcard_id, rating, response_time_ms }`
   - Po sukcesie:
     - Zapisuje rating w `ratings` Map
     - Inkrementuje `cardsReviewed`
     - Inkrementuje `currentCardIndex`
     - Resetuje `isAnswerRevealed = false`
     - Jeśli `currentCardIndex >= dueCards.length`: wywołuje `completeSession()`
   - Obsługa błędów: ustawia `error`, wyświetla toast, rollback state
   - Używane przez: DifficultyButtons, keyboard hook (1-4)

3. **completeSession()**
   - Async function
   - Wywołuje API: `PATCH /api/study-sessions/:id/complete` (opcjonalnie)
   - Po sukcesie: ustawia `isSessionCompleted = true`
   - Wyświetla SessionSummary modal
   - Używane przez: submitReview (automatycznie), manual trigger

4. **exitSession()**
   - Wyświetla confirm dialog: "Czy na pewno chcesz zakończyć sesję?"
   - Po potwierdzeniu: redirect do `/decks/:deckId`
   - Postęp jest już zapisany (każda ocena to osobny POST)
   - Opcjonalnie: wywołanie `completeSession()` przed wyjściem
   - Używane przez: SessionHeader ExitButton

### 6.2. Custom Hook: useStudySession

Hook enkapsulujący logikę zarządzania sesją nauki.

**Parametry:**
```typescript
function useStudySession(
  sessionId: string,
  initialSessionData?: StudySessionDetailDTO,
  initialDueCards?: DueFlashcardDTO[]
): StudySessionContextType
```

**Logika:**
- Inicjalizacja state z `initialData` (SSR) lub fetch z API
- Implementacja akcji: revealAnswer, submitReview, completeSession, exitSession
- Obsługa błędów i loading states
- Return: pełny context value

**Używane przez:** StudySessionProvider

### 6.3. Custom Hook: useKeyboardShortcuts

Hook obsługujący skróty klawiszowe w sesji nauki.

**Parametry:**
```typescript
function useKeyboardShortcuts(
  isAnswerRevealed: boolean,
  onReveal: () => void,
  onRate: (rating: ReviewRating) => void,
  onShowHelp: () => void
): void
```

**Logika:**
- `useEffect` z listener na `keydown`
- Warunki:
  - Ignoruj jeśli `document.activeElement` to input/textarea
  - Spacja: tylko gdy `!isAnswerRevealed`, wywołuje `onReveal()`
  - 1-4: tylko gdy `isAnswerRevealed`, wywołuje `onRate(rating)`
  - ?: zawsze, wywołuje `onShowHelp()`
  - Esc: zamknięcie help modal (obsługiwane przez modal)
- `event.preventDefault()` dla obsługiwanych klawiszy
- Cleanup: `removeEventListener` w return

**Używane przez:** StudySession

### 6.4. Local Storage

**Klucz:** `hideShortcutsOverlay`

**Wartość:** `"true"` lub `"false"`

**Użycie:**
- Sprawdzenie przy mount KeyboardShortcutsOverlay
- Zapis po zaznaczeniu "Nie pokazuj ponownie"
- Clear: brak (user może wyczyścić przez dev tools jeśli chce ponownie zobaczyć)

## 7. Integracja API

### 7.1. GET /api/study-sessions/:id

**Endpoint:** `GET /api/study-sessions/:id`

**Kiedy:** Inicjalizacja widoku (SSR w Astro lub client-side fetch)

**Headers:** `Authorization: Bearer <token>` (z cookies)

**Request:** Brak body

**Response (200 OK):**
```typescript
StudySessionDetailDTO {
  id: string;
  deck_id: string;
  deck_name: string;
  started_at: string;
  ended_at: string | null;
  cards_reviewed: number;
}
```

**Obsługa błędów:**
- `401 Unauthorized` - redirect do /login
- `404 Not Found` - redirect do dashboard z toast "Sesja nie znaleziona"
- `500 Internal Error` - wyświetlenie error state w UI

**Użycie w kodzie:**
- Astro page: `const session = await fetch(...)` w getStaticProps/loader
- Przekazanie jako `initialSessionData` do React component
- Lub client-side fetch w useEffect jeśli SSR nie dostępne

### 7.2. GET /api/decks/:deckId/due

**Endpoint:** `GET /api/decks/:deckId/due?limit=100`

**Kiedy:** Inicjalizacja widoku razem z session data

**Headers:** `Authorization: Bearer <token>`

**Query params:**
- `limit` (optional, number): maksymalna liczba fiszek (default: 100)

**Request:** Brak body

**Response (200 OK):**
```typescript
DueCardsResponseDTO {
  data: DueFlashcardDTO[];
  total: number;
}

DueFlashcardDTO {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  next_review_date: string | null;
  easiness_factor: number | null;
  interval: number | null;
  repetitions: number | null;
}
```

**Obsługa błędów:**
- `401 Unauthorized` - redirect do /login
- `404 Not Found` - deck nie istnieje, redirect do dashboard
- Jeśli `data.length === 0` - redirect do `/decks/:deckId` z toast "Brak fiszek do nauki"

**Użycie w kodzie:**
- Fetch w Astro page lub useEffect
- Przekazanie jako `initialDueCards` do React component
- Wypełnienie `dueCards` w state

### 7.3. POST /api/study-sessions/:sessionId/reviews

**Endpoint:** `POST /api/study-sessions/:sessionId/reviews`

**Kiedy:** Po ocenie fiszki (kliknięcie przycisku 1-4 lub klawisz)

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request body:**
```typescript
SubmitReviewCommand {
  flashcard_id: string;      // UUID aktualnej fiszki
  rating: ReviewRating;      // 1 | 2 | 3 | 4
  response_time_ms?: number; // czas od reveal do rate (opcjonalny)
}
```

**Response (200 OK):**
```typescript
SubmitReviewResponseDTO {
  review_id: string;
  flashcard: {
    id: string;
    next_review_date: string | null;
    easiness_factor: number | null;
    interval: number | null;
    repetitions: number | null;
  };
  session: {
    cards_reviewed: number;
  };
}
```

**Obsługa błędów:**
- `400 Bad Request` - walidacja nie powiodła się (np. invalid rating)
  - Toast: "Błąd walidacji, spróbuj ponownie"
  - Pozostań na aktualnej fiszce
- `401 Unauthorized` - redirect do /login
- `404 Not Found` - sesja lub fiszka nie istnieje
  - Toast: "Sesja wygasła"
  - Redirect do dashboard
- `500 Internal Error` - błąd serwera
  - Toast: "Błąd zapisu, spróbuj ponownie"
  - Rollback state (pozostań na fiszce, możliwość retry)

**Użycie w kodzie:**
- Wywołanie w `submitReview()` action
- Loading state: `setIsLoading(true)` przed, `false` po
- Update state po sukcesie: increment counters, next card
- Error handling: toast + rollback + możliwość retry

### 7.4. PATCH /api/study-sessions/:id/complete

**Endpoint:** `PATCH /api/study-sessions/:id/complete`

**Kiedy:** Po przejrzeniu wszystkich fiszek (opcjonalnie, dla statystyk duration)

**Headers:**
- `Authorization: Bearer <token>`

**Request:** Brak body

**Response (200 OK):**
```typescript
CompleteStudySessionResponseDTO {
  id: string;
  deck_id: string;
  started_at: string;
  ended_at: string;
  cards_reviewed: number;
  duration_seconds: number;
}
```

**Obsługa błędów:**
- `401 Unauthorized` - redirect do /login
- `404 Not Found` - sesja nie istnieje (może już być usunięta)
  - Ignoruj błąd, pokaż summary z lokalnych danych
- `409 Conflict` - sesja już zakończona
  - Ignoruj błąd, pokaż summary

**Użycie w kodzie:**
- Wywołanie w `completeSession()` action
- Opcjonalne - można pominąć jeśli aplikacja nie wymaga precyzyjnego duration
- Response używany do wypełnienia SessionSummary modal
- Jeśli błąd - fallback do lokalnych danych (cardsReviewed z state)

## 8. Interakcje użytkownika

### 8.1. Odkrycie odpowiedzi

**Triggery:**
- Kliknięcie przycisku "Pokaż odpowiedź"
- Naciśnięcie klawisza Spacja

**Warunki:**
- `isAnswerRevealed === false`
- Nie w polu tekstowym (input/textarea nie ma focus)

**Akcja:**
1. Wywołanie `revealAnswer()` z context
2. State update: `isAnswerRevealed = true`
3. Zapis timestamp: `reviewStartTimes.set(currentCard.id, Date.now())`
4. UI update:
   - Animacja flip 3D na FlashcardDisplay (CSS transform)
   - CardBack staje się widoczny
   - RevealButton znika
   - DifficultyButtons stają się enabled
5. Focus management: autofocus na pierwszy przycisk oceny (opcjonalnie)

### 8.2. Ocena fiszki

**Triggery:**
- Kliknięcie przycisku Again/Hard/Good/Easy
- Naciśnięcie klawisza 1/2/3/4

**Warunki:**
- `isAnswerRevealed === true`
- `!isLoading`
- Nie w polu tekstowym

**Akcja:**
1. Wywołanie `submitReview(rating)` z context
2. State update: `isLoading = true`
3. Przygotowanie payload:
   ```typescript
   {
     flashcard_id: dueCards[currentCardIndex].id,
     rating: rating, // 1-4
     response_time_ms: Date.now() - reviewStartTimes.get(flashcard_id)
   }
   ```
4. API call: `POST /api/study-sessions/:sessionId/reviews`
5. Po sukcesie:
   - Zapis rating: `ratings.set(flashcard_id, rating)`
   - Increment: `cardsReviewed++`
   - Next card: `currentCardIndex++`
   - Reset: `isAnswerRevealed = false`
   - State update: `isLoading = false`
6. UI update:
   - Jeśli `currentCardIndex < dueCards.length`:
     - Render następnej fiszki (smooth transition)
     - Reset FlashcardDisplay do front-only
     - DifficultyButtons disabled
   - Jeśli `currentCardIndex >= dueCards.length`:
     - Wywołanie `completeSession()`
7. Error handling:
   - Toast z komunikatem błędu
   - Rollback state (pozostań na aktualnej fiszce)
   - `isLoading = false`
   - Możliwość retry

### 8.3. Wyjście z sesji

**Trigger:**
- Kliknięcie przycisku "Exit" (X) w SessionHeader

**Warunki:**
- Brak szczególnych warunków

**Akcja:**
1. Wywołanie `exitSession()` z context
2. Wyświetlenie confirm dialog:
   - Tytuł: "Zakończyć sesję?"
   - Komunikat: "Twój postęp został zapisany. Czy na pewno chcesz zakończyć?"
   - Przyciski: "Anuluj" / "Zakończ"
3. Po potwierdzeniu:
   - Opcjonalnie: wywołanie `completeSession()` (dla statystyk)
   - Redirect: `navigate('/decks/' + deckId)`
4. Po anulowaniu:
   - Zamknięcie dialogu
   - Powrót do sesji

### 8.4. Zakończenie sesji

**Trigger:**
- Automatycznie po ocenie ostatniej fiszki (`currentCardIndex >= dueCards.length`)
- Manualnie przez `exitSession()` (opcjonalnie)

**Akcja:**
1. Wywołanie `completeSession()` z context
2. API call: `PATCH /api/study-sessions/:id/complete` (opcjonalnie)
3. State update: `isSessionCompleted = true`
4. Przygotowanie danych summary:
   - `sessionData` z API response lub fallback z state
   - `ratingsBreakdown` obliczone z `ratings` Map:
     ```typescript
     {
       again: Array.from(ratings.values()).filter(r => r === 1).length,
       hard: Array.from(ratings.values()).filter(r => r === 2).length,
       good: Array.from(ratings.values()).filter(r => r === 3).length,
       easy: Array.from(ratings.values()).filter(r => r === 4).length
     }
     ```
5. UI: Wyświetlenie SessionSummary modal (`isOpen={isSessionCompleted}`)

### 8.5. Zamknięcie podsumowania

**Triggers:**
- Kliknięcie "Zamknij" w SessionSummary
- Kliknięcie poza modalem (opcjonalnie)

**Akcja:**
1. Wywołanie `onClose()` z SessionSummary props
2. Redirect: `navigate('/decks/' + deckId)`
3. Toast: "Świetna robota! Przejrzano {cardsReviewed} fiszek"

### 8.6. Powtórzenie sesji

**Trigger:**
- Kliknięcie "Ucz się ponownie" w SessionSummary

**Akcja:**
1. Wywołanie `onRepeat()` z SessionSummary props
2. Sprawdzenie czy są nowe fiszki do nauki (fetch `/api/decks/:deckId/due`)
3. Jeśli są:
   - Utworzenie nowej sesji: `POST /api/study-sessions`
   - Redirect: `navigate('/study/' + newSessionId)`
4. Jeśli nie ma:
   - Toast: "Brak fiszek do nauki"
   - Redirect: `navigate('/decks/' + deckId)`

### 8.7. Wyświetlenie pomocy skrótów

**Trigger:**
- Naciśnięcie klawisza `?`
- Automatycznie przy pierwszej sesji (jeśli `!localStorage.hideShortcutsOverlay`)

**Akcja:**
1. State update: `setShowHelp(true)`
2. UI: Wyświetlenie KeyboardShortcutsOverlay modal
3. Focus trap w modalu
4. Zamknięcie przez:
   - Kliknięcie X
   - Kliknięcie poza modalem
   - Naciśnięcie Esc
   - Kliknięcie "Zamknij"

### 8.8. Ukrycie pomocy na stałe

**Trigger:**
- Zaznaczenie checkbox "Nie pokazuj ponownie" w KeyboardShortcutsOverlay

**Akcja:**
1. Wywołanie `onDismissForever()` z props
2. Zapis do localStorage: `localStorage.setItem('hideShortcutsOverlay', 'true')`
3. Zamknięcie modala

## 9. Warunki i walidacja

### 9.1. Walidacja przy inicjalizacji widoku

**Warunki:**
1. **sessionId w URL musi być prawidłowym UUID**
   - Sprawdzane przez: Astro page lub React useEffect
   - Błąd: redirect do dashboard z toast "Nieprawidłowy ID sesji"

2. **Sesja musi należeć do zalogowanego użytkownika**
   - Sprawdzane przez: middleware + API
   - Błąd: 401 Unauthorized lub 404 Not Found
   - Akcja: redirect do /login lub dashboard

3. **Sesja nie może być już zakończona**
   - Sprawdzane przez: `ended_at === null` w response
   - Błąd: 409 Conflict lub custom check
   - Akcja: redirect do `/decks/:deckId` z toast "Ta sesja została już zakończona"

4. **Musi być co najmniej jedna fiszka do nauki**
   - Sprawdzane przez: `dueCards.length > 0`
   - Błąd: jeśli 0
   - Akcja: redirect do `/decks/:deckId` z toast "Brak fiszek do nauki"

**Komponent:** StudySession (useEffect)

**Wpływ na UI:**
- Jeśli walidacja nie przejdzie: loading spinner -> redirect
- Nie renderuj głównego contentu dopóki walidacja nie przejdzie

### 9.2. Walidacja odkrycia odpowiedzi

**Warunki:**
1. **Odpowiedź musi być ukryta**
   - `isAnswerRevealed === false`
   - Sprawdzane przez: FlashcardDisplay, useKeyboardShortcuts

**Komponent:** FlashcardDisplay, useKeyboardShortcuts

**Wpływ na UI:**
- RevealButton visible tylko gdy `!isAnswerRevealed`
- Shortcut Spacja działa tylko gdy `!isAnswerRevealed`

### 9.3. Walidacja oceny fiszki

**Warunki:**
1. **Odpowiedź musi być odkryta**
   - `isAnswerRevealed === true`
   - Sprawdzane przez: DifficultyButtons, useKeyboardShortcuts

2. **Rating musi być w zakresie 1-4**
   - Sprawdzane przez: TypeScript type (ReviewRating)
   - Backend również waliduje

3. **Nie może być w trakcie innego zapisu**
   - `!isLoading`
   - Sprawdzane przez: DifficultyButtons (disabled)

**Komponent:** DifficultyButtons, useKeyboardShortcuts

**Wpływ na UI:**
- Przyciski disabled gdy `!isAnswerRevealed || isLoading`
- `aria-disabled="true"` dla accessibility
- Shortcuts 1-4 działają tylko gdy `isAnswerRevealed && !isLoading`

### 9.4. Walidacja przy zapisie oceny (backend)

**API endpoint:** `POST /api/study-sessions/:sessionId/reviews`

**Warunki sprawdzane przez backend:**
1. `flashcard_id` - wymagane, UUID, musi istnieć i należeć do user
2. `rating` - wymagane, integer, 1-4
3. `response_time_ms` - opcjonalne, integer, >= 0

**Błędy:** 400 Bad Request z details

**Obsługa w frontend:**
- Toast z komunikatem błędu
- Rollback state (pozostań na fiszce)
- Możliwość retry

### 9.5. Walidacja skrótów klawiszowych

**Warunki:**
1. **Nie w polu tekstowym**
   - `document.activeElement.tagName !== 'INPUT'`
   - `document.activeElement.tagName !== 'TEXTAREA'`
   - Sprawdzane przez: useKeyboardShortcuts

2. **Odpowiednie warunki dla każdego skrótu**
   - Spacja: `!isAnswerRevealed`
   - 1-4: `isAnswerRevealed && !isLoading`
   - ?: zawsze
   - Esc: jeśli modal otwarty

**Komponent:** useKeyboardShortcuts

**Wpływ:**
- Ignorowanie skrótów gdy warunki nie spełnione
- `event.preventDefault()` tylko dla obsługiwanych

## 10. Obsługa błędów

### 10.1. Błąd inicjalizacji (fetch session/due cards)

**Scenariusz:** API zwraca błąd przy ładowaniu danych sesji lub fiszek

**Możliwe błędy:**
- `401 Unauthorized` - użytkownik niezalogowany
- `404 Not Found` - sesja nie istnieje lub nie należy do user
- `500 Internal Error` - błąd serwera

**Obsługa:**
1. Wyświetlenie error state w UI:
   - Ikona błędu
   - Komunikat: "Nie udało się załadować sesji"
   - Przycisk "Wróć do talii" -> redirect `/decks/:deckId`
   - Przycisk "Spróbuj ponownie" -> retry fetch
2. Dla 401: redirect do /login
3. Dla 404: redirect do dashboard z toast
4. Error boundary (React) dla niezłapanych błędów

**Komponent:** StudySession (error state)

### 10.2. Brak fiszek do nauki

**Scenariusz:** `dueCards.length === 0` po fetch

**Obsługa:**
1. Nie renderuj głównego UI
2. Wyświetl komunikat: "Brak fiszek do nauki. Wszystkie fiszki są aktualne!"
3. Przycisk "Wróć do talii" -> redirect `/decks/:deckId`
4. Opcjonalnie: Toast informacyjny

**Komponent:** StudySession (conditional render)

### 10.3. Błąd zapisu oceny

**Scenariusz:** API zwraca błąd przy `POST /api/study-sessions/:sessionId/reviews`

**Możliwe błędy:**
- `400 Bad Request` - walidacja nie powiodła się
- `404 Not Found` - sesja lub fiszka nie istnieje
- `500 Internal Error` - błąd serwera
- Network error - brak połączenia

**Obsługa:**
1. Catch w `submitReview()`
2. Rollback state:
   - `isLoading = false`
   - Pozostań na `currentCardIndex` (nie inkrementuj)
   - Zachowaj `isAnswerRevealed = true`
3. Toast z komunikatem błędu:
   - 400: "Błąd walidacji. Spróbuj ponownie."
   - 404: "Sesja wygasła."
   - 500: "Błąd serwera. Spróbuj ponownie."
   - Network: "Sprawdź połączenie internetowe."
4. Dla 404: dodatkowo redirect do dashboard po 3s
5. Możliwość retry: użytkownik może ponownie ocenić fiszkę

**Komponent:** StudySession (submitReview action)

### 10.4. Błąd zakończenia sesji

**Scenariusz:** API zwraca błąd przy `PATCH /api/study-sessions/:id/complete`

**Możliwe błędy:**
- `404 Not Found` - sesja nie istnieje
- `409 Conflict` - sesja już zakończona
- `500 Internal Error` - błąd serwera

**Obsługa:**
1. Ignoruj błąd - completion jest opcjonalne
2. Fallback do lokalnych danych:
   - `cardsReviewed` z state
   - `ratingsBreakdown` obliczone z ratings Map
   - `duration_seconds` obliczone z `started_at` timestamp (lokalnie)
3. Wyświetl SessionSummary z lokalnymi danymi
4. Log error (opcjonalnie, dla debugowania)

**Komponent:** StudySession (completeSession action)

### 10.5. Session ID nieprawidłowe

**Scenariusz:** `sessionId` w URL nie jest UUID lub nie istnieje

**Obsługa:**
1. Walidacja w Astro page lub useEffect
2. Regex check UUID format
3. Jeśli nieprawidłowy:
   - Toast: "Nieprawidłowy ID sesji"
   - Redirect: dashboard
4. Jeśli nie istnieje (404 z API):
   - Toast: "Sesja nie znaleziona"
   - Redirect: dashboard

**Komponent:** Astro page, StudySession (useEffect)

### 10.6. Sesja już zakończona

**Scenariusz:** `ended_at !== null` w session data

**Obsługa:**
1. Check przy inicjalizacji
2. Jeśli zakończona:
   - Toast: "Ta sesja została już zakończona"
   - Redirect: `/decks/:deckId`
3. Opcjonalnie: wyświetl read-only summary (jeśli mamy dane)

**Komponent:** StudySession (useEffect)

### 10.7. Utrata połączenia podczas sesji

**Scenariusz:** Network error podczas `submitReview()`

**Obsługa:**
1. Catch network error
2. Toast: "Sprawdź połączenie internetowe"
3. Rollback state (jak w 10.3)
4. Zachowaj stan lokalnie (fiszka + rating w tymczasowej queue)
5. Opcjonalnie: retry mechanism:
   - Nasłuchiwanie na `online` event
   - Automatyczne retry po reconnect
   - Wyświetlenie "Synchronizacja..." podczas retry

**Komponent:** StudySession (submitReview + network listener)

### 10.8. Uncaught errors (React Error Boundary)

**Scenariusz:** Niespodziewany błąd w komponencie React

**Obsługa:**
1. Implementacja Error Boundary:
   ```tsx
   <ErrorBoundary fallback={<ErrorFallback />}>
     <StudySession />
   </ErrorBoundary>
   ```
2. ErrorFallback component:
   - Komunikat: "Coś poszło nie tak"
   - Przycisk "Wróć do talii"
   - Przycisk "Przeładuj stronę"
3. Log error do console (lub external service)

**Komponent:** ErrorBoundary (wrapper)

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utworzyć strukturę folderów:
   ```
   src/pages/study/[sessionId].astro
   src/components/study/StudySession.tsx
   src/components/study/SessionHeader.tsx
   src/components/study/SessionProgress.tsx
   src/components/study/FlashcardDisplay.tsx
   src/components/study/DifficultyButtons.tsx
   src/components/study/SessionSummary.tsx
   src/components/study/KeyboardShortcutsOverlay.tsx
   src/components/study/useStudySession.ts
   src/components/study/useKeyboardShortcuts.ts
   src/layouts/StudyLayout.astro
   ```

2. Dodać typy do `src/types.ts` lub utworzyć `src/components/study/types.ts`:
   - StudySessionState
   - StudySessionActions
   - Component Props interfaces
   - Helper types

### Krok 2: Implementacja layoutu (StudyLayout.astro)

1. Utworzyć minimalny layout bez nawigacji
2. Dodać meta tags z tytułem "Sesja nauki"
3. Dodać slot dla contentu
4. Zachować import stylów globalnych

### Krok 3: Implementacja Astro page ([sessionId].astro)

1. Pobrać `sessionId` z `Astro.params`
2. Walidacja UUID format
3. Fetch danych z API (SSR):
   - `GET /api/study-sessions/:id`
   - `GET /api/decks/:deckId/due?limit=100`
4. Obsługa błędów (redirect jeśli 404, 401)
5. Sprawdzenie `ended_at === null`
6. Sprawdzenie `dueCards.length > 0`
7. Przekazanie danych jako props do React component:
   ```astro
   <StudySession
     client:load
     sessionId={sessionId}
     initialSessionData={sessionData}
     initialDueCards={dueCards}
   />
   ```

### Krok 4: Implementacja Context (StudySessionContext)

1. Utworzyć `StudySessionContext` z `createContext()`
2. Zdefiniować initial state (StudySessionState)
3. Implementacja `StudySessionProvider`:
   - Inicjalizacja state z props lub fetch
   - useState lub useReducer dla zarządzania stanem
   - Implementacja actions: revealAnswer, submitReview, completeSession, exitSession
   - Provider value: { ...state, ...actions }
4. Export `useStudySessionContext` hook

### Krok 5: Implementacja useStudySession hook

1. Parametry: sessionId, initialSessionData, initialDueCards
2. State initialization:
   - Z initialData jeśli dostępne
   - Lub fetch z API w useEffect
3. Implementacja revealAnswer():
   - setIsAnswerRevealed(true)
   - reviewStartTimes.set(currentCard.id, Date.now())
4. Implementacja submitReview(rating):
   - Walidacja: isAnswerRevealed, !isLoading
   - Obliczenie response_time_ms
   - API call POST /api/study-sessions/:sessionId/reviews
   - Update state po sukcesie
   - Error handling + rollback
5. Implementacja completeSession():
   - API call PATCH (opcjonalnie)
   - setIsSessionCompleted(true)
6. Implementacja exitSession():
   - Confirm dialog
   - Redirect
7. Return: pełny context value

### Krok 6: Implementacja useKeyboardShortcuts hook

1. Parametry: isAnswerRevealed, onReveal, onRate, onShowHelp
2. useEffect z keydown listener:
   ```typescript
   const handleKeyDown = (e: KeyboardEvent) => {
     // Check if in input/textarea
     const target = e.target as HTMLElement;
     if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
     
     // Handle shortcuts
     if (e.key === ' ' && !isAnswerRevealed) {
       e.preventDefault();
       onReveal();
     }
     if (e.key === '1' && isAnswerRevealed) {
       e.preventDefault();
       onRate(1);
     }
     // ... pozostałe skróty
   };
   
   window.addEventListener('keydown', handleKeyDown);
   return () => window.removeEventListener('keydown', handleKeyDown);
   ```
3. Cleanup w return

### Krok 7: Implementacja FlashcardDisplay

1. Props: card, isRevealed, onReveal
2. JSX structure:
   ```tsx
   <div className="flashcard-container perspective-1000">
     <div className={cn("flashcard-inner", isRevealed && "flipped")}>
       <div className="card-face card-front">
         {card.front}
       </div>
       <div className="card-face card-back">
         {card.back}
       </div>
     </div>
     {!isRevealed && (
       <Button onClick={onReveal}>
         Pokaż odpowiedź (Spacja)
       </Button>
     )}
   </div>
   ```
3. CSS dla flip animation (Tailwind):
   ```css
   .perspective-1000 { perspective: 1000px; }
   .flashcard-inner {
     transform-style: preserve-3d;
     transition: transform 0.6s;
   }
   .flashcard-inner.flipped {
     transform: rotateY(180deg);
   }
   .card-face {
     backface-visibility: hidden;
   }
   .card-back {
     transform: rotateY(180deg);
   }
   ```

### Krok 8: Implementacja DifficultyButtons

1. Props: isEnabled, onRate, nextReviewTimes (opcjonalnie)
2. Fixed review times (fallback):
   ```typescript
   const defaultTimes = {
     again: "< 10 min",
     hard: "4 days",
     good: "1 week",
     easy: "2 weeks"
   };
   const times = nextReviewTimes || defaultTimes;
   ```
3. JSX structure - grid 4 kolumny (2 na mobile):
   ```tsx
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
     <Button
       variant="destructive"
       disabled={!isEnabled}
       onClick={() => onRate(1)}
       className="flex flex-col"
     >
       <span>Again (1)</span>
       <span className="text-sm">{times.again}</span>
     </Button>
     {/* ... pozostałe */}
   </div>
   ```
4. Tailwind variants dla kolorów:
   - Again: destructive (czerwony)
   - Hard: custom warning (pomarańczowy)
   - Good: default (zielony/primary)
   - Easy: secondary (niebieski)

### Krok 9: Implementacja SessionProgress

1. Props: cardsRemaining, totalCards, showProgressBar
2. JSX:
   ```tsx
   <div>
     <p>{cardsRemaining} fiszek pozostało</p>
     {showProgressBar && (
       <div className="progress-bar">
         <div 
           className="progress-fill"
           style={{ width: `${((totalCards - cardsRemaining) / totalCards) * 100}%` }}
         />
       </div>
     )}
   </div>
   ```
3. Pluralizacja "fiszka/fiszki/fiszek" (helper function)

### Krok 10: Implementacja SessionHeader

1. Props: deckName, cardsRemaining, totalCards, onExit
2. JSX:
   ```tsx
   <header className="flex justify-between items-center">
     <h1>{deckName}</h1>
     <SessionProgress 
       cardsRemaining={cardsRemaining}
       totalCards={totalCards}
     />
     <Button variant="ghost" onClick={handleExit}>
       <X /> Exit
     </Button>
   </header>
   ```
3. handleExit z confirm dialog (shadcn AlertDialog):
   ```tsx
   const handleExit = () => {
     // Wyświetl AlertDialog
     // Po confirm: onExit()
   };
   ```

### Krok 11: Implementacja SessionSummary

1. Props: isOpen, sessionData, ratingsBreakdown, onClose, onRepeat
2. shadcn Dialog:
   ```tsx
   <Dialog open={isOpen} onOpenChange={onClose}>
     <DialogContent>
       <DialogHeader>
         <DialogTitle>Sesja zakończona! 🎉</DialogTitle>
       </DialogHeader>
       <div className="space-y-4">
         <p>Przejrzane fiszki: {sessionData.cards_reviewed}</p>
         <p>Czas trwania: {formatDuration(sessionData.duration_seconds)}</p>
         <div>
           <h3>Oceny:</h3>
           <ul>
             <li>Again: {ratingsBreakdown.again}</li>
             <li>Hard: {ratingsBreakdown.hard}</li>
             <li>Good: {ratingsBreakdown.good}</li>
             <li>Easy: {ratingsBreakdown.easy}</li>
           </ul>
         </div>
       </div>
       <DialogFooter>
         <Button variant="outline" onClick={onClose}>Zamknij</Button>
         <Button onClick={onRepeat}>Ucz się ponownie</Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
   ```
3. Helper function formatDuration:
   ```typescript
   function formatDuration(seconds: number): string {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins} min ${secs} s`;
   }
   ```

### Krok 12: Implementacja KeyboardShortcutsOverlay

1. Props: isOpen, onClose, showDismissOption
2. shadcn Dialog z listą skrótów:
   ```tsx
   <Dialog open={isOpen} onOpenChange={onClose}>
     <DialogContent>
       <DialogHeader>
         <DialogTitle>Skróty klawiszowe</DialogTitle>
       </DialogHeader>
       <div className="grid grid-cols-[auto_1fr] gap-4">
         <kbd>Spacja</kbd><span>Odkryj odpowiedź</span>
         <kbd>1</kbd><span>Oceń jako Again</span>
         {/* ... */}
       </div>
       {showDismissOption && (
         <div className="flex items-center space-x-2">
           <Checkbox id="hide" onCheckedChange={handleDismiss} />
           <label htmlFor="hide">Nie pokazuj ponownie</label>
         </div>
       )}
       <DialogFooter>
         <Button onClick={onClose}>Zamknij</Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
   ```
3. handleDismiss:
   ```typescript
   const handleDismiss = (checked: boolean) => {
     if (checked) {
       localStorage.setItem('hideShortcutsOverlay', 'true');
     }
   };
   ```

### Krok 13: Implementacja głównego komponentu StudySession

1. Props: sessionId, initialSessionData, initialDueCards
2. Provider wrapper:
   ```tsx
   export function StudySession(props: StudySessionProps) {
     return (
       <StudySessionProvider {...props}>
         <StudySessionContent />
       </StudySessionProvider>
     );
   }
   ```
3. StudySessionContent - internal component:
   ```tsx
   function StudySessionContent() {
     const context = useStudySessionContext();
     const [showHelp, setShowHelp] = useState(false);
     
     // useKeyboardShortcuts hook
     useKeyboardShortcuts(
       context.isAnswerRevealed,
       context.revealAnswer,
       context.submitReview,
       () => setShowHelp(true)
     );
     
     // Check first-time user
     useEffect(() => {
       const hideOverlay = localStorage.getItem('hideShortcutsOverlay');
       if (!hideOverlay) {
         setShowHelp(true);
       }
     }, []);
     
     // Render
     if (context.isLoading && !context.dueCards.length) {
       return <LoadingSpinner />;
     }
     
     if (context.error) {
       return <ErrorState error={context.error} />;
     }
     
     if (!context.dueCards.length) {
       return <EmptyState message="Brak fiszek do nauki" />;
     }
     
     const currentCard = context.dueCards[context.currentCardIndex];
     const cardsRemaining = context.dueCards.length - context.currentCardIndex;
     
     return (
       <>
         <SessionHeader
           deckName={context.deckName}
           cardsRemaining={cardsRemaining}
           totalCards={context.dueCards.length}
           onExit={context.exitSession}
         />
         <FlashcardDisplay
           card={currentCard}
           isRevealed={context.isAnswerRevealed}
           onReveal={context.revealAnswer}
         />
         <DifficultyButtons
           isEnabled={context.isAnswerRevealed}
           onRate={context.submitReview}
         />
         <SessionSummary
           isOpen={context.isSessionCompleted}
           sessionData={...} // z API lub local
           ratingsBreakdown={...} // obliczone z ratings Map
           onClose={...}
           onRepeat={...}
         />
         <KeyboardShortcutsOverlay
           isOpen={showHelp}
           onClose={() => setShowHelp(false)}
         />
       </>
     );
   }
   ```

### Krok 14: Stylowanie (Tailwind CSS)

1. Layout główny (centered, max-width):
   ```tsx
   <div className="container max-w-4xl mx-auto px-4 py-8">
   ```
2. FlashcardDisplay - duża, wycentrowana karta:
   ```tsx
   <div className="my-12 mx-auto max-w-2xl">
   ```
3. DifficultyButtons - grid na dole:
   ```tsx
   <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
   ```
4. Custom CSS dla flip animation (global.css)
5. Responsive design (mobile-first)
6. Dark mode support (Tailwind dark: variant)

### Krok 15: Accessibility (ARIA)

1. FlashcardDisplay:
   - `role="region"` na kontenerze
   - `aria-label="Fiszka"`
   - `aria-live="polite"` dla CardBack (announce gdy odkryta)
2. DifficultyButtons:
   - `aria-disabled` gdy disabled
   - `aria-label` z pełnym opisem, np. "Oceń jako Again, następna powtórka za mniej niż 10 minut"
3. SessionProgress:
   - `aria-live="polite"` dla licznika
   - `role="progressbar"` dla progress bar
   - `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
4. Focus management:
   - Autofocus na RevealButton po załadowaniu fiszki
   - Autofocus na pierwszym przycisku oceny po reveal
   - Focus trap w modalach

### Krok 16: Testowanie

1. **Unit testy (Vitest + React Testing Library):**
   - useStudySession hook
   - useKeyboardShortcuts hook
   - Helper functions (formatDuration, pluralize)
   - Component rendering (FlashcardDisplay, DifficultyButtons)

2. **Integration testy:**
   - Pełny flow: reveal -> rate -> next card
   - Keyboard shortcuts
   - API mocking (MSW)
   - Error scenarios

3. **E2E testy (Playwright):**
   - Pełna sesja nauki od początku do końca
   - Exit i powrót
   - Error handling

4. **Manual testing:**
   - Różne rozmiary ekranu (mobile, tablet, desktop)
   - Keyboard navigation
   - Screen reader (NVDA, VoiceOver)
   - Dark mode

### Krok 17: Optymalizacje

1. **Performance:**
   - React.memo dla komponentów nie zmieniających się często
   - useMemo dla obliczonych wartości (ratingsBreakdown)
   - useCallback dla event handlers przekazywanych do children
   - Lazy loading dla SessionSummary (conditional render)

2. **UX:**
   - Smooth transitions (CSS transitions)
   - Loading states (skeleton loaders)
   - Optimistic updates (opcjonalnie, z rollback)
   - Toast notifications (react-hot-toast lub shadcn Sonner)

3. **Accessibility:**
   - Keyboard focus indicators (focus-visible)
   - Reduced motion support (prefers-reduced-motion)
   - High contrast mode

### Krok 18: Dokumentacja

1. Dodać komentarze JSDoc do komponentów i hooków
2. Utworzyć README.md w folderze study/:
   - Opis architektury
   - Flow diagram
   - Instrukcje dla developerów
3. Zaktualizować główny README projektu
4. Dodać przykłady użycia

### Krok 19: Deploy i monitoring

1. Przegląd zmian w kodzie (code review)
2. Merge do main branch
3. Deploy na środowisko staging
4. Smoke testing
5. Deploy na production
6. Monitoring błędów (Sentry, LogRocket)
7. Analytics (usage tracking)

### Krok 20: Iteracje i feedback

1. Zebranie feedbacku od użytkowników
2. A/B testing (opcjonalnie):
   - Różne kolory przycisków
   - Różne czasy preview dla next review
3. Iteracje na podstawie danych:
   - Adjustment algorytmu SM-2 (jeśli backend pozwala)
   - Usprawnienia UX
   - Nowe features (np. streak tracking)

---

## Zakończenie

Ten plan implementacji zawiera wszystkie szczegóły potrzebne do zbudowania w pełni funkcjonalnego widoku sesji nauki. Kluczowe punkty:

- **Modularność:** Każdy komponent ma jasno określoną odpowiedzialność
- **Reużywalność:** Komponenty mogą być używane w innych częściach aplikacji
- **Accessibility:** ARIA, keyboard navigation, screen reader support
- **Performance:** Optimized re-renders, lazy loading
- **Error handling:** Comprehensive error scenarios covered
- **User Experience:** Smooth animations, loading states, helpful feedback

Implementacja powinna być wykonywana krok po kroku, z testowaniem na każdym etapie. Należy zwrócić szczególną uwagę na integrację z API oraz obsługę przypadków brzegowych.
