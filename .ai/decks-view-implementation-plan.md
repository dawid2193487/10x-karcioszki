# API Endpoint Implementation Plan: Decks Management

## 1. Przegląd punktów końcowych

System zarządzania taliami fiszek składa się z 6 endpointów REST API obsługujących pełny cykl życia talii:

- **GET /api/decks** - Lista wszystkich talii użytkownika z paginacją i statystykami
- **GET /api/decks/:id** - Szczegółowe informacje o konkretnej talii
- **POST /api/decks** - Tworzenie nowej talii
- **PATCH /api/decks/:id** - Aktualizacja nazwy talii
- **DELETE /api/decks/:id** - Usuwanie talii (kaskadowo usuwa fiszki)
- **GET /api/decks/:id/due** - Lista fiszek wymagających powtórki w danej talii

Wszystkie endpointy wymagają uwierzytelnienia poprzez Bearer token i zapewniają autoryzację na poziomie właściciela zasobu.

## 2. Szczegóły żądań

### 2.1 List Decks (GET /api/decks)

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/decks`
- **Headers**:
  - `Authorization: Bearer <token>` (wymagany)
- **Query Parameters**:
  - **Opcjonalne**:
    - `page` - Numer strony (domyślnie: 1, min: 1)
    - `limit` - Liczba elementów na stronie (domyślnie: 20, max: 100)
- **Request Body**: Brak

### 2.2 Get Deck (GET /api/decks/:id)

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/decks/:id`
- **Headers**:
  - `Authorization: Bearer <token>` (wymagany)
- **Path Parameters**:
  - **Wymagane**:
    - `id` - UUID talii
- **Query Parameters**: Brak
- **Request Body**: Brak

### 2.3 Create Deck (POST /api/decks)

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/decks`
- **Headers**:
  - `Authorization: Bearer <token>` (wymagany)
  - `Content-Type: application/json`
- **Request Body**:
  - **Wymagane**:
    - `name` (string, 1-100 znaków) - Nazwa talii

```json
{
  "name": "Spanish Vocabulary"
}
```

### 2.4 Update Deck (PATCH /api/decks/:id)

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/decks/:id`
- **Headers**:
  - `Authorization: Bearer <token>` (wymagany)
  - `Content-Type: application/json`
- **Path Parameters**:
  - **Wymagane**:
    - `id` - UUID talii
- **Request Body**:
  - **Wymagane**:
    - `name` (string, 1-100 znaków) - Nowa nazwa talii

```json
{
  "name": "Updated Deck Name"
}
```

### 2.5 Delete Deck (DELETE /api/decks/:id)

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/decks/:id`
- **Headers**:
  - `Authorization: Bearer <token>` (wymagany)
- **Path Parameters**:
  - **Wymagane**:
    - `id` - UUID talii
- **Request Body**: Brak

### 2.6 Get Due Cards (GET /api/decks/:id/due)

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/decks/:id/due`
- **Headers**:
  - `Authorization: Bearer <token>` (wymagany)
- **Path Parameters**:
  - **Wymagane**:
    - `id` - UUID talii
- **Query Parameters**:
  - **Opcjonalne**:
    - `limit` - Maksymalna liczba kart do zwrócenia (domyślnie: 20, max: 100)
- **Request Body**: Brak

## 3. Wykorzystywane typy

### 3.1 Istniejące typy (src/types.ts)

Wszystkie wymagane typy są już zdefiniowane w `src/types.ts`:

**DTOs:**
- `DeckListItemDTO` - Element listy talii z podstawowymi statystykami
- `DeckDetailDTO` - Szczegółowe informacje o talii z rozszerzonymi statystykami
- `DeckDTO` - Alias dla DeckDetailDTO
- `DeckListResponseDTO` - Odpowiedź z paginowaną listą talii
- `DueFlashcardDTO` - Fiszka wymagająca powtórki
- `DueCardsResponseDTO` - Lista fiszek do powtórki
- `PaginationDTO` - Metadane paginacji

**Commands:**
- `CreateDeckCommand` - Polecenie tworzenia talii
- `UpdateDeckCommand` - Polecenie aktualizacji talii

**Query Parameters:**
- `PaginationQueryParams` - Parametry paginacji (page, limit)
- `DueCardsQueryParams` - Parametry dla fiszek do powtórki

**Database Types:**
- `Deck` - Entity type z tabeli decks
- `DeckInsert` - Type dla insertu
- `DeckUpdate` - Type dla update

### 3.2 Nowe schematy walidacji (do utworzenia)

Utworzyć plik: `src/lib/schemas/deck.schema.ts`

```typescript
import { z } from "zod";

// Walidacja parametrów paginacji dla listy talii
export const deckQueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Walidacja tworzenia talii
export const createDeckSchema = z.object({
  name: z.string().min(1).max(100),
});

// Walidacja aktualizacji talii
export const updateDeckSchema = z.object({
  name: z.string().min(1).max(100),
});

// Walidacja parametrów dla due cards
export const dueCardsQueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Walidacja UUID w path parameters (można zaimportować z flashcard.schema.ts)
export const uuidParamSchema = z.string().uuid();
```

## 4. Szczegóły odpowiedzi

### 4.1 List Decks (GET /api/decks)

**200 OK** - Sukces
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Spanish Vocabulary",
      "flashcard_count": 45,
      "due_count": 12,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-02-01T08:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

**401 Unauthorized** - Brak lub nieprawidłowy token
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

**400 Bad Request** - Nieprawidłowe parametry paginacji
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "limit",
        "message": "Number must be less than or equal to 100"
      }
    ]
  }
}
```

### 4.2 Get Deck (GET /api/decks/:id)

**200 OK** - Sukces
```json
{
  "id": "uuid",
  "name": "Spanish Vocabulary",
  "flashcard_count": 45,
  "due_count": 12,
  "new_count": 5,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-01T08:20:00Z"
}
```

**401 Unauthorized** - Brak uwierzytelnienia

**404 Not Found** - Talia nie istnieje lub nie należy do użytkownika
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Deck not found or does not belong to user"
  }
}
```

