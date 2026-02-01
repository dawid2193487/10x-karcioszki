# API Endpoint Implementation Plan: Authentication Endpoints

## 1. Przegląd punktów końcowych

Implementacja obejmuje cztery punkty końcowe uwierzytelniania, które działają jako proxy dla Supabase Auth. Endpoints pozwalają na rejestrację użytkowników, logowanie, wylogowanie oraz odświeżanie tokenów dostępu. Wszystkie operacje są delegowane do Supabase Auth, co zapewnia bezpieczeństwo i eliminuje potrzebę implementacji własnej logiki uwierzytelniania.

**Kluczowe założenia:**
- Endpoints działają jako cienka warstwa proxy dla Supabase Auth
- Nie przechowujemy własnych tokenów - używamy mechanizmów Supabase
- Walidacja danych wejściowych odbywa się przed przekazaniem do Supabase
- Błędy Supabase są mapowane na standardowe odpowiedzi API

## 2. Szczegóły żądań

### 2.1 Sign Up (POST /api/auth/signup)

**Parametry żądania:**
- **Wymagane:**
  - `email` (string): Adres email użytkownika, format email
  - `password` (string): Hasło użytkownika, minimum 8 znaków

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Struktura URL:** `/api/auth/signup`

---

### 2.2 Sign In (POST /api/auth/signin)

**Parametry żądania:**
- **Wymagane:**
  - `email` (string): Adres email użytkownika, format email
  - `password` (string): Hasło użytkownika

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Struktura URL:** `/api/auth/signin`

---

### 2.3 Sign Out (POST /api/auth/signout)

**Parametry żądania:**
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagane)

**Request Body:** Brak

**Struktura URL:** `/api/auth/signout`

---

### 2.4 Refresh Token (POST /api/auth/refresh)

**Parametry żądania:**
- **Wymagane:**
  - `refresh_token` (string): Token odświeżający

**Request Body:**
```json
{
  "refresh_token": "..."
}
```

**Struktura URL:** `/api/auth/refresh`

## 3. Wykorzystywane typy

### 3.1 DTOs (Data Transfer Objects)

**SignUpCommand:**
```typescript
export interface SignUpCommand {
  email: string;
  password: string;
}
```

**SignInCommand:**
```typescript
export interface SignInCommand {
  email: string;
  password: string;
}
```

**RefreshTokenCommand:**
```typescript
export interface RefreshTokenCommand {
  refresh_token: string;
}
```

**AuthResponseDTO:**
```typescript
export interface AuthResponseDTO {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    created_at?: string;
  };
}
```

### 3.2 Zod Schemas (Walidacja)

Schemas będą utworzone w `src/lib/schemas/auth.schema.ts`:

**SignUp Schema:**
```typescript
const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

**SignIn Schema:**
```typescript
const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
```

**RefreshToken Schema:**
```typescript
const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});
```

## 4. Szczegóły odpowiedzi

### 4.1 Sign Up - Success (200 OK)
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-02-01T12:00:00Z"
  }
}
```

**Kody błędów:**
- `400 Bad Request` - Nieprawidłowy format email lub słabe hasło
- `422 Unprocessable Entity` - Email już zarejestrowany
- `500 Internal Server Error` - Błąd usługi Supabase

---

### 4.2 Sign In - Success (200 OK)
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Kody błędów:**
- `400 Bad Request` - Niepowodzenie walidacji
- `401 Unauthorized` - Nieprawidłowe dane uwierzytelniające
- `500 Internal Server Error` - Błąd usługi Supabase

---

### 4.3 Sign Out - Success (204 No Content)

Brak treści odpowiedzi.

**Kody błędów:**
- `401 Unauthorized` - Brakujący lub nieprawidłowy token
- `500 Internal Server Error` - Błąd usługi Supabase

---

### 4.4 Refresh Token - Success (200 OK)
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**Kody błędów:**
- `400 Bad Request` - Brakujący token odświeżający
- `401 Unauthorized` - Nieprawidłowy lub wygasły token odświeżający
- `500 Internal Server Error` - Błąd usługi Supabase

## 5. Przepływ danych

