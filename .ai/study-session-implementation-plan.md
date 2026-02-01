# API Endpoint Implementation Plan: Study Sessions

## 1. Przegląd punktów końcowych

System sesji nauki umożliwia użytkownikom rozpoczynanie sesji nauki dla wybranej talii, przeglądanie fiszek z oceną trudności oraz śledzenie postępów. Implementacja obejmuje cztery główne endpointy REST API obsługujące pełny cykl życia sesji nauki wraz z integracją algorytmu SM-2 do zarządzania interwałami powtórek.

**Kluczowe funkcjonalności:**
- Tworzenie nowych sesji nauki dla wybranej talii
- Pobieranie szczegółów aktywnych i zakończonych sesji
- Przesyłanie ocen fiszek z automatyczną aktualizacją algorytmu SM-2
- Kończenie sesji z obliczaniem czasu trwania

**Algorytm SM-2 (SuperMemo 2):**
- Zarządza interwałami powtórek na podstawie ocen użytkownika (1-4)
- Aktualizuje: easiness_factor (1.3-2.5), interval (dni), repetitions (liczba poprawnych powtórek)
- Automatycznie oblicza next_review_date

## 2. Szczegóły endpointów

### 2.1 Create Study Session

**HTTP Method:** POST  
**Path:** `/api/study-sessions`  
**Plik:** `src/pages/api/study-sessions/index.ts`

**Parametry:**
- **Wymagane:**
  - `deck_id` (body): UUID talii, dla której tworzona jest sesja
- **Opcjonalne:** brak

**Request Body:**
```json
{
  "deck_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response:** `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "deck_id": "550e8400-e29b-41d4-a716-446655440000",
  "started_at": "2026-02-01T12:00:00Z",
  "ended_at": null,
  "cards_reviewed": 0
}
```

**Error Responses:**
- `400 Bad Request` - Nieprawidłowy format UUID lub walidacja nie powiodła się
- `401 Unauthorized` - Brak tokenu autoryzacji lub token nieprawidłowy
- `404 Not Found` - Talia nie istnieje lub nie należy do użytkownika

---

### 2.2 Get Study Session

**HTTP Method:** GET  
**Path:** `/api/study-sessions/:id`  
**Plik:** `src/pages/api/study-sessions/[id].ts`

**Parametry:**
- **Wymagane:**
  - `id` (path): UUID sesji nauki
- **Opcjonalne:** brak

**Success Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "deck_id": "550e8400-e29b-41d4-a716-446655440000",
  "deck_name": "Spanish Vocabulary",
  "started_at": "2026-02-01T12:00:00Z",
  "ended_at": null,
  "cards_reviewed": 5
}
```

**Error Responses:**
- `401 Unauthorized` - Brak tokenu autoryzacji lub token nieprawidłowy
- `404 Not Found` - Sesja nie istnieje lub nie należy do użytkownika

---

### 2.3 Submit Review

**HTTP Method:** POST  
**Path:** `/api/study-sessions/:sessionId/reviews`  
**Plik:** `src/pages/api/study-sessions/[sessionId]/reviews.ts`

**Parametry:**
- **Wymagane:**
  - `sessionId` (path): UUID sesji nauki
  - `flashcard_id` (body): UUID fiszki do oceny
  - `rating` (body): Ocena trudności (1=Again, 2=Hard, 3=Good, 4=Easy)
- **Opcjonalne:**
  - `response_time_ms` (body): Czas odpowiedzi w milisekundach (>= 0)

**Request Body:**
```json
{
  "flashcard_id": "770e8400-e29b-41d4-a716-446655440002",
  "rating": 3,
  "response_time_ms": 4500
}
```

**Success Response:** `200 OK`
```json
{
  "review_id": "880e8400-e29b-41d4-a716-446655440003",
  "flashcard": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "next_review_date": "2026-02-04T12:00:00Z",
    "easiness_factor": 2.6,
    "interval": 3,
    "repetitions": 3
  },
  "session": {
    "cards_reviewed": 6
  }
}
```

**Business Logic:**
1. Walidacja istnienia i własności sesji
2. Walidacja istnienia i własności fiszki
3. Obliczenie nowych wartości SM-2 na podstawie rating
4. Aktualizacja fiszki (easiness_factor, interval, repetitions, next_review_date, last_reviewed_at)
5. Utworzenie rekordu w review_history
6. Inkrementacja session.cards_reviewed
7. Zwrócenie szczegółowej odpowiedzi

**Error Responses:**
- `400 Bad Request` - Nieprawidłowe dane wejściowe (UUID, rating poza zakresem 1-4)
- `401 Unauthorized` - Brak tokenu autoryzacji lub token nieprawidłowy
- `404 Not Found` - Sesja lub fiszka nie istnieje lub nie należy do użytkownika

---

### 2.4 Complete Study Session

**HTTP Method:** PATCH  
**Path:** `/api/study-sessions/:id/complete`  
**Plik:** `src/pages/api/study-sessions/[id]/complete.ts`

**Parametry:**
- **Wymagane:**
  - `id` (path): UUID sesji nauki
- **Opcjonalne:** brak

**Success Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "deck_id": "550e8400-e29b-41d4-a716-446655440000",
  "started_at": "2026-02-01T12:00:00Z",
  "ended_at": "2026-02-01T12:15:00Z",
  "cards_reviewed": 12,
  "duration_seconds": 900
}
```

**Business Logic:**
1. Walidacja istnienia i własności sesji
2. Sprawdzenie czy sesja nie jest już zakończona (ended_at === null)
3. Ustawienie ended_at na aktualny timestamp
4. Obliczenie duration_seconds (ended_at - started_at)
5. Zwrócenie zaktualizowanej sesji z duration_seconds

**Error Responses:**
- `401 Unauthorized` - Brak tokenu autoryzacji lub token nieprawidłowy
- `404 Not Found` - Sesja nie istnieje lub nie należy do użytkownika
- `409 Conflict` - Sesja jest już zakończona (ended_at !== null)

## 3. Wykorzystywane typy

Wszystkie wymagane typy już istnieją w `src/types.ts`:

### DTOs (Data Transfer Objects)

```typescript
// Command dla tworzenia sesji
export interface CreateStudySessionCommand {
  deck_id: string;
}