**400 Bad Request** - Nieprawidłowy UUID
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "id",
        "message": "Invalid UUID"
      }
    ]
  }
}
```

### 4.3 Create Deck (POST /api/decks)

**201 Created** - Talia utworzona
```json
{
  "id": "uuid",
  "name": "Spanish Vocabulary",
  "flashcard_count": 0,
  "due_count": 0,
  "new_count": 0,
  "created_at": "2026-02-01T12:00:00Z",
  "updated_at": "2026-02-01T12:00:00Z"
}
```

**400 Bad Request** - Błąd walidacji
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "String must contain at least 1 character(s)"
      }
    ]
  }
}
```

**401 Unauthorized** - Brak uwierzytelnienia

### 4.4 Update Deck (PATCH /api/decks/:id)

**200 OK** - Zaktualizowano pomyślnie
```json
{
  "id": "uuid",
  "name": "Updated Deck Name",
  "flashcard_count": 45,
  "due_count": 12,
  "new_count": 5,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-01T12:30:00Z"
}
```

**400 Bad Request** - Błąd walidacji

**401 Unauthorized** - Brak uwierzytelnienia

**404 Not Found** - Talia nie istnieje lub nie należy do użytkownika

### 4.5 Delete Deck (DELETE /api/decks/:id)

**204 No Content** - Talia usunięta (brak body)

**401 Unauthorized** - Brak uwierzytelnienia

**404 Not Found** - Talia nie istnieje lub nie należy do użytkownika

**400 Bad Request** - Nieprawidłowy UUID

### 4.6 Get Due Cards (GET /api/decks/:id/due)

**200 OK** - Lista fiszek do powtórki
```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "front": "¿Cómo estás?",
      "back": "How are you?",
      "next_review_date": "2026-02-01T12:00:00Z",
      "easiness_factor": 2.5,
      "interval": 1,
      "repetitions": 2
    }
  ],
  "total": 12
}
```

**401 Unauthorized** - Brak uwierzytelnienia

**404 Not Found** - Talia nie istnieje lub nie należy do użytkownika

**400 Bad Request** - Nieprawidłowy UUID lub limit

## 5. Przepływ danych

### 5.1 Przepływ uwierzytelniania (wspólny dla wszystkich endpointów)

```
1. Żądanie HTTP z headerem Authorization: Bearer <token>
   ↓
2. Middleware (src/middleware/index.ts) wyodrębnia token
   ↓
3. Tworzy Supabase client z tokenem w headerach
   ↓
4. Przekazuje locals.supabase do route handlera
   ↓
5. Route handler wywołuje locals.supabase.auth.getUser()
   ↓
6. Jeśli błąd lub brak użytkownika → 401 Unauthorized
   ↓
7. Jeśli sukces → kontynuuj przetwarzanie
```

### 5.2 List Decks (GET /api/decks)

```
1. Route handler otrzymuje żądanie
   ↓
2. Uwierzytelnienie użytkownika (wspólny przepływ)
   ↓
3. Parsowanie i walidacja query params (page, limit) przez Zod
   ↓
4. Wywołanie DeckService.listDecks(userId, params)
   ↓
5. Service wykonuje query do Supabase:
   - SELECT z tabeli decks WHERE user_id = userId
   - LEFT JOIN do flashcards dla liczenia statystyk
   - COUNT(*) dla total
   - ORDER BY created_at DESC
   - LIMIT/OFFSET dla paginacji
   ↓
6. Service oblicza:
   - flashcard_count (COUNT wszystkich fiszek)
   - due_count (COUNT fiszek z next_review_date <= NOW())
   ↓
7. Transformacja do DeckListItemDTO[]
   ↓
8. Obliczenie metadanych paginacji (total_pages)
   ↓
9. Zwrot DeckListResponseDTO z kodem 200
```

### 5.3 Get Deck (GET /api/decks/:id)

```
1. Route handler otrzymuje żądanie z parametrem :id
   ↓
2. Uwierzytelnienie użytkownika
   ↓
3. Walidacja UUID przez Zod (uuidParamSchema)
   ↓
4. Wywołanie DeckService.getDeck(userId, deckId)
   ↓
5. Service wykonuje query:
   - SELECT deck WHERE id = deckId AND user_id = userId
   - LEFT JOIN do flashcards dla statystyk
   ↓
6. Jeśli brak wyniku → throw ApiError 404
   ↓
7. Service oblicza:
   - flashcard_count
   - due_count
   - new_count (COUNT fiszek z repetitions = 0 lub NULL)
   ↓
8. Transformacja do DeckDetailDTO
   ↓
9. Zwrot z kodem 200
```

### 5.4 Create Deck (POST /api/decks)

```
1. Route handler otrzymuje żądanie z body
   ↓
2. Uwierzytelnienie użytkownika
   ↓
3. Parsowanie JSON body
   ↓
4. Walidacja przez createDeckSchema (Zod)
   ↓
5. Wywołanie DeckService.createDeck(userId, command)
   ↓
6. Service wykonuje INSERT:
   - INSERT INTO decks (user_id, name) VALUES (userId, name)
   - RETURNING *
   ↓
7. Nowo utworzona talia ma:
   - flashcard_count = 0
   - due_count = 0
   - new_count = 0
   ↓
8. Transformacja do DeckDTO
   ↓
9. Zwrot z kodem 201
```

### 5.5 Update Deck (PATCH /api/decks/:id)

```
1. Route handler otrzymuje żądanie z :id i body
   ↓
2. Uwierzytelnienie użytkownika
   ↓
3. Walidacja UUID parametru
   ↓
4. Parsowanie i walidacja body (updateDeckSchema)
   ↓
5. Wywołanie DeckService.updateDeck(userId, deckId, command)
   ↓
6. Service weryfikuje własność:
   - SELECT FROM decks WHERE id = deckId AND user_id = userId
   - Jeśli brak → throw ApiError 404
   ↓
7. Service wykonuje UPDATE:
   - UPDATE decks SET name = newName, updated_at = NOW()
   - WHERE id = deckId AND user_id = userId
   - RETURNING *
   ↓
8. Ponowne pobranie statystyk (jak w Get Deck)
   ↓
9. Transformacja do DeckDTO
   ↓
10. Zwrot z kodem 200
```