### 5.1 Sign Up Flow
```
1. Client → POST /api/auth/signup { email, password }
2. API Endpoint → Walidacja Zod (signUpSchema)
3. API Endpoint → AuthService.signUp(email, password)
4. AuthService → Supabase Auth.signUp()
5. Supabase → Tworzy użytkownika i profile (via trigger)
6. Supabase → Zwraca tokeny i dane użytkownika
7. AuthService → Mapuje odpowiedź Supabase na AuthResponseDTO
8. API Endpoint → 200 OK { access_token, refresh_token, user }
```

**W przypadku błędu:**
- Walidacja: 400 Bad Request
- Email istnieje: 422 Unprocessable Entity (mapowanie z błędu Supabase)
- Błąd Supabase: 500 Internal Server Error

### 5.2 Sign In Flow
```
1. Client → POST /api/auth/signin { email, password }
2. API Endpoint → Walidacja Zod (signInSchema)
3. API Endpoint → AuthService.signIn(email, password)
4. AuthService → Supabase Auth.signInWithPassword()
5. Supabase → Weryfikuje dane i zwraca tokeny
6. AuthService → Mapuje odpowiedź Supabase na AuthResponseDTO
7. API Endpoint → 200 OK { access_token, refresh_token, user }
```

**W przypadku błędu:**
- Walidacja: 400 Bad Request
- Nieprawidłowe dane: 401 Unauthorized (mapowanie z błędu Supabase)
- Błąd Supabase: 500 Internal Server Error

### 5.3 Sign Out Flow
```
1. Client → POST /api/auth/signout (Header: Authorization: Bearer <token>)
2. API Endpoint → Pobiera token z nagłówka
3. API Endpoint → AuthService.signOut(token)
4. AuthService → Supabase Auth.signOut()
5. Supabase → Unieważnia sesję
6. API Endpoint → 204 No Content
```

**W przypadku błędu:**
- Brak tokenu: 401 Unauthorized
- Nieprawidłowy token: 401 Unauthorized
- Błąd Supabase: 500 Internal Server Error

### 5.4 Refresh Token Flow
```
1. Client → POST /api/auth/refresh { refresh_token }
2. API Endpoint → Walidacja Zod (refreshTokenSchema)
3. API Endpoint → AuthService.refreshToken(refresh_token)
4. AuthService → Supabase Auth.refreshSession()
5. Supabase → Generuje nowe tokeny
6. AuthService → Mapuje odpowiedź Supabase na AuthResponseDTO
7. API Endpoint → 200 OK { access_token, refresh_token }
```

**W przypadku błędu:**
- Walidacja: 400 Bad Request
- Nieprawidłowy/wygasły token: 401 Unauthorized
- Błąd Supabase: 500 Internal Server Error

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie i autoryzacja
- **Sign Up/Sign In:** Brak wymagań dotyczących uwierzytelnienia (publiczne endpoints)
- **Sign Out:** Wymagany ważny access_token w nagłówku Authorization
- **Refresh:** Wymagany ważny refresh_token w ciele żądania

### 6.2 Walidacja danych wejściowych
- **Email:** Walidacja formatu przy użyciu Zod (.email())
- **Hasło:** Minimalna długość 8 znaków dla rejestracji
- **Token odświeżający:** Walidacja obecności i typu

### 6.3 Ochrona przed atakami
- **Rate Limiting:** Implementacja ograniczenia liczby prób logowania/rejestracji (opcjonalne, do rozważenia)
- **HTTPS:** Wszystkie żądania powinny być przez HTTPS w produkcji
- **Token Security:** Tokeny przechowywane tylko po stronie klienta, nie logujemy tokenów
- **Password Hashing:** Obsługiwane przez Supabase Auth (bcrypt)
- **SQL Injection:** Nie dotyczy - używamy Supabase SDK
- **XSS Protection:** Tokeny nie powinny być przechowywane w localStorage (httpOnly cookies preferowane)

### 6.4 Szczególne uwagi
- Nie zwracamy szczegółów błędów Supabase do klienta (aby nie ujawniać informacji systemowych)
- Mapowanie błędów Supabase na generyczne komunikaty
- Brak logowania haseł w logach serwera
- Nie ujawniamy, czy email istnieje (w przypadku Sign In)