// DTO dla podstawowych informacji o sesji
export interface StudySessionDTO {
  id: string;
  deck_id: string;
  started_at: string;
  ended_at: string | null;
  cards_reviewed: number;
}

// DTO dla szczegółów sesji z nazwą talii
export interface StudySessionDetailDTO extends StudySessionDTO {
  deck_name: string;
}

// Typ dla oceny fiszki (SM-2 rating)
export type ReviewRating = 1 | 2 | 3 | 4;

// Command dla przesyłania recenzji
export interface SubmitReviewCommand {
  flashcard_id: string;
  rating: ReviewRating;
  response_time_ms?: number;
}

// Odpowiedź dla przesłania recenzji
export interface SubmitReviewResponseDTO {
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

// Odpowiedź dla zakończenia sesji
export interface CompleteStudySessionResponseDTO extends StudySessionDTO {
  duration_seconds: number;
}
```

### Entity Types (Database Models)

```typescript
// Typy bazodanowe dostępne w src/types.ts
export type ReviewSession = Tables<"review_sessions">;
export type ReviewHistory = Tables<"review_history">;
export type ReviewSessionInsert = TablesInsert<"review_sessions">;
export type ReviewHistoryInsert = TablesInsert<"review_history">;
export type ReviewSessionUpdate = TablesUpdate<"review_sessions">;
```

## 4. Walidacja danych (Zod Schemas)

Utworzyć nowy plik: `src/lib/schemas/study-session.schema.ts`

```typescript
import { z } from "zod";

// Walidacja tworzenia sesji nauki
export const createStudySessionSchema = z.object({
  deck_id: z.string().uuid({ message: "Invalid deck ID format" }),
});

// Walidacja UUID w path parameters (reusable)
export const sessionIdParamSchema = z.string().uuid({ message: "Invalid session ID format" });

// Walidacja przesyłania recenzji
export const submitReviewSchema = z.object({
  flashcard_id: z.string().uuid({ message: "Invalid flashcard ID format" }),
  rating: z.number().int().min(1).max(4, { message: "Rating must be between 1 and 4" }),
  response_time_ms: z.number().int().min(0, { message: "Response time must be non-negative" }).optional(),
});
```

## 5. Service Layer

Utworzyć nowy plik: `src/lib/services/study-session.service.ts`

### 5.1 Struktura klasy

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateStudySessionCommand,
  StudySessionDTO,
  StudySessionDetailDTO,
  SubmitReviewCommand,
  SubmitReviewResponseDTO,
  CompleteStudySessionResponseDTO,
  ReviewSessionInsert,
  ReviewHistoryInsert,
  FlashcardUpdate,
} from "@/types";
import { ApiError } from "@/lib/utils/error-handler";

export class StudySessionService {
  constructor(private supabase: SupabaseClient) {}

  // Metody serwisu (szczegóły poniżej)
}
```

### 5.2 Metody serwisu

#### `createSession(userId: string, command: CreateStudySessionCommand): Promise<StudySessionDTO>`

**Odpowiedzialność:**
- Weryfikacja istnienia talii i własności przez użytkownika
- Utworzenie nowego rekordu review_sessions
- Zwrócenie DTO z podstawowymi danymi sesji

**Logika:**
1. Sprawdź czy talia istnieje i należy do użytkownika (query do `decks`)
2. Jeśli nie - rzuć `ApiError NOT_FOUND 404`
3. Wstaw rekord do `review_sessions` z:
   - `user_id`: userId
   - `deck_id`: command.deck_id
   - `started_at`: NOW() (default)
   - `ended_at`: null
   - `cards_reviewed`: 0 (default)
4. Zwróć `StudySessionDTO`

---

#### `getSession(userId: string, sessionId: string): Promise<StudySessionDetailDTO>`

**Odpowiedzialność:**
- Pobranie szczegółów sesji wraz z nazwą talii
- Weryfikacja własności sesji

**Logika:**
1. Query do `review_sessions` z JOIN do `decks` dla pobrania `deck_name`
2. Filtruj po `id === sessionId` oraz `user_id === userId`
3. Jeśli brak wyniku - rzuć `ApiError NOT_FOUND 404`
4. Zwróć `StudySessionDetailDTO` z deck_name

---

#### `submitReview(userId: string, sessionId: string, command: SubmitReviewCommand): Promise<SubmitReviewResponseDTO>`

**Odpowiedzialność:**
- Walidacja sesji i fiszki
- Implementacja algorytmu SM-2
- Aktualizacja fiszki z nowymi wartościami SM-2
- Utworzenie rekordu w review_history
- Inkrementacja licznika cards_reviewed w sesji

**Logika:**

1. **Weryfikuj sesję:**
   - Pobierz sesję z `review_sessions` WHERE `id === sessionId` AND `user_id === userId`
   - Jeśli brak - rzuć `ApiError NOT_FOUND 404` ("Session not found")
   - Jeśli `ended_at !== null` - można odrzucić (sesja zakończona) lub zezwolić (decyzja biznesowa)

2. **Weryfikuj fiszkę:**
   - Pobierz fiszkę z `flashcards` WHERE `id === command.flashcard_id` AND `user_id === userId`
   - Jeśli brak - rzuć `ApiError NOT_FOUND 404` ("Flashcard not found")
   - Opcjonalnie: sprawdź czy fiszka należy do talii z sesji (deck_id matching)

3. **Pobierz aktualne wartości SM-2 z fiszki:**
   - `easiness_factor` (default: 2.5)
   - `interval` (default: 0)
   - `repetitions` (default: 0)

4. **Oblicz nowe wartości SM-2 na podstawie rating:**

**Algorytm SM-2:**

```typescript
function calculateSM2(
  rating: number, // 1-4
  easinessFactor: number, // 1.3-2.5
  interval: number, // dni
  repetitions: number // liczba poprawnych powtórek
): { easinessFactor: number; interval: number; repetitions: number; nextReviewDate: Date } {
  
  let newEasinessFactor = easinessFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Oblicz nowy easiness factor (dla wszystkich ratingów)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // gdzie q = quality (rating), ale w naszym przypadku rating jest 1-4, więc trzeba mapować:
  // rating 1 (Again) => q=0
  // rating 2 (Hard) => q=3
  // rating 3 (Good) => q=4
  // rating 4 (Easy) => q=5

  const qualityMap: Record<number, number> = { 1: 0, 2: 3, 3: 4, 4: 5 };
  const q = qualityMap[rating];
  
  newEasinessFactor = easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  // Ogranicz easiness factor do zakresu 1.3 - 2.5
  newEasinessFactor = Math.max(1.3, Math.min(2.5, newEasinessFactor));

  // Jeśli rating < 3 (Again lub Hard), resetuj postęp
  if (rating < 3) {
    newRepetitions = 0;
    newInterval = 1; // powtórka następnego dnia
  } else {
    // rating >= 3 (Good lub Easy), zwiększ postęp
    newRepetitions = repetitions + 1;
    
    if (newRepetitions === 1) {
      newInterval = 1; // pierwszy raz: 1 dzień
    } else if (newRepetitions === 2) {
      newInterval = 6; // drugi raz: 6 dni
    } else {
      // trzecia i kolejne: interval * easiness_factor
      newInterval = Math.round(interval * newEasinessFactor);
    }
    
    // Dla Easy (rating = 4), dodatkowo zwiększ interval
    if (rating === 4) {
      newInterval = Math.round(newInterval * 1.3);
    }
  }

  // Oblicz next_review_date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easinessFactor: newEasinessFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}
```

5. **Aktualizuj fiszkę:**
   - UPDATE `flashcards` SET:
     - `easiness_factor = newEasinessFactor`
     - `interval = newInterval`
     - `repetitions = newRepetitions`
     - `next_review_date = nextReviewDate`
     - `last_reviewed_at = NOW()`
   - WHERE `id === flashcard_id` AND `user_id === userId`

6. **Utwórz rekord review_history:**
   - INSERT INTO `review_history`:
     - `user_id`: userId
     - `flashcard_id`: command.flashcard_id
     - `session_id`: sessionId
     - `rating`: command.rating
     - `response_time_ms`: command.response_time_ms (nullable)
     - `reviewed_at`: NOW() (default)

7. **Inkrementuj cards_reviewed w sesji:**
   - UPDATE `review_sessions` SET `cards_reviewed = cards_reviewed + 1`
   - WHERE `id === sessionId` AND `user_id === userId`
   - Pobierz nową wartość cards_reviewed

8. **Zwróć SubmitReviewResponseDTO:**
   ```typescript
   {
     review_id: string, // ID z review_history
     flashcard: {
       id: command.flashcard_id,
       next_review_date: nextReviewDate.toISOString(),
       easiness_factor: newEasinessFactor,
       interval: newInterval,
       repetitions: newRepetitions,
     },
     session: {
       cards_reviewed: newCardsReviewed,
     },
   }
   ```

---

#### `completeSession(userId: string, sessionId: string): Promise<CompleteStudySessionResponseDTO>`

**Odpowiedzialność:**
- Sprawdzenie czy sesja istnieje i należy do użytkownika
- Weryfikacja czy sesja nie jest już zakończona
- Ustawienie ended_at i obliczenie duration_seconds

**Logika:**

1. **Pobierz sesję:**
   - SELECT * FROM `review_sessions` WHERE `id === sessionId` AND `user_id === userId`
   - Jeśli brak - rzuć `ApiError NOT_FOUND 404`

2. **Sprawdź czy sesja nie jest zakończona:**
   - Jeśli `ended_at !== null` - rzuć `ApiError CONFLICT 409` ("Session already completed")

3. **Zaktualizuj sesję:**
   - UPDATE `review_sessions` SET `ended_at = NOW()`
   - WHERE `id === sessionId` AND `user_id === userId`
   - Pobierz zaktualizowany rekord

4. **Oblicz duration_seconds:**
   ```typescript
   const startedAt = new Date(session.started_at);
   const endedAt = new Date(session.ended_at!);
   const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
   ```

5. **Zwróć CompleteStudySessionResponseDTO:**
   ```typescript
   {
     id: session.id,
     deck_id: session.deck_id,
     started_at: session.started_at,
     ended_at: session.ended_at,
     cards_reviewed: session.cards_reviewed,
     duration_seconds: durationSeconds,
   }
   ```

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Implementacja:**
```typescript
const {
  data: { user },
  error: authError,
} = await locals.supabase.auth.getUser();

if (authError || !user) {
  throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
}
```

**Zastosowanie:** Wszystkie 4 endpointy wymagają autoryzacji Bearer token.

### 6.2 Autoryzacja (Authorization)

**Poziomy kontroli dostępu:**

1. **Własność talii** (createSession):
   - Weryfikuj `decks.user_id === userId` przed utworzeniem sesji
   - Zapobiega tworzeniu sesji dla cudzych talii

2. **Własność sesji** (getSession, completeSession, submitReview):
   - Zawsze filtruj `review_sessions.user_id === userId`
   - Zapobiega dostępowi do cudzych sesji

3. **Własność fiszki** (submitReview):
   - Weryfikuj `flashcards.user_id === userId`
   - Opcjonalnie: weryfikuj `flashcards.deck_id === session.deck_id`
   - Zapobiega ocenianiu cudzych fiszek lub fiszek spoza talii

### 6.3 Walidacja danych wejściowych

**Użycie Zod schemas:**
- Waliduj wszystkie UUID (deck_id, session_id, flashcard_id)
- Waliduj rating w zakresie 1-4
- Waliduj response_time_ms >= 0 (jeśli podano)
- Waliduj obecność wymaganych pól

**Obsługa błędów walidacji:**
```typescript
try {
  const validatedData = submitReviewSchema.parse(body);
} catch (error) {
  // handleApiError automatycznie konwertuje ZodError na ApiError 400
  return handleApiError(error);
}
```

### 6.4 SQL Injection Prevention

**Używanie Supabase Query Builder:**
- NIGDY nie konstruuj surowych zapytań SQL z parametrów użytkownika
- Używaj metod Supabase (.eq(), .insert(), .update()) które automatycznie escapują parametry
- Supabase stosuje parametryzowane zapytania

### 6.5 Row Level Security (RLS)

**Polityki RLS na review_sessions:**
- Użytkownicy mogą SELECT/INSERT/UPDATE tylko swoje sesje
- Polityka: `user_id = auth.uid()`

**Polityki RLS na review_history:**
- Użytkownicy mogą INSERT/SELECT tylko swoje recenzje
- Polityka: `user_id = auth.uid()`

**Polityki RLS na flashcards:**
- Użytkownicy mogą UPDATE tylko swoje fiszki
- Polityka: `user_id = auth.uid()`

**Uwaga:** Mimo RLS, waliduj własność w service layer dla lepszych komunikatów błędów.

### 6.6 Rate Limiting

**Rozważyć:**
- Limit tworzenia sesji (np. max 100 sesji/dzień na użytkownika)
- Limit przesyłania recenzji (np. max 1000 recenzji/dzień)
- Można użyć istniejącego `RateLimiterService` z projektu

### 6.7 Bezpieczeństwo biznesowe

**Scenariusze do rozważenia:**

1. **Przesyłanie recenzji do zakończonej sesji:**
   - Decyzja: Zezwolić czy zablokować?
   - Rekomendacja: Zablokować w submitReview (sprawdzić ended_at)

2. **Wielokrotne kończenie sesji:**
   - Zabezpieczone przez sprawdzenie ended_at w completeSession
   - Zwraca 409 Conflict jeśli już zakończona

3. **Ocenianie tej samej fiszki wielokrotnie w sesji:**
   - Dozwolone - każda recenzja to nowy rekord w review_history
   - SM-2 kumuluje się z poprzednią wartością

4. **Sesje bez żadnych recenzji:**
   - Dozwolone - można utworzyć i zakończyć sesję z cards_reviewed=0

## 7. Obsługa błędów

### 7.1 Mapa błędów

| Kod błędu | Status HTTP | Scenariusz | Komunikat |
|-----------|-------------|------------|-----------|
| VALIDATION_ERROR | 400 | Nieprawidłowe UUID, rating poza zakresem, brak wymaganych pól | "Validation failed" + szczegóły |
| UNAUTHORIZED | 401 | Brak tokenu, nieprawidłowy token | "Authentication required. Please log in." |
| NOT_FOUND | 404 | Talia/sesja/fiszka nie istnieje lub nie należy do użytkownika | "Deck/Session/Flashcard not found or does not belong to user" |
| CONFLICT | 409 | Próba zakończenia już zakończonej sesji | "Session already completed" |
| INTERNAL_ERROR | 500 | Błędy bazy danych, nieoczekiwane wyjątki | "An unexpected error occurred. Please try again later." |

### 7.2 Implementacja obsługi błędów

**Użycie istniejącego handleApiError:**

```typescript
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Logika biznesowa
  } catch (error) {
    return handleApiError(error);
  }
};
```

**handleApiError automatycznie:**
- Konwertuje ZodError na ApiError 400 z details
- Loguje błędy do konsoli
- Zwraca standardowy ErrorResponseDTO
- Ukrywa wewnętrzne szczegóły dla błędów 500

### 7.3 Struktura błędu

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Session not found or does not belong to user",
    "details": [] // opcjonalnie dla VALIDATION_ERROR
  }
}
```

### 7.4 Logowanie błędów

**Obecnie:**
- `handleApiError` loguje wszystkie błędy do konsoli
- Format: `console.error("API Error:", error)`

**Rozszerzenie (opcjonalne):**
- Można dodać persystencję błędów do tabeli error_logs
- Można integrować z zewnętrznym systemem monitoringu (Sentry, LogRocket)
- Dla błędów 500 można wysyłać alerty do administratorów

## 8. Rozważania dotyczące wydajności

### 8.1 Zapytania do bazy danych

**Optymalizacje:**

1. **Indeksy bazodanowe:**
   - `review_sessions(user_id, created_at)` - dla listowania sesji
   - `review_sessions(user_id, id)` - dla pobierania pojedynczej sesji
   - `review_history(session_id)` - dla agregacji recenzji
   - `review_history(flashcard_id)` - dla historii fiszki
   - `flashcards(user_id, deck_id)` - dla weryfikacji własności

2. **JOINs:**
   - W `getSession` używaj JOIN zamiast dwóch osobnych queries
   - Supabase: `.select('*, decks!inner(name)')` - single query

3. **Atomowość operacji:**
   - W `submitReview` użyj transakcji dla:
     - UPDATE flashcards
     - INSERT review_history
     - UPDATE review_sessions
   - Zapobiega niespójnościom danych

**Przykład transakcji (Supabase):**
```typescript
// Supabase nie wspiera natywnych transakcji w JS SDK
// Alternatywa: użyj RPC do Postgres funkcji z BEGIN/COMMIT
// Lub akceptuj ewentualną niespójność (eventual consistency)
// Dla tej aplikacji: wykonuj operacje sekwencyjnie, obsłuż rollback manualnie w catch
```

### 8.2 Cachowanie

**Możliwości:**

1. **Sesja użytkownika:**
   - Nie cachować - dane zmieniają się dynamicznie
   - Każde submitReview aktualizuje cards_reviewed

2. **Statystyki talii:**
   - W createSession weryfikujemy tylko istnienie talii
   - Lekkie zapytanie, nie wymaga cachowania

3. **SM-2 calculations:**
   - Pure function - wykonywana w pamięci
   - Bardzo szybka, brak potrzeby cachowania

### 8.3 Potencjalne wąskie gardła

**Zidentyfikowane:**

1. **submitReview - wielokrotne UPDATE/INSERT:**
   - Ryzyko: Wolne dla dużej liczby recenzji w krótkim czasie
   - Mitygacja: 
     - Użyj connection pooling (Supabase domyślnie)
     - Rozważ batch insert dla review_history jeśli frontend wysyła wiele recenzji naraz
     - Ogranicz rate limiting do 100 reviews/min

2. **getSession - JOIN z decks:**
   - Ryzyko: Niskie - single JOIN, indeksowane
   - Mitygacja: Upewnij się że decks.id ma PRIMARY KEY index

3. **completeSession - obliczanie duration:**
   - Ryzyko: Bardzo niskie - prosta operacja matematyczna
   - Mitygacja: Brak potrzeby

### 8.4 Skalowanie

**Dla przyszłości:**

1. **Partycjonowanie review_history:**
   - Jeśli tabela urośnie do milionów rekordów
   - Partycjonuj po reviewed_at (miesięcznie/rocznie)

2. **Archiwizacja starych sesji:**
   - Sesje starsze niż 1 rok można przenieść do archive_review_sessions
   - Zmniejsza rozmiar active table

3. **Read replicas:**
   - Dla GET /api/study-sessions/:id używaj read replica
   - POST/PATCH na primary database

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie - Utworzenie struktury plików

**Utworzyć:**
- `src/lib/schemas/study-session.schema.ts` - walidacja Zod
- `src/lib/services/study-session.service.ts` - logika biznesowa
- `src/pages/api/study-sessions/index.ts` - POST endpoint (create session)
- `src/pages/api/study-sessions/[id].ts` - GET endpoint (get session)
- `src/pages/api/study-sessions/[id]/complete.ts` - PATCH endpoint (complete session)
- `src/pages/api/study-sessions/[sessionId]/reviews.ts` - POST endpoint (submit review)

**Struktura katalogów:**
```
src/pages/api/study-sessions/
├── index.ts                    # POST /api/study-sessions
├── [id].ts                     # GET /api/study-sessions/:id
├── [id]/
│   └── complete.ts             # PATCH /api/study-sessions/:id/complete
└── [sessionId]/
    └── reviews.ts              # POST /api/study-sessions/:sessionId/reviews