### 5.6 Delete Deck (DELETE /api/decks/:id)

```
1. Route handler otrzymuje żądanie z :id
   ↓
2. Uwierzytelnienie użytkownika
   ↓
3. Walidacja UUID parametru
   ↓
4. Wywołanie DeckService.deleteDeck(userId, deckId)
   ↓
5. Service wykonuje DELETE:
   - DELETE FROM decks WHERE id = deckId AND user_id = userId
   ↓
6. Sprawdzenie rowCount z response:
   - Jeśli 0 → throw ApiError 404
   ↓
7. CASCADE automatycznie usuwa powiązane flashcards (DB constraint)
   ↓
8. Zwrot Response z kodem 204 (bez body)
```

### 5.7 Get Due Cards (GET /api/decks/:id/due)

```
1. Route handler otrzymuje żądanie z :id
   ↓
2. Uwierzytelnienie użytkownika
   ↓
3. Walidacja UUID parametru
   ↓
4. Parsowanie i walidacja query params (limit)
   ↓
5. Wywołanie DeckService.getDueCards(userId, deckId, limit)
   ↓
6. Service weryfikuje własność talii:
   - SELECT FROM decks WHERE id = deckId AND user_id = userId
   - Jeśli brak → throw ApiError 404
   ↓
7. Service wykonuje query dla fiszek:
   - SELECT FROM flashcards
   - WHERE deck_id = deckId
   - AND (next_review_date IS NULL OR next_review_date <= NOW())
   - ORDER BY next_review_date ASC NULLS FIRST
   - LIMIT limit
   ↓
8. COUNT total fiszek spełniających kryteria (bez limitu)
   ↓
9. Transformacja do DueFlashcardDTO[]
   ↓
10. Zwrot DueCardsResponseDTO z kodem 200
```

### 5.8 Diagram sekwencji (przykład dla Create Deck)

```
Client          Route Handler       DeckService         Supabase DB
  |                   |                   |                   |
  |-- POST /api/decks --|                 |                   |
  |                   |                   |                   |
  |                   |-- auth.getUser() ---------------------->|
  |                   |<-- user data ---------------------------|
  |                   |                   |                   |
  |                   |-- parse/validate --|                  |
  |                   |                   |                   |
  |                   |-- createDeck(userId, cmd) ------------>|
  |                   |                   |                   |
  |                   |                   |-- INSERT deck ---->|
  |                   |                   |<-- new deck -------|
  |                   |                   |                   |
  |                   |<-- DeckDTO -------|                   |
  |<-- 201 Created ---|                   |                   |
```

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie

**Mechanizm:**
- Bearer token w header `Authorization`
- Token wyodrębniany przez middleware (`src/middleware/index.ts`)
- Weryfikacja przez `locals.supabase.auth.getUser()`

**Implementacja w każdym endpoincie:**
```typescript
const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

if (authError || !user) {
  throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
}
```

**Zagrożenia i ochrona:**
- ❌ Brak tokenu → 401 Unauthorized
- ❌ Token wygasły → 401 Unauthorized
- ❌ Token nieprawidłowy → 401 Unauthorized
- ✅ Token valid → kontynuuj z `user.id`

### 6.2 Autoryzacja (Ownership Verification)

**Zasada:**
Każda operacja na talii musi weryfikować, że `deck.user_id === authenticated_user.id`

**Implementacja w DeckService:**
```typescript
// Dla GET/PATCH/DELETE pojedynczej talii
const { data: deck, error } = await this.supabase
  .from('decks')
  .select('*')
  .eq('id', deckId)
  .eq('user_id', userId)  // ← Kluczowa weryfikacja
  .single();

if (error || !deck) {
  throw new ApiError('NOT_FOUND', 'Deck not found or does not belong to user', 404);
}
```

**Endpointy wymagające weryfikacji:**
- ✅ GET /api/decks - filtruje WHERE user_id = userId
- ✅ GET /api/decks/:id - weryfikuje własność
- ✅ PATCH /api/decks/:id - weryfikuje własność
- ✅ DELETE /api/decks/:id - weryfikuje własność
- ✅ GET /api/decks/:id/due - weryfikuje własność talii

### 6.3 Walidacja danych wejściowych

**Narzędzie:** Zod schemas

**Cel:**
- Zapobieganie SQL injection (poprzez type safety)
- Walidacja formatów (UUID, długość stringa)
- Sanityzacja danych
- Ochrona przed atakami typu overflow

**Przykłady walidacji:**
```typescript
// UUID w path parameters
uuidParamSchema.parse(deckId); // throws ZodError jeśli nieprawidłowy

// Nazwa talii
createDeckSchema.parse({ name: userInput }); // weryfikuje 1-100 znaków

// Paginacja
deckQueryParamsSchema.parse({
  page: params.page,  // coerce to number, min: 1
  limit: params.limit // coerce to number, max: 100
});
```

**Obsługa błędów walidacji:**
- ZodError automatycznie przechwytywany przez `handleApiError()`
- Konwersja do ErrorResponseDTO z kodem 400
- Szczegółowe informacje o błędach w `details[]`

### 6.4 Ochrona przed atakami

**SQL Injection:**
- ✅ Supabase używa parametryzowanych zapytań
- ✅ Walidacja typu UUID przez Zod
- ✅ Type safety TypeScript
- ✅ Brak surowych SQL queries

**XSS (Cross-Site Scripting):**
- ✅ Dane przechowywane w bazie bez wykonania
- ✅ Frontend odpowiedzialny za escape
- ⚠️ Długość nazwy ograniczona do 100 znaków

**CSRF (Cross-Site Request Forgery):**
- ✅ API wymaga Bearer token (nie cookie-based)
- ✅ Brak automatycznego wysyłania credentials

**DoS (Denial of Service):**
- ✅ Limit paginacji (max 100 items)
- ⚠️ Rozważyć rate limiting (zobacz sekcja 7.3)
- ✅ Timeout na poziomie Supabase