## 7. Obsługa błędów

### 7.1 Błędy walidacji (400 Bad Request)

**Scenariusze:**
- Nieprawidłowy format email
- Hasło krótsze niż 8 znaków (Sign Up)
- Brakujące pole wymagane
- Brakujący refresh_token

**Odpowiedź:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

**Implementacja:**
- ZodError automatycznie przechwytywany przez handleApiError()
- Konwersja błędów Zod na ErrorDetail[]

---

### 7.2 Błędy uwierzytelniania (401 Unauthorized)

**Scenariusze:**
- Nieprawidłowe dane logowania (Sign In)
- Brakujący token (Sign Out)
- Nieprawidłowy access_token (Sign Out)
- Nieprawidłowy/wygasły refresh_token (Refresh)

**Odpowiedź:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

**Implementacja:**
- Wykrywanie błędów Supabase Auth (AuthError)
- Mapowanie na ApiError z kodem UNAUTHORIZED i statusem 401

---

### 7.3 Błędy konfliktów (422 Unprocessable Entity)

**Scenariusze:**
- Email już zarejestrowany w systemie (Sign Up)

**Odpowiedź:**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Email already registered"
  }
}
```

**Implementacja:**
- Wykrywanie specyficznych błędów Supabase (error code: user_already_exists)
- Mapowanie na ApiError z kodem CONFLICT i statusem 422

---

### 7.4 Błędy serwera (500 Internal Server Error)

**Scenariusze:**
- Błąd połączenia z Supabase
- Nieoczekiwane błędy w Supabase Auth
- Błędy konfiguracji (brak zmiennych środowiskowych)

**Odpowiedź:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

**Implementacja:**
- Wszystkie nieobsłużone błędy przechwytywane przez handleApiError()
- Logowanie szczegółów błędu (console.error)
- Zwracanie ogólnego komunikatu do klienta

---

### 7.5 Mapowanie błędów Supabase

| Błąd Supabase | Kod HTTP | Error Code | Komunikat |
|---------------|----------|------------|-----------|
| Invalid credentials | 401 | UNAUTHORIZED | Invalid credentials |
| User already exists | 422 | CONFLICT | Email already registered |
| Weak password | 400 | VALIDATION_ERROR | Password is too weak |
| Invalid refresh token | 401 | UNAUTHORIZED | Invalid or expired refresh token |
| Network error | 500 | INTERNAL_ERROR | Service temporarily unavailable |
| Generic error | 500 | INTERNAL_ERROR | An unexpected error occurred |

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła
- **Czas odpowiedzi Supabase:** Zależność od zewnętrznej usługi (typowo 100-300ms)
- **Walidacja hasła:** Bcrypt (obsługiwane przez Supabase, ~100ms)
- **Generowanie tokenów JWT:** Obsługiwane przez Supabase

### 8.2 Strategie optymalizacji
- **Caching:** Nie stosować dla endpoints auth (bezpieczeństwo)
- **Connection Pooling:** Zarządzane przez Supabase SDK
- **Timeout:** Ustawić reasonable timeout dla żądań do Supabase (np. 10s)
- **Retry Logic:** Nie implementować auto-retry dla auth endpoints (ryzyko wielokrotnych prób)

### 8.3 Rate Limiting (opcjonalne)
- **Sign Up:** Max 5 prób/IP/godzinę
- **Sign In:** Max 10 prób/IP/15 minut
- **Refresh:** Max 50 żądań/użytkownika/godzinę

*Uwaga: Rate limiting można zaimplementować później używając istniejącego RateLimiterService lub Supabase Edge Functions.*

### 8.4 Monitoring
- Logowanie czasu odpowiedzi dla każdego endpoint
- Tracking błędów 401 (możliwe ataki brute-force)
- Monitorowanie liczby rejestracji (wykrywanie bot activity)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie typów i schematów
**Plik:** `src/types.ts`
- [ ] Dodać typy: `SignUpCommand`, `SignInCommand`, `RefreshTokenCommand`, `AuthResponseDTO`

**Plik:** `src/lib/schemas/auth.schema.ts` (nowy)
- [ ] Utworzyć schema Zod dla Sign Up
- [ ] Utworzyć schema Zod dla Sign In
- [ ] Utworzyć schema Zod dla Refresh Token
- [ ] Wyeksportować wszystkie schematy

---

### Krok 2: Implementacja Auth Service
**Plik:** `src/lib/services/auth.service.ts` (nowy)

**Funkcjonalność:**
- [ ] Utworzyć klasę `AuthService`
- [ ] Implementować metodę `signUp(email: string, password: string): Promise<AuthResponseDTO>`
  - Wywołać `supabase.auth.signUp()`
  - Mapować odpowiedź Supabase na `AuthResponseDTO`
  - Obsłużyć błędy specyficzne dla Sign Up (user exists)
- [ ] Implementować metodę `signIn(email: string, password: string): Promise<AuthResponseDTO>`
  - Wywołać `supabase.auth.signInWithPassword()`
  - Mapować odpowiedź Supabase na `AuthResponseDTO`
  - Obsłużyć błędy uwierzytelniania
- [ ] Implementować metodę `signOut(supabase: SupabaseClient): Promise<void>`
  - Wywołać `supabase.auth.signOut()`
  - Obsłużyć błędy wylogowania
- [ ] Implementować metodę `refreshToken(refreshToken: string): Promise<AuthResponseDTO>`
  - Wywołać `supabase.auth.refreshSession({ refresh_token })`
  - Mapować odpowiedź Supabase na `AuthResponseDTO`
  - Obsłużyć błędy odświeżania tokenu

**Obsługa błędów:**
- [ ] Mapować błędy Supabase na `ApiError`
- [ ] Używać odpowiednich kodów błędów i statusów HTTP

---

### Krok 3: Implementacja API Endpoints

#### Krok 3.1: Sign Up Endpoint
**Plik:** `src/pages/api/auth/signup.ts` (nowy)

- [ ] Export `prerender = false`
- [ ] Implementować handler `POST`
- [ ] Parsować request body
- [ ] Walidować dane wejściowe używając `signUpSchema`
- [ ] Wywołać `AuthService.signUp()`
- [ ] Zwrócić odpowiedź 200 OK z tokenami
- [ ] Obsłużyć błędy przez `handleApiError()`

**Struktura:**
```typescript
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Parse body
    // 2. Validate with Zod
    // 3. Call AuthService
    // 4. Return response
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