```

---

### Krok 2: Implementacja schematów walidacji

**Plik:** `src/lib/schemas/study-session.schema.ts`

**Zawartość:**
```typescript
import { z } from "zod";

export const createStudySessionSchema = z.object({
  deck_id: z.string().uuid({ message: "Invalid deck ID format" }),
});

export const sessionIdParamSchema = z.string().uuid({ message: "Invalid session ID format" });

export const submitReviewSchema = z.object({
  flashcard_id: z.string().uuid({ message: "Invalid flashcard ID format" }),
  rating: z.number().int().min(1).max(4, { message: "Rating must be between 1 and 4" }),
  response_time_ms: z.number().int().min(0, { message: "Response time must be non-negative" }).optional(),
});
```

**Weryfikacja:**
- Testy jednostkowe dla każdego schematu
- Sprawdź edge cases (ujemne wartości, nieprawidłowe UUID)

---

### Krok 3: Implementacja StudySessionService - metoda createSession

**Plik:** `src/lib/services/study-session.service.ts`

**Metoda:**
```typescript
async createSession(userId: string, command: CreateStudySessionCommand): Promise<StudySessionDTO> {
  // 1. Weryfikacja własności talii
  const { data: deck, error: deckError } = await this.supabase
    .from("decks")
    .select("id")
    .eq("id", command.deck_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (deckError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to verify deck ownership", 500);
  }

  if (!deck) {
    throw new ApiError("NOT_FOUND", "Deck not found or does not belong to user", 404);
  }

  // 2. Utworzenie sesji
  const { data, error } = await this.supabase
    .from("review_sessions")
    .insert({
      user_id: userId,
      deck_id: command.deck_id,
    })
    .select()
    .single();

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create study session", 500);
  }

  return {
    id: data.id,
    deck_id: data.deck_id,
    started_at: data.started_at,
    ended_at: data.ended_at,
    cards_reviewed: data.cards_reviewed,
  };
}
```

**Testy:**
- ✅ Tworzenie sesji dla istniejącej talii
- ❌ Błąd 404 dla nieistniejącej talii
- ❌ Błąd 404 dla cudzej talii

---

### Krok 4: Implementacja StudySessionService - metoda getSession

**Metoda:**
```typescript
async getSession(userId: string, sessionId: string): Promise<StudySessionDetailDTO> {
  const { data, error } = await this.supabase
    .from("review_sessions")
    .select(`
      id,
      deck_id,
      started_at,
      ended_at,
      cards_reviewed,
      decks!inner(name)
    `)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to fetch study session", 500);
  }

  if (!data) {
    throw new ApiError("NOT_FOUND", "Session not found or does not belong to user", 404);
  }

  return {
    id: data.id,
    deck_id: data.deck_id,
    deck_name: Array.isArray(data.decks) ? data.decks[0]?.name || "" : data.decks?.name || "",
    started_at: data.started_at,
    ended_at: data.ended_at,
    cards_reviewed: data.cards_reviewed,
  };
}
```

**Testy:**
- ✅ Pobieranie własnej sesji z deck_name
- ❌ Błąd 404 dla nieistniejącej sesji
- ❌ Błąd 404 dla cudzej sesji

---

### Krok 5: Implementacja StudySessionService - helper calculateSM2

**Metoda pomocnicza:**
```typescript
private calculateSM2(
  rating: number,
  currentEF: number,
  currentInterval: number,
  currentRepetitions: number
): { easinessFactor: number; interval: number; repetitions: number; nextReviewDate: string } {
  
  // Mapowanie rating (1-4) na quality (0-5)
  const qualityMap: Record<number, number> = { 1: 0, 2: 3, 3: 4, 4: 5 };
  const q = qualityMap[rating];

  // Obliczenie nowego easiness factor
  let newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEF = Math.max(1.3, Math.min(2.5, newEF));

  let newInterval: number;
  let newRepetitions: number;

  if (rating < 3) {
    // Again lub Hard - resetuj postęp
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Good lub Easy - zwiększ postęp
    newRepetitions = currentRepetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEF);
    }

    // Bonus dla Easy
    if (rating === 4) {
      newInterval = Math.round(newInterval * 1.3);
    }
  }

  // Oblicz next_review_date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    easinessFactor: Number(newEF.toFixed(2)),
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextDate.toISOString(),
  };
}
```

**Testy jednostkowe:**
- ✅ Rating 1 (Again) - reset do repetitions=0, interval=1
- ✅ Rating 2 (Hard) - reset do repetitions=0, interval=1
- ✅ Rating 3 (Good) - zwiększ repetitions, oblicz interval
- ✅ Rating 4 (Easy) - zwiększ repetitions, bonus do interval
- ✅ Pierwsza powtórka (rep=0) - interval=1
- ✅ Druga powtórka (rep=1) - interval=6
- ✅ Trzecia+ powtórka (rep>=2) - interval *= EF
- ✅ EF w zakresie 1.3-2.5

---

### Krok 6: Implementacja StudySessionService - metoda submitReview

**Metoda:**
```typescript
async submitReview(
  userId: string,
  sessionId: string,
  command: SubmitReviewCommand
): Promise<SubmitReviewResponseDTO> {
  
  // 1. Weryfikuj sesję
  const { data: session, error: sessionError } = await this.supabase
    .from("review_sessions")
    .select("id, deck_id, ended_at, cards_reviewed")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to fetch study session", 500);
  }

  if (!session) {
    throw new ApiError("NOT_FOUND", "Session not found or does not belong to user", 404);
  }

  // Opcjonalnie: odrzuć jeśli sesja zakończona
  // if (session.ended_at) {
  //   throw new ApiError("CONFLICT", "Cannot submit review to completed session", 409);
  // }

  // 2. Weryfikuj fiszkę
  const { data: flashcard, error: flashcardError } = await this.supabase
    .from("flashcards")
    .select("id, deck_id, easiness_factor, interval, repetitions")
    .eq("id", command.flashcard_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (flashcardError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to fetch flashcard", 500);
  }

  if (!flashcard) {
    throw new ApiError("NOT_FOUND", "Flashcard not found or does not belong to user", 404);
  }

  // Opcjonalnie: weryfikuj deck_id matching
  // if (flashcard.deck_id !== session.deck_id) {
  //   throw new ApiError("BAD_REQUEST", "Flashcard does not belong to session deck", 400);
  // }

  // 3. Oblicz nowe wartości SM-2
  const sm2Result = this.calculateSM2(
    command.rating,
    flashcard.easiness_factor ?? 2.5,
    flashcard.interval ?? 0,
    flashcard.repetitions ?? 0
  );

  // 4. Aktualizuj fiszkę
  const { error: updateError } = await this.supabase
    .from("flashcards")
    .update({
      easiness_factor: sm2Result.easinessFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      next_review_date: sm2Result.nextReviewDate,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", command.flashcard_id)
    .eq("user_id", userId);

  if (updateError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update flashcard", 500);
  }

  // 5. Utwórz review_history
  const { data: review, error: reviewError } = await this.supabase
    .from("review_history")
    .insert({
      user_id: userId,
      flashcard_id: command.flashcard_id,
      session_id: sessionId,
      rating: command.rating,
      response_time_ms: command.response_time_ms ?? null,
    })
    .select("id")
    .single();

  if (reviewError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create review record", 500);
  }

  // 6. Inkrementuj cards_reviewed
  const { data: updatedSession, error: sessionUpdateError } = await this.supabase
    .from("review_sessions")
    .update({
      cards_reviewed: session.cards_reviewed + 1,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("cards_reviewed")
    .single();

  if (sessionUpdateError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update session progress", 500);
  }

  // 7. Zwróć response DTO
  return {
    review_id: review.id,
    flashcard: {
      id: command.flashcard_id,
      next_review_date: sm2Result.nextReviewDate,
      easiness_factor: sm2Result.easinessFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
    },
    session: {
      cards_reviewed: updatedSession.cards_reviewed,
    },
  };
}
```

**Testy:**
- ✅ Przesłanie poprawnej recenzji
- ✅ Aktualizacja SM-2 dla rating 1-4
- ✅ Utworzenie rekordu review_history
- ✅ Inkrementacja cards_reviewed
- ❌ Błąd 404 dla nieistniejącej sesji
- ❌ Błąd 404 dla nieistniejącej fiszki
- ❌ Błąd 404 dla cudzej sesji
- ❌ Błąd 404 dla cudzej fiszki

---

### Krok 7: Implementacja StudySessionService - metoda completeSession

**Metoda:**
```typescript
async completeSession(userId: string, sessionId: string): Promise<CompleteStudySessionResponseDTO> {
  
  // 1. Pobierz sesję
  const { data: session, error: sessionError } = await this.supabase
    .from("review_sessions")
    .select("id, deck_id, started_at, ended_at, cards_reviewed")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to fetch study session", 500);
  }

  if (!session) {
    throw new ApiError("NOT_FOUND", "Session not found or does not belong to user", 404);
  }

  // 2. Sprawdź czy nie jest już zakończona
  if (session.ended_at !== null) {
    throw new ApiError("CONFLICT", "Session already completed", 409);
  }

  // 3. Zaktualizuj sesję
  const now = new Date().toISOString();
  const { data: updatedSession, error: updateError } = await this.supabase
    .from("review_sessions")
    .update({
      ended_at: now,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to complete study session", 500);
  }

  // 4. Oblicz duration_seconds
  const startedAt = new Date(updatedSession.started_at);
  const endedAt = new Date(updatedSession.ended_at!);
  const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

  // 5. Zwróć response DTO
  return {
    id: updatedSession.id,
    deck_id: updatedSession.deck_id,
    started_at: updatedSession.started_at,
    ended_at: updatedSession.ended_at,
    cards_reviewed: updatedSession.cards_reviewed,
    duration_seconds: durationSeconds,
  };
}
```

**Testy:**
- ✅ Zakończenie aktywnej sesji
- ✅ Obliczenie duration_seconds
- ❌ Błąd 404 dla nieistniejącej sesji
- ❌ Błąd 409 dla już zakończonej sesji

---

### Krok 8: Implementacja endpointu POST /api/study-sessions

**Plik:** `src/pages/api/study-sessions/index.ts`

**Zawartość:**
```typescript
import type { APIRoute } from "astro";
import { StudySessionService } from "@/lib/services/study-session.service";
import { createStudySessionSchema } from "@/lib/schemas/study-session.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * POST /api/study-sessions - Create new study session
 *
 * Request Body (CreateStudySessionCommand):
 * - deck_id: UUID of the deck to study
 *
 * @returns {StudySessionDTO} 201 - Created study session
 * @returns {ErrorResponseDTO} 400 - Validation error
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Deck not found or does not belong to user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validation
    const body = await request.json();
    const validatedData = createStudySessionSchema.parse(body);

    // Create session
    const sessionService = new StudySessionService(locals.supabase);
    const session = await sessionService.createSession(user.id, validatedData);

    return new Response(JSON.stringify(session), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Testy:**
- ✅ 201 dla poprawnego żądania
- ❌ 400 dla nieprawidłowego deck_id
- ❌ 401 bez tokenu
- ❌ 404 dla nieistniejącej talii

---

### Krok 9: Implementacja endpointu GET /api/study-sessions/:id

**Plik:** `src/pages/api/study-sessions/[id].ts`

**Zawartość:**
```typescript
import type { APIRoute } from "astro";
import { StudySessionService } from "@/lib/services/study-session.service";
import { sessionIdParamSchema } from "@/lib/schemas/study-session.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/study-sessions/:id - Get study session details
 *
 * Path Parameters:
 * - id: Study session UUID
 *
 * @returns {StudySessionDetailDTO} 200 - Study session with deck name
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Session not found or does not belong to user
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validation
    const sessionId = sessionIdParamSchema.parse(params.id);

    // Fetch session
    const sessionService = new StudySessionService(locals.supabase);
    const session = await sessionService.getSession(user.id, sessionId);

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Testy:**
- ✅ 200 dla własnej sesji
- ❌ 401 bez tokenu
- ❌ 404 dla nieistniejącej sesji
- ❌ 404 dla cudzej sesji

---

### Krok 10: Implementacja endpointu POST /api/study-sessions/:sessionId/reviews

**Plik:** `src/pages/api/study-sessions/[sessionId]/reviews.ts`

**Uwaga:** Katalog `[sessionId]` musi być utworzony.

**Zawartość:**
```typescript
import type { APIRoute } from "astro";
import { StudySessionService } from "@/lib/services/study-session.service";
import { sessionIdParamSchema, submitReviewSchema } from "@/lib/schemas/study-session.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * POST /api/study-sessions/:sessionId/reviews - Submit flashcard review
 *
 * Path Parameters:
 * - sessionId: Study session UUID
 *
 * Request Body (SubmitReviewCommand):
 * - flashcard_id: UUID of the flashcard being reviewed
 * - rating: Difficulty rating 1-4 (1=Again, 2=Hard, 3=Good, 4=Easy)
 * - response_time_ms (optional): Time taken to review in milliseconds
 *
 * @returns {SubmitReviewResponseDTO} 200 - Review submitted with updated SM-2 state
 * @returns {ErrorResponseDTO} 400 - Validation error
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Session or flashcard not found
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validation
    const sessionId = sessionIdParamSchema.parse(params.sessionId);
    const body = await request.json();
    const validatedData = submitReviewSchema.parse(body);

    // Submit review
    const sessionService = new StudySessionService(locals.supabase);
    const result = await sessionService.submitReview(user.id, sessionId, validatedData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Testy:**
- ✅ 200 dla poprawnej recenzji
- ✅ Aktualizacja SM-2 w odpowiedzi
- ✅ Inkrementacja cards_reviewed
- ❌ 400 dla rating poza zakresem 1-4
- ❌ 400 dla nieprawidłowego UUID
- ❌ 401 bez tokenu
- ❌ 404 dla nieistniejącej sesji
- ❌ 404 dla nieistniejącej fiszki

---

### Krok 11: Implementacja endpointu PATCH /api/study-sessions/:id/complete

**Plik:** `src/pages/api/study-sessions/[id]/complete.ts`

**Uwaga:** Katalog `[id]` może być współdzielony z GET endpoint - ale ze względu na różne metody HTTP (GET vs PATCH) można je mieć w osobnych plikach lub w tym samym (eksportując GET i PATCH).

**Zawartość:**
```typescript
import type { APIRoute } from "astro";
import { StudySessionService } from "@/lib/services/study-session.service";
import { sessionIdParamSchema } from "@/lib/schemas/study-session.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * PATCH /api/study-sessions/:id/complete - Mark study session as completed
 *
 * Path Parameters:
 * - id: Study session UUID
 *
 * @returns {CompleteStudySessionResponseDTO} 200 - Completed session with duration
 * @returns {ErrorResponseDTO} 401 - Authentication required
 * @returns {ErrorResponseDTO} 404 - Session not found
 * @returns {ErrorResponseDTO} 409 - Session already completed
 */
export const PATCH: APIRoute = async ({ params, locals }) => {
  try {
    // Authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Validation
    const sessionId = sessionIdParamSchema.parse(params.id);

    // Complete session
    const sessionService = new StudySessionService(locals.supabase);
    const result = await sessionService.completeSession(user.id, sessionId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Testy:**
- ✅ 200 dla aktywnej sesji
- ✅ Obliczenie duration_seconds
- ❌ 401 bez tokenu
- ❌ 404 dla nieistniejącej sesji
- ❌ 409 dla już zakończonej sesji

---

### Krok 12: Testy manualne

**Przygotowanie:**
1. Uruchom lokalne środowisko: `npx supabase start`
2. Uruchom dev server: `npm run dev`
3. Zaloguj się i uzyskaj token: `bash scripts/login.js`

**Test flow:**

```bash
# 1. Utwórz sesję
curl -X POST http://localhost:3000/api/study-sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"deck_id":"<deck_uuid>"}'

# Oczekiwane: 201 Created z session_id

# 2. Pobierz sesję
curl -X GET http://localhost:3000/api/study-sessions/<session_id> \
  -H "Authorization: Bearer <token>"

# Oczekiwane: 200 OK z deck_name

# 3. Prześlij recenzję
curl -X POST http://localhost:3000/api/study-sessions/<session_id>/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"flashcard_id":"<flashcard_uuid>","rating":3,"response_time_ms":4500}'

# Oczekiwane: 200 OK z updated SM-2 state i cards_reviewed=1

# 4. Prześlij kolejną recenzję
# Powtórz krok 3 z inną fiszką lub tą samą

# Oczekiwane: cards_reviewed=2

# 5. Zakończ sesję
curl -X PATCH http://localhost:3000/api/study-sessions/<session_id>/complete \
  -H "Authorization: Bearer <token>"

# Oczekiwane: 200 OK z ended_at i duration_seconds

# 6. Spróbuj ponownie zakończyć sesję
curl -X PATCH http://localhost:3000/api/study-sessions/<session_id>/complete \
  -H "Authorization: Bearer <token>"

# Oczekiwane: 409 Conflict - "Session already completed"
```

**Weryfikacja w bazie:**
```sql
-- Sprawdź sesję
SELECT * FROM review_sessions WHERE id = '<session_id>';

-- Sprawdź recenzje
SELECT * FROM review_history WHERE session_id = '<session_id>';

-- Sprawdź aktualizacje fiszek
SELECT id, easiness_factor, interval, repetitions, next_review_date, last_reviewed_at
FROM flashcards WHERE id = '<flashcard_id>';
```

---

### Krok 13: Testy automatyczne (opcjonalnie)

**Utworzyć:** `scripts/test-study-sessions.sh`

**Zawartość:**
```bash
#!/bin/bash

# Skrypt testowy dla Study Sessions API
# Wymaga: zmiennej SESSION_TOKEN z aktywnym tokenem

set -e

BASE_URL="http://localhost:3000/api"
TOKEN="${SESSION_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "Error: SESSION_TOKEN not set"
  exit 1
fi

echo "=== Testing Study Sessions API ==="

# 1. Create session (wymaga deck_id)
echo -e "\n1. Creating study session..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/study-sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deck_id":"'"$DECK_ID"'"}')

SESSION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
echo "Session created: $SESSION_ID"

# 2. Get session
echo -e "\n2. Getting study session..."
curl -s -X GET "$BASE_URL/study-sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Submit review (wymaga flashcard_id)
echo -e "\n3. Submitting review..."
curl -s -X POST "$BASE_URL/study-sessions/$SESSION_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"flashcard_id":"'"$FLASHCARD_ID"'","rating":3,"response_time_ms":4500}' | jq

# 4. Complete session
echo -e "\n4. Completing study session..."
curl -s -X PATCH "$BASE_URL/study-sessions/$SESSION_ID/complete" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Try completing again (should fail with 409)
echo -e "\n5. Trying to complete again (should fail)..."
curl -s -X PATCH "$BASE_URL/study-sessions/$SESSION_ID/complete" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n=== All tests completed ==="
```

**Uruchomienie:**
```bash
export SESSION_TOKEN="<token>"
export DECK_ID="<deck_uuid>"
export FLASHCARD_ID="<flashcard_uuid>"
bash scripts/test-study-sessions.sh
```

---

### Krok 14: Dokumentacja API

**Zaktualizować:** Istniejącą dokumentację API (jeśli istnieje) o nowe endpointy.

**Pliki do aktualizacji:**
- `docs/API.md` - dodaj sekcję Study Sessions
- `README.md` - zaktualizuj listę dostępnych API

**Przykład dokumentacji:**
```markdown
## Study Sessions API

### Create Study Session
POST /api/study-sessions
[szczegóły...]

### Get Study Session
GET /api/study-sessions/:id
[szczegóły...]

### Submit Review
POST /api/study-sessions/:sessionId/reviews
[szczegóły...]

### Complete Study Session
PATCH /api/study-sessions/:id/complete
[szczegóły...]
```

---

### Krok 15: Code review i optymalizacja

**Checklist:**
- [ ] Wszystkie endpointy zwracają poprawne kody statusu
- [ ] Walidacja działa dla wszystkich edge cases
- [ ] Obsługa błędów jest spójna
- [ ] Autoryzacja weryfikuje własność zasobów
- [ ] SM-2 algorytm poprawnie oblicza wartości
- [ ] Testy manualne przeszły pomyślnie
- [ ] Kod jest zgodny z istniejącymi wzorcami w projekcie
- [ ] Brak SQL injection vulnerabilities
- [ ] Brak memory leaks
- [ ] Logi błędów są odpowiednie (nie ujawniają wrażliwych danych)
- [ ] Dokumentacja API jest aktualna

**Potencjalne optymalizacje:**
- Rozważyć transakcje dla submitReview (jeśli Supabase wspiera)
- Dodać indeksy bazodanowe jeśli jeszcze nie istnieją
- Rozważyć rate limiting dla submitReview
- Dodać metryki/monitoring dla produkcji

---

### Krok 16: Deployment

**Pre-deployment:**
1. Upewnij się że migracje bazy danych są zastosowane
2. Sprawdź zmienne środowiskowe (SUPABASE_URL, SUPABASE_ANON_KEY)
3. Uruchom testy na staging

**Deployment:**
1. Merge PR do main branch
2. Deploy do środowiska produkcyjnego
3. Uruchom smoke tests na produkcji
4. Monitoruj logi przez pierwsze 24h

**Post-deployment:**
1. Sprawdź metryki wydajności
2. Monitoruj rate błędów
3. Zbierz feedback od użytkowników
4. Planuj iteracje na podstawie analytics

---

## Podsumowanie kroków implementacji

1. ✅ Utworzenie struktury plików (schemas, service, endpoints)
2. ✅ Implementacja schematów walidacji Zod
3. ✅ Implementacja StudySessionService.createSession
4. ✅ Implementacja StudySessionService.getSession
5. ✅ Implementacja StudySessionService.calculateSM2 (helper)
6. ✅ Implementacja StudySessionService.submitReview
7. ✅ Implementacja StudySessionService.completeSession
8. ✅ Implementacja POST /api/study-sessions
9. ✅ Implementacja GET /api/study-sessions/:id
10. ✅ Implementacja POST /api/study-sessions/:sessionId/reviews
11. ✅ Implementacja PATCH /api/study-sessions/:id/complete
12. ✅ Testy manualne z curl
13. ⚪ Testy automatyczne (opcjonalne)
14. ✅ Aktualizacja dokumentacji API
15. ✅ Code review i optymalizacja
16. ⚪ Deployment (po code review)

---

## Metryki sukcesu

**Funkcjonalne:**
- ✅ Wszystkie 4 endpointy działają zgodnie ze specyfikacją
- ✅ SM-2 algorytm poprawnie aktualizuje fiszki
- ✅ Walidacja odrzuca nieprawidłowe dane
- ✅ Autoryzacja chroni zasoby użytkowników

**Niefunkcjonalne:**
- ✅ Czas odpowiedzi < 500ms dla wszystkich endpointów
- ✅ Brak błędów 500 w testach
- ✅ Kod coverage > 80% (jeśli stosowane)
- ✅ Zero SQL injection vulnerabilities
- ✅ Zero security vulnerabilities wykrytych przez audyt

**Biznesowe:**
- ✅ Użytkownicy mogą rozpoczynać i kończyć sesje nauki
- ✅ Fiszki są aktualizowane na podstawie ocen użytkownika
- ✅ System śledzenia postępów działa poprawnie
- ✅ Analytics pokazują wykorzystanie funkcji sesji nauki