**Cascade Deletion:**
- ⚠️ DELETE /api/decks/:id usuwa wszystkie fiszki
- ✅ To zamierzone zachowanie (specyfikacja)
- 💡 Rozważyć soft delete lub potwierdzenie na frontend

### 6.5 CORS i Headers

**Zarządzane przez:**
- Astro middleware
- Supabase CORS policy

**Headers bezpieczeństwa (do rozważenia):**
```typescript
headers: {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}
```

### 6.6 Secrets i Environment Variables

**Wymagane zmienne (.env):**
```
SUPABASE_URL=<project-url>
SUPABASE_KEY=<anon-key>
```

**Dostęp:**
```typescript
import.meta.env.SUPABASE_URL
import.meta.env.SUPABASE_KEY
```

**Bezpieczeństwo:**
- ❌ Nigdy nie commitować .env do repo
- ✅ Używać .env.example jako template
- ✅ Anon key jest bezpieczny dla public exposure (RLS)

### 6.7 Row Level Security (RLS)

**Polityki Supabase (już zaimplementowane):**

Według migrations:
```sql
-- Użytkownicy widzą tylko swoje talie
CREATE POLICY "Users can view own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

-- Użytkownicy mogą tworzyć własne talie
CREATE POLICY "Users can create own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Użytkownicy mogą aktualizować własne talie
CREATE POLICY "Users can update own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

-- Użytkownicy mogą usuwać własne talie
CREATE POLICY "Users can delete own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);
```

**Dodatkowa warstwa bezpieczeństwa:**
- RLS działa nawet jeśli kod aplikacji ma błąd
- Weryfikacja zarówno w aplikacji jak i na poziomie DB

## 7. Obsługa błędów

### 7.1 Hierarchia błędów

```
Error
  ├── ApiError (custom, src/lib/utils/error-handler.ts)
  ├── ZodError (zod validation)
  └── Unknown errors (catches all)
```

### 7.2 Typy błędów według endpointu

#### GET /api/decks

| Kod | Error Code | Scenariusz | Message |
|-----|-----------|-----------|---------|
| 400 | VALIDATION_ERROR | Nieprawidłowa paginacja | Validation failed |
| 401 | UNAUTHORIZED | Brak tokenu lub nieprawidłowy | Authentication required. Please log in. |
| 500 | INTERNAL_ERROR | Błąd DB lub nieoczekiwany | An unexpected error occurred. Please try again later. |

**Przykład błędu walidacji:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "limit",
        "message": "Number must be less than or equal to 100"
      }
    ]
  }
}
```

#### GET /api/decks/:id

| Kod | Error Code | Scenariusz | Message |
|-----|-----------|-----------|---------|
| 400 | VALIDATION_ERROR | Nieprawidłowy UUID | Validation failed |
| 401 | UNAUTHORIZED | Brak uwierzytelnienia | Authentication required. Please log in. |
| 404 | NOT_FOUND | Talia nie istnieje lub nie należy do użytkownika | Deck not found or does not belong to user |
| 500 | INTERNAL_ERROR | Błąd DB | An unexpected error occurred. Please try again later. |

#### POST /api/decks

| Kod | Error Code | Scenariusz | Message |
|-----|-----------|-----------|---------|
| 400 | VALIDATION_ERROR | Nazwa pusta lub > 100 znaków | Validation failed |
| 400 | VALIDATION_ERROR | Brak wymaganego pola | Validation failed |
| 401 | UNAUTHORIZED | Brak uwierzytelnienia | Authentication required. Please log in. |
| 500 | INTERNAL_ERROR | Błąd DB przy INSERT | An unexpected error occurred. Please try again later. |

**Przykłady błędów walidacji:**
```json
// Nazwa za długa
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "String must contain at most 100 character(s)"
      }
    ]
  }
}