#### Krok 3.2: Sign In Endpoint
**Plik:** `src/pages/api/auth/signin.ts` (nowy)

- [ ] Export `prerender = false`
- [ ] Implementować handler `POST`
- [ ] Parsować request body
- [ ] Walidować dane wejściowe używając `signInSchema`
- [ ] Wywołać `AuthService.signIn()`
- [ ] Zwrócić odpowiedź 200 OK z tokenami
- [ ] Obsłużyć błędy przez `handleApiError()`

---

#### Krok 3.3: Sign Out Endpoint
**Plik:** `src/pages/api/auth/signout.ts` (nowy)

- [ ] Export `prerender = false`
- [ ] Implementować handler `POST`
- [ ] Pobrać `supabase` z `context.locals` (middleware dostarcza klienta z tokenem)
- [ ] Sprawdzić obecność tokenu autoryzacji
- [ ] Wywołać `AuthService.signOut(supabase)`
- [ ] Zwrócić odpowiedź 204 No Content
- [ ] Obsłużyć błędy przez `handleApiError()`

**Weryfikacja tokenu:**
```typescript
const authHeader = context.request.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  throw new ApiError("UNAUTHORIZED", "Missing or invalid authorization token", 401);
}
```

---

#### Krok 3.4: Refresh Token Endpoint
**Plik:** `src/pages/api/auth/refresh.ts` (nowy)

- [ ] Export `prerender = false`
- [ ] Implementować handler `POST`
- [ ] Parsować request body
- [ ] Walidować dane wejściowe używając `refreshTokenSchema`
- [ ] Wywołać `AuthService.refreshToken()`
- [ ] Zwrócić odpowiedź 200 OK z nowymi tokenami
- [ ] Obsłużyć błędy przez `handleApiError()`