// Brak nazwy
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Required"
      }
    ]
  }
}
```

#### PATCH /api/decks/:id

| Kod | Error Code | Scenariusz | Message |
|-----|-----------|-----------|---------|
| 400 | VALIDATION_ERROR | Nieprawidłowy UUID lub nazwa | Validation failed |
| 401 | UNAUTHORIZED | Brak uwierzytelnienia | Authentication required. Please log in. |
| 404 | NOT_FOUND | Talia nie istnieje lub nie należy do użytkownika | Deck not found or does not belong to user |
| 500 | INTERNAL_ERROR | Błąd DB przy UPDATE | An unexpected error occurred. Please try again later. |

#### DELETE /api/decks/:id

| Kod | Error Code | Scenariusz | Message |
|-----|-----------|-----------|---------|
| 400 | VALIDATION_ERROR | Nieprawidłowy UUID | Validation failed |
| 401 | UNAUTHORIZED | Brak uwierzytelnienia | Authentication required. Please log in. |
| 404 | NOT_FOUND | Talia nie istnieje lub nie należy do użytkownika | Deck not found or does not belong to user |
| 500 | INTERNAL_ERROR | Błąd DB przy DELETE | An unexpected error occurred. Please try again later. |

#### GET /api/decks/:id/due

| Kod | Error Code | Scenariusz | Message |
|-----|-----------|-----------|---------|
| 400 | VALIDATION_ERROR | Nieprawidłowy UUID lub limit | Validation failed |
| 401 | UNAUTHORIZED | Brak uwierzytelnienia | Authentication required. Please log in. |
| 404 | NOT_FOUND | Talia nie istnieje lub nie należy do użytkownika | Deck not found or does not belong to user |
| 500 | INTERNAL_ERROR | Błąd DB | An unexpected error occurred. Please try again later. |

### 7.3 Standardowy error handler

Wszystkie błędy przechwytywane przez `handleApiError()` w bloku `catch`:

```typescript
try {
  // ... logika endpointu
} catch (error) {
  return handleApiError(error);
}
```

**Proces obsługi:**
1. Log błędu do console (development/debugging)
2. Identyfikacja typu błędu:
   - ZodError → 400 VALIDATION_ERROR
   - ApiError → użyj statusCode i code z błędu
   - Unknown → 500 INTERNAL_ERROR
3. Nie ujawniaj szczegółów wewnętrznych w production
4. Zwróć Response z ErrorResponseDTO

### 7.4 Logowanie błędów

**Obecnie:**
```typescript
console.error('API Error:', error);
```

**Do rozważenia w production:**
- Integracja z Sentry lub podobnym narzędziem
- Strukturyzowane logi (JSON format)
- Error tracking z stack trace
- Alert dla krytycznych błędów (500)

### 7.5 Scenariusze edge case

**Równoczesne usuwanie:**
- User A usuwa talię
- User B próbuje ją zaktualizować
- Result: 404 NOT_FOUND (correct)

**Długie nazwy z unicode:**
- Input: nazwa ze 100 emoji (potencjalnie > 100 bajtów)
- Validation: Zod sprawdza `.length` (liczba znaków)
- DB constraint: VARCHAR(100) (liczba znaków w Postgres)
- Result: Powinno działać poprawnie

**Limit overflow:**
- Input: `?limit=999999`
- Validation: Zod coerce.number().max(100)
- Result: 400 VALIDATION_ERROR

**Negatywna strona:**
- Input: `?page=-1`
- Validation: Zod min(1)
- Result: 400 VALIDATION_ERROR

## 8. Rozważania dotyczące wydajności

### 8.1 Wąskie gardła

**1. Obliczanie statystyk dla każdej talii:**
- Problem: COUNT na flashcards dla każdej talii w liście
- Potencjalne N+1 queries

**2. Brak indeksów:**
- Potrzebne indeksy:
  - `decks(user_id)` - dla filtrowania
  - `flashcards(deck_id)` - dla JOIN i COUNT
  - `flashcards(next_review_date)` - dla due cards

**3. Paginacja bez cursor:**
- OFFSET może być wolny dla dużych wartości
- Rozważyć cursor-based pagination w przyszłości

### 8.2 Optymalizacje queries

#### List Decks - Optymalizowana wersja

```sql
-- Jeden query z agregacją zamiast N queries
SELECT 
  d.id,
  d.name,
  d.created_at,
  d.updated_at,
  COUNT(f.id) as flashcard_count,
  COUNT(CASE 
    WHEN f.next_review_date IS NULL 
      OR f.next_review_date <= NOW() 
    THEN 1 
  END) as due_count
FROM decks d
LEFT JOIN flashcards f ON f.deck_id = d.id
WHERE d.user_id = $1
GROUP BY d.id, d.name, d.created_at, d.updated_at
ORDER BY d.created_at DESC
LIMIT $2 OFFSET $3;

-- Osobny query dla total count
SELECT COUNT(*) FROM decks WHERE user_id = $1;
```

**Implementacja w Supabase client:**
```typescript
const { data, error, count } = await this.supabase
  .from('decks')
  .select(`
    id,
    name,
    created_at,
    updated_at,
    flashcards(count)
  `, { count: 'exact' })
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

**Uwaga:** Supabase może wymagać osobnych queries dla COUNT aggregations. Weryfikacja w implementacji.

#### Get Deck - Z join i agregacją

```sql
SELECT 
  d.*,
  COUNT(f.id) as flashcard_count,
  COUNT(CASE WHEN f.next_review_date <= NOW() THEN 1 END) as due_count,
  COUNT(CASE WHEN f.repetitions = 0 OR f.repetitions IS NULL THEN 1 END) as new_count
FROM decks d
LEFT JOIN flashcards f ON f.deck_id = d.id
WHERE d.id = $1 AND d.user_id = $2
GROUP BY d.id;
```

#### Get Due Cards - Z indeksem

```sql
-- Wymaga indeksu na (deck_id, next_review_date)
SELECT *
FROM flashcards
WHERE deck_id = $1
  AND (next_review_date IS NULL OR next_review_date <= NOW())
ORDER BY next_review_date ASC NULLS FIRST
LIMIT $2;
```

**Zalecane indeksy (migrations):**
```sql
-- Jeśli nie istnieją, dodać:
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_due 
  ON flashcards(deck_id, next_review_date) 
  WHERE next_review_date IS NOT NULL;
```

### 8.3 Caching strategies

**Nie implementować w MVP, ale rozważyć:**

**1. Response caching:**
- Cache listy talii (krótki TTL, np. 30s)
- Invalidate po CREATE/UPDATE/DELETE
- Użyć Redis lub Astro caching

**2. Computed statistics:**
- Denormalizacja: przechowywać counts w tabeli decks
- Update przez database triggers
- Trade-off: więcej miejsca, szybsze queries

**3. CDN caching:**
- Nie dotyczy - authenticated endpoints

### 8.4 Rate limiting

**Obecnie:** Brak

**Rekomendacja:** Implementować w przyszłości

**Przykład z FlashcardService pattern:**
```typescript
// src/lib/services/rate-limiter.service.ts już istnieje
import { RateLimiterService } from '@/lib/services/rate-limiter.service';

const rateLimiter = new RateLimiterService();

// W route handler przed główną logiką:
await rateLimiter.checkLimit(user.id, 'deck_operations', {
  maxRequests: 100,
  windowMs: 60000 // 100 requests per minute
});
```

**Limity do rozważenia:**
- List Decks: 60 req/min
- Get Deck: 100 req/min
- Create Deck: 10 req/min
- Update Deck: 30 req/min
- Delete Deck: 10 req/min
- Get Due Cards: 100 req/min

### 8.5 Monitorowanie wydajności

**Metryki do śledzenia:**
- Response time percentiles (p50, p95, p99)
- Query execution time
- Cache hit rate (jeśli zaimplementowany)
- Error rate
- Requests per second

**Narzędzia:**
- Supabase Dashboard (query performance)
- APM (Application Performance Monitoring)
- Custom logging

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie schematów walidacji

**Plik:** `src/lib/schemas/deck.schema.ts`

**Zadania:**
1. Utworzyć nowy plik schema
2. Zaimportować Zod
3. Zdefiniować schematy:
   - `deckQueryParamsSchema`
   - `createDeckSchema`
   - `updateDeckSchema`
   - `dueCardsQueryParamsSchema`
   - `uuidParamSchema` (możliwy re-export z flashcard.schema.ts)
4. Wyeksportować wszystkie schematy

**Akceptacja:**
- [ ] Plik utworzony
- [ ] Wszystkie schematy zdefiniowane
- [ ] Type inference działa poprawnie
- [ ] Brak błędów TypeScript

**Kod referencyjny:** `src/lib/schemas/flashcard.schema.ts`

---

### Krok 2: Utworzenie DeckService

**Plik:** `src/lib/services/deck.service.ts`

**Zadania:**
1. Utworzyć klasę `DeckService`
2. Przyjmować `SupabaseClient` w konstruktorze
3. Zaimplementować metody:
   - `listDecks(userId, params)` → DeckListResponseDTO
   - `getDeck(userId, deckId)` → DeckDetailDTO
   - `createDeck(userId, command)` → DeckDTO
   - `updateDeck(userId, deckId, command)` → DeckDTO
   - `deleteDeck(userId, deckId)` → void
   - `getDueCards(userId, deckId, limit)` → DueCardsResponseDTO
4. Każda metoda powinna:
   - Wykonać odpowiednie query do Supabase
   - Weryfikować własność zasobów (gdzie dotyczy)
   - Rzucać `ApiError` dla błędów
   - Transformować dane do DTOs
   - Obliczać statystyki (counts)

**Szczegóły implementacji:**

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type {
  DeckListItemDTO,
  DeckDetailDTO,
  DeckDTO,
  CreateDeckCommand,
  UpdateDeckCommand,
  DueFlashcardDTO,
  PaginationDTO,
  DeckListResponseDTO,
  DueCardsResponseDTO,
} from '@/types';
import { ApiError } from '@/lib/utils/error-handler';

export class DeckService {
  constructor(private supabase: SupabaseClient) {}

  async listDecks(
    userId: string,
    params: { page: number; limit: number }
  ): Promise<DeckListResponseDTO> {
    // Implementacja z agregacją statystyk
  }

  async getDeck(userId: string, deckId: string): Promise<DeckDetailDTO> {
    // Weryfikacja własności + agregacja statystyk (new_count)
  }

  async createDeck(userId: string, command: CreateDeckCommand): Promise<DeckDTO> {
    // INSERT + zwrot z counts = 0
  }

  async updateDeck(
    userId: string,
    deckId: string,
    command: UpdateDeckCommand
  ): Promise<DeckDTO> {
    // Weryfikacja własności + UPDATE + agregacja statystyk
  }

  async deleteDeck(userId: string, deckId: string): Promise<void> {
    // DELETE z weryfikacją własności
  }

  async getDueCards(
    userId: string,
    deckId: string,
    limit: number
  ): Promise<DueCardsResponseDTO> {
    // Weryfikacja własności talii + query fiszek due
  }
}
```

**Akceptacja:**
- [ ] Wszystkie metody zaimplementowane
- [ ] Weryfikacja własności działa poprawnie
- [ ] Statystyki obliczane prawidłowo
- [ ] ApiError rzucany w odpowiednich miejscach
- [ ] TypeScript types zgodne z DTOs
- [ ] Kod zgodny z patterns z FlashcardService

**Kod referencyjny:** `src/lib/services/flashcard.service.ts`

---

### Krok 3: Implementacja GET /api/decks

**Plik:** `src/pages/api/decks/index.ts`

**Zadania:**
1. Utworzyć plik endpoint
2. Dodać `export const prerender = false`
3. Zaimplementować `GET` handler:
   - Auth check
   - Parse query params
   - Validate z deckQueryParamsSchema
   - Call DeckService.listDecks()
   - Return 200 z DeckListResponseDTO
4. Wrap w try/catch z handleApiError

**Template:**
```typescript
import type { APIRoute } from 'astro';
import { DeckService } from '@/lib/services/deck.service';
import { deckQueryParamsSchema } from '@/lib/schemas/deck.schema';
import { ApiError, handleApiError } from '@/lib/utils/error-handler';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Auth
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required. Please log in.', 401);
    }

    // 2. Parse & validate
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
    };
    const validatedParams = deckQueryParamsSchema.parse(queryParams);

    // 3. Service call
    const deckService = new DeckService(locals.supabase);
    const result = await deckService.listDecks(user.id, validatedParams);

    // 4. Response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Akceptacja:**
- [ ] Endpoint zwraca 200 z prawidłowymi danymi
- [ ] Paginacja działa poprawnie
- [ ] Statystyki (flashcard_count, due_count) są prawidłowe
- [ ] 401 dla niezalogowanych
- [ ] 400 dla nieprawidłowych params
- [ ] JSDoc comments dodane

---

### Krok 4: Implementacja POST /api/decks

**Plik:** `src/pages/api/decks/index.ts` (rozszerzenie)

**Zadania:**
1. Dodać `POST` handler do tego samego pliku
2. Parse request body
3. Validate z createDeckSchema
4. Call DeckService.createDeck()
5. Return 201 Created