---

### Krok 4: Testowanie

#### Krok 4.1: Testy jednostkowe (opcjonalne)
- [ ] Testy dla AuthService.signUp()
- [ ] Testy dla AuthService.signIn()
- [ ] Testy dla AuthService.signOut()
- [ ] Testy dla AuthService.refreshToken()
- [ ] Testy mapowania błędów Supabase

#### Krok 4.2: Testy integracyjne
**Plik:** `scripts/test-auth.sh` (nowy)

- [ ] Test Sign Up - success case
- [ ] Test Sign Up - email już istnieje (422)
- [ ] Test Sign Up - słabe hasło (400)
- [ ] Test Sign Up - nieprawidłowy email (400)
- [ ] Test Sign In - success case
- [ ] Test Sign In - nieprawidłowe dane (401)
- [ ] Test Sign In - brakujące pole (400)
- [ ] Test Sign Out - success case
- [ ] Test Sign Out - brak tokenu (401)
- [ ] Test Sign Out - nieprawidłowy token (401)
- [ ] Test Refresh - success case
- [ ] Test Refresh - nieprawidłowy token (401)
- [ ] Test Refresh - brak tokenu (400)

**Przykładowy test:**
```bash
#!/bin/bash

# Test Sign Up
echo "Testing Sign Up..."
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test Sign In
echo "Testing Sign In..."
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### Krok 5: Dokumentacja

- [ ] Aktualizować `docs/API.md` z endpoints auth
- [ ] Dodać przykłady użycia dla każdego endpoint
- [ ] Dokumentować kody błędów i scenariusze
- [ ] Dodać uwagi dotyczące bezpieczeństwa

---

### Krok 6: Security Review

- [ ] Przejrzeć implementację pod kątem bezpieczeństwa
- [ ] Sprawdzić, czy hasła nie są logowane
- [ ] Sprawdzić, czy tokeny nie są logowane
- [ ] Sprawdzić walidację wszystkich inputów
- [ ] Sprawdzić mapowanie błędów (czy nie ujawniamy zbyt wiele)
- [ ] Przetestować z nieprawidłowymi danymi (fuzzing)

---

### Krok 7: Deployment Checklist

- [ ] Sprawdzić zmienne środowiskowe (SUPABASE_URL, SUPABASE_KEY)
- [ ] Włączyć HTTPS w produkcji
- [ ] Skonfigurować CORS jeśli potrzebne
- [ ] Rozważyć implementację rate limiting
- [ ] Skonfigurować monitoring i alerty
- [ ] Przygotować rollback plan

## 10. Dodatkowe uwagi

### 10.1 Middleware
Obecny middleware już dodaje klienta Supabase z tokenem do `context.locals.supabase`. To rozwiązanie będzie wykorzystane w Sign Out endpoint.

### 10.2 Frontend Integration
Po implementacji API, frontend (LoginForm.tsx) będzie musiał:
- Wywołać POST /api/auth/signin z credentials
- Przechować otrzymane tokeny (bezpiecznie - preferowane httpOnly cookies lub sessionStorage)
- Dołączać access_token do nagłówków Authorization w kolejnych żądaniach
- Implementować auto-refresh przed wygaśnięciem tokenu

### 10.3 Supabase Configuration
Upewnić się, że:
- Email confirmation jest włączony/wyłączony zgodnie z wymaganiami (Supabase Dashboard)
- Password policy jest skonfigurowana (minimum 8 znaków)
- Email templates są dostosowane do aplikacji

### 10.4 Przyszłe rozszerzenia
- [ ] OAuth providers (Google, GitHub)
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Multi-factor authentication (MFA)
- [ ] Session management (lista aktywnych sesji)

---

**Priorytet implementacji:** WYSOKI
**Szacowany czas implementacji:** 4-6 godzin
**Zależności:** Skonfigurowany Supabase Auth
**Ryzyko:** NISKIE (używamy sprawdzonego rozwiązania Supabase)