**Template:**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Auth
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required. Please log in.', 401);
    }

    // 2. Parse & validate
    const body = await request.json();
    const validatedData = createDeckSchema.parse(body);

    // 3. Service call
    const deckService = new DeckService(locals.supabase);
    const deck = await deckService.createDeck(user.id, validatedData);

    // 4. Response
    return new Response(JSON.stringify(deck), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Akceptacja:**
- [ ] Endpoint zwraca 201 z nową talią
- [ ] Counts są 0 dla nowej talii
- [ ] Nazwa walidowana poprawnie (1-100 chars)
- [ ] 401 dla niezalogowanych
- [ ] 400 dla nieprawidłowej nazwy
- [ ] JSDoc comments dodane

---

### Krok 5: Implementacja GET /api/decks/[id].ts

**Plik:** `src/pages/api/decks/[id].ts`

**Zadania:**
1. Utworzyć nowy plik z dynamic route [id]
2. Dodać `export const prerender = false`
3. Zimplementować `GET` handler:
   - Auth check
   - Extract deckId z params
   - Validate UUID
   - Call DeckService.getDeck()
   - Return 200 z DeckDetailDTO

**Template:**
```typescript
import type { APIRoute } from 'astro';
import { DeckService } from '@/lib/services/deck.service';
import { uuidParamSchema } from '@/lib/schemas/deck.schema';
import { ApiError, handleApiError } from '@/lib/utils/error-handler';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Auth
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required. Please log in.', 401);
    }

    // 2. Validate path param
    const deckId = uuidParamSchema.parse(params.id);

    // 3. Service call
    const deckService = new DeckService(locals.supabase);
    const deck = await deckService.getDeck(user.id, deckId);

    // 4. Response
    return new Response(JSON.stringify(deck), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Akceptacja:**
- [ ] Endpoint zwraca 200 z pełnymi danymi talii
- [ ] new_count jest obliczony poprawnie
- [ ] 404 dla nieistniejącej talii
- [ ] 404 dla talii innego użytkownika
- [ ] 400 dla nieprawidłowego UUID
- [ ] JSDoc comments dodane

---

### Krok 6: Implementacja PATCH /api/decks/[id].ts

**Plik:** `src/pages/api/decks/[id].ts` (rozszerzenie)

**Zadania:**
1. Dodać `PATCH` handler do [id].ts
2. Parse body
3. Validate z updateDeckSchema
4. Call DeckService.updateDeck()
5. Return 200 z zaktualizowanym DeckDTO

**Template:**
```typescript
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Auth
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required. Please log in.', 401);
    }

    // 2. Validate path param
    const deckId = uuidParamSchema.parse(params.id);

    // 3. Parse & validate body
    const body = await request.json();
    const validatedData = updateDeckSchema.parse(body);

    // 4. Service call
    const deckService = new DeckService(locals.supabase);
    const deck = await deckService.updateDeck(user.id, deckId, validatedData);

    // 5. Response
    return new Response(JSON.stringify(deck), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Akceptacja:**
- [ ] Endpoint zwraca 200 z zaktualizowaną talią
- [ ] updated_at jest zaktualizowany
- [ ] Nazwa zmieniona poprawnie
- [ ] 404 dla nieistniejącej talii
- [ ] 404 dla talii innego użytkownika
- [ ] 400 dla nieprawidłowej nazwy
- [ ] JSDoc comments dodane

---

### Krok 7: Implementacja DELETE /api/decks/[id].ts

**Plik:** `src/pages/api/decks/[id].ts` (rozszerzenie)

**Zadania:**
1. Dodać `DELETE` handler do [id].ts
2. Validate UUID
3. Call DeckService.deleteDeck()
4. Return 204 No Content (bez body)

**Template:**
```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Auth
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required. Please log in.', 401);
    }

    // 2. Validate path param
    const deckId = uuidParamSchema.parse(params.id);

    // 3. Service call
    const deckService = new DeckService(locals.supabase);
    await deckService.deleteDeck(user.id, deckId);

    // 4. Response
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Akceptacja:**
- [ ] Endpoint zwraca 204 bez body
- [ ] Talia jest usunięta z bazy
- [ ] Fiszki są usunięte (CASCADE)
- [ ] 404 dla nieistniejącej talii
- [ ] 404 dla talii innego użytkownika
- [ ] 400 dla nieprawidłowego UUID
- [ ] JSDoc comments dodane

---

### Krok 8: Implementacja GET /api/decks/[id]/due.ts

**Plik:** `src/pages/api/decks/[id]/due.ts`

**Zadania:**
1. Utworzyć nowy plik nested route
2. Dodać `export const prerender = false`
3. Zimplementować `GET` handler:
   - Auth check
   - Extract deckId
   - Parse query params (limit)
   - Validate
   - Call DeckService.getDueCards()
   - Return 200 z DueCardsResponseDTO

**Template:**
```typescript
import type { APIRoute } from 'astro';
import { DeckService } from '@/lib/services/deck.service';
import { uuidParamSchema, dueCardsQueryParamsSchema } from '@/lib/schemas/deck.schema';
import { ApiError, handleApiError } from '@/lib/utils/error-handler';

export const prerender = false;

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Auth
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError('UNAUTHORIZED', 'Authentication required. Please log in.', 401);
    }

    // 2. Validate path param
    const deckId = uuidParamSchema.parse(params.id);

    // 3. Parse & validate query params
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') || undefined,
    };
    const { limit } = dueCardsQueryParamsSchema.parse(queryParams);

    // 4. Service call
    const deckService = new DeckService(locals.supabase);
    const result = await deckService.getDueCards(user.id, deckId, limit);

    // 5. Response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Akceptacja:**
- [ ] Endpoint zwraca 200 z fiszkami do powtórki
- [ ] Tylko fiszki z next_review_date <= NOW() lub NULL
- [ ] Sortowanie po next_review_date ASC NULLS FIRST
- [ ] Limit działa poprawnie (max 100)
- [ ] total count jest poprawny
- [ ] 404 dla nieistniejącej talii
- [ ] 404 dla talii innego użytkownika
- [ ] JSDoc comments dodane

---

### Krok 9: Testy manualne

**Zadania:**
1. Utworzyć test script `scripts/test-decks.sh` (wzorowany na test-flashcards.sh)
2. Przetestować wszystkie endpointy:
   - Utworzenie użytkownika testowego
   - Utworzenie talii (POST)
   - Lista talii (GET)
   - Pobieranie pojedynczej talii (GET :id)
   - Aktualizacja talii (PATCH)
   - Utworzenie fiszek w talii
   - Pobranie due cards (GET :id/due)
   - Usunięcie talii (DELETE)
   - Weryfikacja CASCADE delete
3. Testy scenariuszy błędów:
   - 401 Unauthorized
   - 404 Not Found
   - 400 Validation errors
4. Dokumentacja wyników testów

**Scenariusze testowe:**

```bash
#!/bin/bash
# scripts/test-decks.sh

echo "🧪 Testing Decks API"
echo "===================="

# 1. Create test user & get token
echo "📝 Creating test user..."
# ... (similar to test-flashcards.sh)

# 2. Create deck
echo "Test 1: Create deck ➕"
curl -X POST http://localhost:3000/api/decks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Deck"}'

# 3. List decks
echo "Test 2: List decks 📋"
curl http://localhost:3000/api/decks \
  -H "Authorization: Bearer $TOKEN"

# 4. Get deck details
echo "Test 3: Get deck $DECK_ID 🔍"
curl http://localhost:3000/api/decks/$DECK_ID \
  -H "Authorization: Bearer $TOKEN"

# 5. Update deck
echo "Test 4: Update deck ✏️"
curl -X PATCH http://localhost:3000/api/decks/$DECK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Deck"}'

# 6. Create flashcard in deck (reuse flashcard endpoint)
# ...

# 7. Get due cards
echo "Test 5: Get due cards 📚"
curl "http://localhost:3000/api/decks/$DECK_ID/due?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 8. Delete deck
echo "Test 6: Delete deck 🗑️"
curl -X DELETE http://localhost:3000/api/decks/$DECK_ID \
  -H "Authorization: Bearer $TOKEN"

# 9. Error scenarios
echo "Test 7: Invalid UUID 🚫"
curl http://localhost:3000/api/decks/invalid-uuid \
  -H "Authorization: Bearer $TOKEN"

echo "Test 8: Unauthorized 🚫"
curl http://localhost:3000/api/decks

# ... more tests
```

**Akceptacja:**
- [ ] Wszystkie pozytywne scenariusze przechodzą
- [ ] Wszystkie scenariusze błędów zwracają prawidłowe kody
- [ ] CASCADE delete działa (fiszki usuwane z talią)
- [ ] Paginacja działa poprawnie
- [ ] Statystyki są prawidłowe
- [ ] Due cards filtrowanie działa

---

### Krok 10: Optymalizacja i Code Review

**Zadania:**
1. Sprawdzić wydajność queries (Supabase logs)
2. Zweryfikować, czy indeksy są obecne:
   - `idx_decks_user_id`
   - `idx_flashcards_deck_id`
   - `idx_flashcards_next_review`
3. Code review checklist:
   - [ ] Wszystkie endpointy mają JSDoc comments
   - [ ] Error handling spójny we wszystkich miejscach
   - [ ] Type safety (brak any)
   - [ ] Zgodność z coding guidelines
   - [ ] DRY - brak duplikacji kodu
   - [ ] Security - auth i authorization wszędzie
4. Refactoring jeśli potrzebny
5. Aktualizacja dokumentacji

**Pytania do weryfikacji:**
- Czy aggregate queries są optymalne?
- Czy można zredukować liczbę DB calls?
- Czy error messages są user-friendly?
- Czy logs zawierają wystarczające informacje?

**Akceptacja:**
- [ ] Code review przeprowadzony
- [ ] Optymalizacje zaimplementowane
- [ ] Dokumentacja zaktualizowana
- [ ] Brak warnings w linterze
- [ ] TypeScript kompiluje bez błędów

---

### Krok 11: Dokumentacja API

**Zadania:**
1. Zaktualizować `docs/API.md` z nowymi endpointami
2. Dodać przykłady request/response
3. Dokumentować błędy
4. Dodać uwagi o CASCADE delete
5. Opcjonalnie: utworzyć OpenAPI/Swagger spec

**Format dokumentacji:**
```markdown
## Decks

### List Decks
`GET /api/decks`

Retrieve all decks for authenticated user with pagination and statistics.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page

**Success Response (200):**
... (szczegóły jak w sekcji 4)

**Error Responses:**
... (szczegóły jak w sekcji 7)

### Create Deck
...

### Update Deck
...

### Delete Deck
...

⚠️ **Warning:** Deleting a deck will CASCADE delete all associated flashcards.

### Get Due Cards
...
```

**Akceptacja:**
- [ ] Wszystkie endpointy udokumentowane
- [ ] Przykłady request/response aktualne
- [ ] Error codes i messages udokumentowane
- [ ] Uwagi o CASCADE delete widoczne
- [ ] Format spójny z resztą docs

---

### Krok 12: Final Testing & Deployment Readiness

**Zadania:**
1. Run full test suite
2. Sprawdzić wszystkie edge cases
3. Load testing (opcjonalnie)
4. Security audit checklist:
   - [ ] RLS policies aktywne
   - [ ] Auth wymagany wszędzie
   - [ ] Input validation wszędzie
   - [ ] Error messages nie ujawniają danych wrażliwych
5. Deployment checklist:
   - [ ] Environment variables ustawione
   - [ ] Migrations wykonane
   - [ ] Indeksy utworzone
   - [ ] Rate limiting rozważony
6. Monitoring setup:
   - [ ] Error tracking (opcjonalnie)
   - [ ] Performance monitoring (opcjonalnie)

**Akceptacja:**
- [ ] Wszystkie testy przechodzą
- [ ] Security audit completed
- [ ] Deployment checklist completed
- [ ] Gotowy do merge do main branch
- [ ] Dokumentacja kompletna

---

## Podsumowanie

Ten plan wdrożenia zapewnia systematyczne podejście do implementacji wszystkich 6 endpointów zarządzania taliami. Kluczowe aspekty:

✅ **Bezpieczeństwo:** Auth + Authorization + Validation  
✅ **Wydajność:** Optymalizowane queries + Indeksy + Paginacja  
✅ **Jakość kodu:** Type safety + DRY + Error handling  
✅ **Testowanie:** Manualne testy + Edge cases  
✅ **Dokumentacja:** API docs + JSDoc comments  

**Szacowany czas implementacji:** 6-8 godzin

**Dependencies:**
- Istniejące: types.ts, error-handler.ts, middleware, Supabase setup
- Nowe: deck.schema.ts, deck.service.ts, 4 route files

**Kolejność implementacji jest kluczowa** - najpierw schemas i service, potem endpointy w kolejności od prostszych do bardziej złożonych.
