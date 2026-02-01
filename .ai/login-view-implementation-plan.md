# Plan implementacji widoku logowania

## 1. Przegląd

Widok logowania (`/login`) umożliwia istniejącym użytkownikom uwierzytelnienie się w aplikacji za pomocą adresu email i hasła. Jest to kluczowy punkt wejścia do aplikacji, który musi być prosty, intuicyjny i bezpieczny. Po udanym logowaniu użytkownik jest automatycznie przekierowywany na stronę główną (dashboard), gdzie może zarządzać swoimi taliami i fiszkami.

Widok wykorzystuje autentykację Supabase Auth z integracją po stronie frontendu. Główny nacisk położony jest na: bezpieczeństwo (generyczne komunikaty błędów), dostępność (ARIA, fokus, tab order) oraz doświadczenie użytkownika (loading states, walidacja w czasie rzeczywistym).

## 2. Routing widoku

**Ścieżka:** `/login`

**Typ strony:** Publiczna (dostępna dla niezalogowanych użytkowników)

**Przekierowania:**
- Po udanym logowaniu → `/` (dashboard)
- Jeśli użytkownik jest już zalogowany → `/` (dashboard)
- Link do rejestracji → `/register`

## 3. Struktura komponentów

```
LoginPage (login.astro)
└── AuthLayout (AuthLayout.astro)
    └── LoginForm (LoginForm.tsx - React)
        ├── Input (Email) - Shadcn/ui
        ├── Input (Password) - Shadcn/ui
        ├── Button (Submit) - Shadcn/ui
        └── Link (Register) - HTML anchor
```

**Wyjaśnienie hierarchii:**
- **LoginPage** - strona Astro renderująca layout i formularz
- **AuthLayout** - dedykowany layout bez nawigacji dla stron autentykacji
- **LoginForm** - główny komponent React zawierający logikę formularza i UI
- **Input, Button** - komponenty Shadcn/ui zapewniające spójny design i accessibility

## 4. Szczegóły komponentów

### 4.1 LoginPage (`src/pages/login.astro`)

**Opis komponentu:**
Strona Astro odpowiedzialna za renderowanie widoku logowania. Jest to statyczny wrapper, który:
- Sprawdza czy użytkownik jest już zalogowany (server-side)
- Przekierowuje zalogowanych użytkowników na dashboard
- Renderuje AuthLayout z komponentem LoginForm

**Główne elementy:**
- Import i wykorzystanie `AuthLayout.astro`
- Integracja z `LoginForm.tsx` z dyrektywą `client:load`
- Server-side redirect logic (sprawdzenie sesji Supabase)

**Obsługiwane zdarzenia:**
Brak (obsługa zdarzeń w komponentach dzieci)

**Warunki walidacji:**
- Server-side: sprawdzenie czy użytkownik posiada aktywną sesję
- Jeśli tak → redirect do `/`

**Typy:**
- Brak (strona nie przyjmuje props)

**Propsy:**
Brak

---

### 4.2 AuthLayout (`src/layouts/AuthLayout.astro`)

**Opis komponentu:**
Dedykowany layout dla stron autentykacji (logowanie, rejestracja). Zapewnia:
- Minimalny, czysty design bez głównej nawigacji
- Centrowanie contentu na stronie
- Spójny styling dla formularzy autentykacji
- Meta tagi i SEO

**Główne elementy:**
```astro
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <div class="min-h-screen flex items-center justify-center bg-neutral-50">
      <div class="w-full max-w-md p-8">
        <slot />
      </div>
    </div>
  </body>
</html>
```

**Obsługiwane zdarzenia:**
Brak

**Warunki walidacji:**
Brak

**Typy:**
```typescript
interface Props {
  title?: string;
}
```

**Propsy:**
- `title?: string` - tytuł strony wyświetlany w `<title>` (domyślnie: "AI Flashcards")

---

### 4.3 LoginForm (`src/components/LoginForm.tsx`)

**Opis komponentu:**
Główny komponent React zawierający interaktywny formularz logowania. Odpowiedzialny za:
- Renderowanie pól email i hasło
- Walidację danych wejściowych po stronie klienta
- Wysyłanie żądania logowania do Supabase Auth
- Obsługę stanów loading, error, success
- Przekierowanie po udanym logowaniu
- Dostępność (ARIA, fokus, tab order)

**Główne elementy:**
```tsx
<div className="space-y-6">
  <div className="text-center space-y-2">
    <h1 className="text-2xl font-bold">Zaloguj się</h1>
    <p className="text-sm text-neutral-600">
      Wprowadź swoje dane aby uzyskać dostęp do konta
    </p>
  </div>

  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Error banner - pokazywany gdy wystąpi błąd */}
    {error && (
      <div 
        role="alert" 
        className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
      >
        {error}
      </div>
    )}

    {/* Email field */}
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="twoj@email.com"
        required
        autoFocus
        autoComplete="email"
        disabled={isLoading}
        aria-invalid={!!emailError}
        aria-describedby={emailError ? "email-error" : undefined}
      />
      {emailError && (
        <p id="email-error" className="text-sm text-red-600" role="alert">
          {emailError}
        </p>
      )}
    </div>

    {/* Password field */}
    <div className="space-y-2">
      <Label htmlFor="password">Hasło</Label>
      <Input
        id="password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        autoComplete="current-password"
        disabled={isLoading}
        aria-invalid={!!passwordError}
        aria-describedby={passwordError ? "password-error" : undefined}
      />
      {passwordError && (
        <p id="password-error" className="text-sm text-red-600" role="alert">
          {passwordError}
        </p>
      )}
    </div>

    {/* Submit button */}
    <Button 
      type="submit" 
      className="w-full"
      disabled={isLoading}
    >
      {isLoading ? "Logowanie..." : "Zaloguj się"}
    </Button>
  </form>

  {/* Register link */}
  <div className="text-center text-sm">
    <span className="text-neutral-600">Nie masz konta? </span>
    <a 
      href="/register" 
      className="text-blue-600 hover:text-blue-700 font-medium"
    >
      Zarejestruj się
    </a>
  </div>
</div>
```

**Obsługiwane interakcje:**
1. **onChange dla pól input** - aktualizacja stanu email/password
2. **onSubmit formularza** - walidacja i wysłanie żądania logowania
3. **Enter na formularzu** - submit (natywne zachowanie HTML)
4. **Kliknięcie przycisku submit** - submit formularza
5. **Kliknięcie linku rejestracji** - nawigacja do `/register`

**Obsługiwana walidacja:**
1. **Email (frontend - w czasie rzeczywistym):**
   - Wymagane pole (required)
   - Format email RFC 5322 (native HTML5 validation + custom regex dla lepszej UX)
   - Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Komunikat błędu: "Podaj poprawny adres email"

2. **Hasło (frontend - w czasie rzeczywistym):**
   - Wymagane pole (required)
   - Brak dodatkowej walidacji formatu (w przeciwieństwie do rejestracji)
   - Komunikat błędu: "Hasło jest wymagane"

3. **Walidacja przed submitem:**
   - Sprawdzenie czy oba pola są wypełnione
   - Sprawdzenie poprawności formatu email
   - Jeśli walidacja nie przejdzie → pokazanie błędów bez wysłania żądania

4. **Walidacja response z API:**
   - 400/401 → "Nieprawidłowy email lub hasło" (generyczny komunikat)
   - 429 → "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę."
   - Network error → "Problem z połączeniem. Sprawdź internet i spróbuj ponownie."
   - Timeout → "Logowanie trwa zbyt długo. Spróbuj ponownie."
   - 500 → "Coś poszło nie tak. Spróbuj ponownie za chwilę."
   - Unknown → "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."

**Typy:**
```typescript
// LoginFormState - stan lokalny komponentu
interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  emailError: string | null;
  passwordError: string | null;
}

// LoginCredentials - dane wysyłane do API
interface LoginCredentials {
  email: string;
  password: string;
}

// SupabaseAuthResponse - odpowiedź z Supabase Auth
interface SupabaseAuthResponse {
  data: {
    user: {
      id: string;
      email: string;
    } | null;
    session: {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
    } | null;
  };
  error: {
    message: string;
    status: number;
  } | null;
}
```

**Propsy:**
Brak (komponent nie przyjmuje props)

## 5. Typy

### 5.1 Typy istniejące (wykorzystywane)

Brak dedykowanych typów DTO w `types.ts` dla autentykacji, ponieważ korzystamy bezpośrednio z Supabase Auth SDK.

### 5.2 Nowe typy lokalne (w plikach komponentów)

**LoginFormState** (w `LoginForm.tsx`):
```typescript
interface LoginFormState {
  email: string;           // Wartość pola email
  password: string;        // Wartość pola hasło
  isLoading: boolean;      // Czy trwa wysyłanie żądania
  error: string | null;    // Ogólny błąd formularza (wyświetlany u góry)
  emailError: string | null;    // Błąd walidacji pola email
  passwordError: string | null; // Błąd walidacji pola hasło
}
```

**LoginCredentials** (w `LoginForm.tsx`):
```typescript
interface LoginCredentials {
  email: string;    // Adres email użytkownika
  password: string; // Hasło użytkownika
}
```

**SupabaseAuthResponse** (w `LoginForm.tsx` - lub w shared types jeśli będzie wielokrotnie używany):
```typescript
interface SupabaseAuthResponse {
  data: {
    user: {
      id: string;
      email: string;
    } | null;
    session: {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
    } | null;
  };
  error: {
    message: string;
    status: number;
  } | null;
}
```

**Uwaga:** Faktyczne typy z Supabase SDK (`@supabase/supabase-js`) będą importowane i wykorzystywane bezpośrednio:
```typescript
import type { AuthError, Session, User } from '@supabase/supabase-js';
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentu (useState)

Cały stan formularza zarządzany jest lokalnie w komponencie `LoginForm.tsx` przy użyciu React hooks:

```typescript
const [email, setEmail] = useState<string>('');
const [password, setPassword] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [emailError, setEmailError] = useState<string | null>(null);
const [passwordError, setPasswordError] = useState<string | null>(null);
```

**Wyjaśnienie zmiennych stanu:**
- `email`, `password` - kontrolowane inputy (controlled components)
- `isLoading` - blokowanie formularza podczas oczekiwania na response
- `error` - ogólny błąd formularza wyświetlany w bannerze u góry
- `emailError`, `passwordError` - błędy walidacji dla konkretnych pól

### 6.2 Custom hook

**Nie jest wymagany** dla MVP. Stan jest prosty i ograniczony do jednego komponentu.

W przyszłości, jeśli logika autentykacji będzie współdzielona między logowaniem a rejestracją, można wydzielić custom hook `useAuth` w `src/components/hooks/useAuth.ts`:

```typescript
// Potencjalny custom hook (poza zakresem MVP)
export function useAuth() {
  const login = async (email: string, password: string) => { /* ... */ };
  const logout = async () => { /* ... */ };
  const register = async (email: string, password: string) => { /* ... */ };
  
  return { login, logout, register };
}
```

### 6.3 Globalny stan sesji

Stan zalogowania użytkownika (sesja) zarządzany jest przez **Supabase Auth** i przechowywany w:
- `localStorage` (refresh token) - zarządzane przez Supabase SDK
- Cookies (session) - zarządzane przez middleware Astro
- `context.locals.supabase` - dostęp server-side w Astro

**Middleware** (`src/middleware/index.ts`) odpowiada za:
- Tworzenie klienta Supabase z access token z Authorization header
- Przekazywanie klienta do context.locals dla dostępu w endpointach

**Client-side:** Supabase SDK automatycznie zarządza sesją i refresh tokenem.

## 7. Integracja API

### 7.1 Endpoint autentykacji

**Metoda:** `POST`  
**URL:** `/api/auth/signin`  
**Typ:** Proxy endpoint - autentykacja przez backend API (nie bezpośrednio Supabase)

**Uwaga:** Aplikacja używa proxy endpointów dla autentykacji, aby zapobiec wystawieniu Supabase credentials na frontend.

### 7.2 Request

**Typ żądania:** `LoginCredentials`
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Przykładowe wywołanie:**
```typescript
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: email,
    password: password,
  }),
});

const data = await response.json();
```

**Walidacja (backend):**
- `email`: required, valid email format
- `password`: required, string

### 7.3 Response

**Sukces (200 OK):**
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

**Błędy:**

**400 Bad Request** - Walidacja nie powiodła się:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

**401 Unauthorized** - Nieprawidłowe dane logowania:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

**500 Internal Server Error** - Błąd Supabase:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Authentication service error"
  }
}
```

### 7.4 Obsługa response

**Po sukcesie (200 OK):**
1. Zapisanie `access_token` i `refresh_token` w localStorage:
   ```typescript
   localStorage.setItem('access_token', data.access_token);
   localStorage.setItem('refresh_token', data.refresh_token);
   ```
2. Ustawienie tokenu w future requests (opcjonalnie w kontekście/state)
3. Frontend wykonuje client-side redirect: `window.location.href = '/'`
4. Użytkownik trafia na dashboard

**Po błędzie:**
1. Parsowanie `response.status` i `error.code`
2. Mapowanie na przyjazne komunikaty użytkownika:
   - 400 → Wyświetlenie szczegółowych błędów walidacji
   - 401 → "Nieprawidłowy email lub hasło"
   - 500 → "Coś poszło nie tak. Spróbuj ponownie."
   - Network error → "Problem z połączeniem. Sprawdź internet."
3. Wyświetlenie błędu w bannerze formularza
4. Ustawienie `isLoading = false`
5. Przywrócenie fokusa na pole email

## 8. Interakcje użytkownika

### 8.1 Załadowanie strony

**Akcja:** Użytkownik wchodzi na `/login`

**Przepływ:**
1. Server-side: sprawdzenie czy użytkownik ma aktywną sesję
2. Jeśli TAK → redirect do `/` (dashboard)
3. Jeśli NIE → renderowanie AuthLayout + LoginForm
4. Client-side: autofocus na polu email

### 8.2 Wypełnianie formularza

**Akcja:** Użytkownik wprowadza email i hasło

**Przepływ:**
1. onChange → aktualizacja `email` / `password` state
2. Walidacja w czasie rzeczywistym:
   - Email: sprawdzenie formatu po opuszczeniu pola (onBlur)
   - Hasło: sprawdzenie czy nie jest puste po opuszczeniu pola (onBlur)
3. Wyświetlanie błędów walidacji pod odpowiednimi polami
4. Czyszczenie błędów gdy użytkownik zacznie poprawiać wartość

### 8.3 Submisja formularza

**Akcja:** Użytkownik klika "Zaloguj się" lub wciska Enter

**Przepływ:**
1. `handleSubmit(e)` → `e.preventDefault()`
2. Walidacja przed wysłaniem:
   - Sprawdzenie czy email i hasło są wypełnione
   - Sprawdzenie formatu email
   - Jeśli błędy → wyświetlenie i return
3. Ustawienie `isLoading = true` (blokada formularza, zmiana tekstu przycisku)
4. Wysłanie żądania do Supabase:
   ```typescript
   const { data, error } = await supabaseClient.auth.signInWithPassword({
     email,
     password,
   });
   ```
5. Obsługa response:
   - **Sukces:** `window.location.href = '/'`
   - **Błąd:** wyświetlenie komunikatu, `isLoading = false`, fokus na email

### 8.4 Obsługa błędów

**Akcja:** API zwraca błąd (nieprawidłowe dane, problem z siecią, itp.)

**Przepływ:**
1. Parsowanie `error.status` lub `error.message`
2. Mapowanie na przyjazny komunikat (patrz: sekcja 10.2)
3. Ustawienie `error` state z komunikatem
4. Wyświetlenie czerwonego banneru u góry formularza
5. Ustawienie `isLoading = false`
6. Przywrócenie fokusa na pole email dla łatwej korekty

### 8.5 Nawigacja do rejestracji

**Akcja:** Użytkownik klika link "Zarejestruj się"

**Przepływ:**
1. Kliknięcie `<a href="/register">` → standardowa nawigacja HTML
2. Przejście na stronę `/register`

### 8.6 Tab order

**Sekwencja focusa:**
1. Pole Email
2. Pole Hasło
3. Przycisk "Zaloguj się"
4. Link "Zarejestruj się"

## 9. Warunki i walidacja

### 9.1 Walidacja po stronie klienta

#### Email

**Warunek 1: Pole wymagane**
- Komponent: `LoginForm.tsx` - pole email
- Moment walidacji: onSubmit (przed wysłaniem)
- Komunikat: "Email jest wymagany"
- Wpływ na UI: czerwony border, komunikat błędu pod polem, aria-invalid="true"

**Warunek 2: Format email**
- Komponent: `LoginForm.tsx` - pole email
- Moment walidacji: onBlur (po opuszczeniu pola) + onSubmit
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Komunikat: "Podaj poprawny adres email"
- Wpływ na UI: czerwony border, komunikat błędu pod polem, aria-invalid="true"

#### Hasło

**Warunek 3: Pole wymagane**
- Komponent: `LoginForm.tsx` - pole password
- Moment walidacji: onSubmit (przed wysłaniem)
- Komunikat: "Hasło jest wymagane"
- Wpływ na UI: czerwony border, komunikat błędu pod polem, aria-invalid="true"

**Uwaga:** W przeciwieństwie do formularza rejestracji, na logowaniu NIE walidujemy długości hasła ani innych wymagań, ponieważ użytkownik może mieć hasło utworzone pod starszymi regułami.

### 9.2 Walidacja response z API

**Warunek 4: Nieprawidłowe dane logowania (400/401)**
- Komponent: `LoginForm.tsx` - cały formularz
- Trigger: response error.status === 400 || error.status === 401
- Komunikat: "Nieprawidłowy email lub hasło"
- Wpływ na UI: czerwony banner u góry formularza, isLoading=false, fokus na email

**Warunek 5: Zbyt wiele prób (429 - Rate Limiting)**
- Komponent: `LoginForm.tsx` - cały formularz
- Trigger: response error.status === 429
- Komunikat: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę."
- Wpływ na UI: czerwony banner u góry formularza, isLoading=false

**Warunek 6: Błąd serwera (500)**
- Komponent: `LoginForm.tsx` - cały formularz
- Trigger: response error.status === 500
- Komunikat: "Coś poszło nie tak. Spróbuj ponownie za chwilę."
- Wpływ na UI: czerwony banner u góry formularza, isLoading=false

**Warunek 7: Błąd sieci (Network Error)**
- Komponent: `LoginForm.tsx` - cały formularz
- Trigger: catch block, brak response.status
- Komunikat: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie."
- Wpływ na UI: czerwony banner u góry formularza, isLoading=false

**Warunek 8: Timeout**
- Komponent: `LoginForm.tsx` - cały formularz
- Trigger: timeout error (jeśli skonfigurowany w Supabase client)
- Komunikat: "Logowanie trwa zbyt długo. Spróbuj ponownie."
- Wpływ na UI: czerwony banner u góry formularza, isLoading=false

### 9.3 Warunki dostępu do strony

**Warunek 9: Użytkownik już zalogowany**
- Komponent: `login.astro` - server-side
- Moment sprawdzenia: przed renderowaniem strony
- Logika: sprawdzenie `await context.locals.supabase.auth.getSession()`
- Wpływ na UI: redirect do `/` (dashboard), strona nie renderuje się

## 10. Obsługa błędów

### 10.1 Błędy walidacji (client-side)

**Scenariusz:** Użytkownik próbuje zalogować się bez wypełnienia pól lub z nieprawidłowym emailem

**Obsługa:**
1. Walidacja w `handleSubmit` przed wywołaniem API
2. Ustawienie odpowiednich stanów błędów (`emailError`, `passwordError`)
3. Wyświetlenie komunikatów pod polami formularza
4. Nie wysyłanie żądania do API
5. Utrzymanie fokusa na pierwszym polu z błędem

**Przykładowy kod:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Reset errors
  setEmailError(null);
  setPasswordError(null);
  setError(null);
  
  // Validate
  let hasError = false;
  
  if (!email) {
    setEmailError('Email jest wymagany');
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setEmailError('Podaj poprawny adres email');
    hasError = true;
  }
  
  if (!password) {
    setPasswordError('Hasło jest wymagane');
    hasError = true;
  }
  
  if (hasError) return;
  
  // Continue with API call...
};
```

### 10.2 Błędy API

**Scenariusz 1: Nieprawidłowe dane logowania (400/401)**

**Przyczyna:** Użytkownik podał nieprawidłowy email lub hasło

**Obsługa:**
```typescript
if (error) {
  if (error.status === 400 || error.status === 401) {
    setError('Nieprawidłowy email lub hasło');
  }
  setIsLoading(false);
  // Fokus na pole email dla łatwej korekty
  emailInputRef.current?.focus();
}
```

**UI:** Czerwony banner u góry z komunikatem, formularz odblokowany

---

**Scenariusz 2: Rate limiting (429)**

**Przyczyna:** Zbyt wiele prób logowania w krótkim czasie

**Obsługa:**
```typescript
if (error?.status === 429) {
  setError('Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.');
  setIsLoading(false);
}
```

**UI:** Czerwony banner, formularz odblokowany (użytkownik może spróbować później)

---

**Scenariusz 3: Błąd serwera (500)**

**Przyczyna:** Problem po stronie Supabase

**Obsługa:**
```typescript
if (error?.status === 500) {
  setError('Coś poszło nie tak. Spróbuj ponownie za chwilę.');
  setIsLoading(false);
}
```

**UI:** Czerwony banner, formularz odblokowany

---

**Scenariusz 4: Błąd sieci (Network Error)**

**Przyczyna:** Brak połączenia internetowego lub problem z siecią

**Obsługa:**
```typescript
try {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  // ...
} catch (err) {
  setError('Problem z połączeniem. Sprawdź internet i spróbuj ponownie.');
  setIsLoading(false);
}
```

**UI:** Czerwony banner z informacją o problemie z siecią

---

**Scenariusz 5: Nieoczekiwany błąd**

**Przyczyna:** Nieznany błąd (fallback)

**Obsługa:**
```typescript
if (error && !error.status) {
  setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  setIsLoading(false);
}
```

**UI:** Generyczny komunikat błędu

### 10.3 Edge cases

**Edge case 1: Użytkownik już zalogowany próbuje wejść na /login**

**Obsługa:** Server-side redirect w `login.astro`:
```typescript
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (session) {
  return Astro.redirect('/');
}
```

---

**Edge case 2: Kliknięcie przycisku submit podczas ładowania**

**Obsługa:** Disabled state na przycisku i polach:
```tsx
<Button disabled={isLoading} type="submit">
  {isLoading ? 'Logowanie...' : 'Zaloguj się'}
</Button>

<Input disabled={isLoading} {...props} />
```

---

**Edge case 3: Utrata połączenia podczas logowania**

**Obsługa:** Try-catch + timeout (jeśli skonfigurowany), wyświetlenie komunikatu o problemie z siecią

---

**Edge case 4: Wielokrotne wysłanie formularza (double submit)**

**Obsługa:** 
- Disable przycisku podczas `isLoading`
- `handleSubmit` sprawdza `isLoading` na początku i zwraca `return` jeśli true
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isLoading) return; // Prevent double submit
  setIsLoading(true);
  // ...
};
```

## 11. Kroki implementacji

### Krok 1: Utworzenie AuthLayout

**Plik:** `src/layouts/AuthLayout.astro`

**Zadania:**
1. Skopiować strukturę z `Layout.astro`
2. Usunąć nawigację (jeśli istnieje)
3. Dodać wrapper z centrowaniem contentu:
   ```astro
   <div class="min-h-screen flex items-center justify-center bg-neutral-50">
     <div class="w-full max-w-md p-8">
       <slot />
     </div>
   </div>
   ```
4. Dodać props dla `title` z domyślną wartością "AI Flashcards"
5. Import `../styles/global.css`

**Oczekiwany rezultat:** Layout gotowy do użycia w stronach autentykacji

---

### Krok 2: Instalacja brakujących komponentów Shadcn/ui (jeśli potrzeba)

**Sprawdzenie czy komponenty istnieją:**
```bash
ls src/components/ui/input.tsx
ls src/components/ui/button.tsx
ls src/components/ui/label.tsx
```

**Jeśli brakują, instalacja:**
```bash
npx shadcn@latest add input
npx shadcn@latest add button
npx shadcn@latest add label
```

**Oczekiwany rezultat:** Komponenty Input, Button, Label dostępne w `src/components/ui/`

---

### Krok 3: Utworzenie komponentu LoginForm

**Plik:** `src/components/LoginForm.tsx`

**Zadania:**
1. Utworzyć nowy plik React component
2. Zdefiniować typy lokalne:
   - `LoginFormState` (jako interfejs)
   - `LoginCredentials` (jako interfejs)
3. Zaimportować zależności:
   ```typescript
   import { useState, useRef, type FormEvent } from 'react';
   import { supabaseClient } from '@/db/supabase.client';
   import { Button } from '@/components/ui/button';
   import { Input } from '@/components/ui/input';
   import { Label } from '@/components/ui/label';
   ```
4. Zdefiniować stany komponentu:
   ```typescript
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [emailError, setEmailError] = useState<string | null>(null);
   const [passwordError, setPasswordError] = useState<string | null>(null);
   ```
5. Utworzyć ref dla pola email (dla fokusa):
   ```typescript
   const emailInputRef = useRef<HTMLInputElement>(null);
   ```
6. Zaimplementować funkcję walidacji email:
   ```typescript
   const validateEmail = (email: string): string | null => {
     if (!email) return 'Email jest wymagany';
     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
       return 'Podaj poprawny adres email';
     }
     return null;
   };
   ```
7. Zaimplementować funkcję walidacji hasła:
   ```typescript
   const validatePassword = (password: string): string | null => {
     if (!password) return 'Hasło jest wymagane';
     return null;
   };
   ```
8. Zaimplementować `handleEmailBlur`:
   ```typescript
   const handleEmailBlur = () => {
     setEmailError(validateEmail(email));
   };
   ```
9. Zaimplementować `handlePasswordBlur`:
   ```typescript
   const handlePasswordBlur = () => {
     setPasswordError(validatePassword(password));
   };
   ```
10. Zaimplementować funkcję mapowania błędów API:
    ```typescript
    const getErrorMessage = (error: any): string => {
      if (!error) return 'Wystąpił nieoczekiwany błąd';
      
      const status = error.status;
      
      if (status === 400 || status === 401) {
        return 'Nieprawidłowy email lub hasło';
      }
      if (status === 429) {
        return 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.';
      }
      if (status === 500) {
        return 'Coś poszło nie tak. Spróbuj ponownie za chwilę.';
      }
      
      return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
    };
    ```

**Oczekiwany rezultat:** Szkielet komponentu z podstawowymi funkcjami walidacji

---

### Krok 4: Implementacja handleSubmit w LoginForm

**Plik:** `src/components/LoginForm.tsx`

**Zadania:**
1. Utworzyć funkcję `handleSubmit`:
   ```typescript
   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     
     // Reset all errors
     setEmailError(null);
     setPasswordError(null);
     setError(null);
     
     // Validate before submit
     const emailValidation = validateEmail(email);
     const passwordValidation = validatePassword(password);
     
     if (emailValidation || passwordValidation) {
       setEmailError(emailValidation);
       setPasswordError(passwordValidation);
       return;
     }
     
     // Start loading
     setIsLoading(true);
     
     try {
       const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
         email: email.trim(),
         password: password,
       });
       
       if (authError) {
         setError(getErrorMessage(authError));
         setIsLoading(false);
         emailInputRef.current?.focus();
         return;
       }
       
       if (data.session) {
         // Success! Redirect to dashboard
         window.location.href = '/';
       } else {
         setError('Nie udało się zalogować. Spróbuj ponownie.');
         setIsLoading(false);
       }
     } catch (err) {
       console.error('Login error:', err);
       setError('Problem z połączeniem. Sprawdź internet i spróbuj ponownie.');
       setIsLoading(false);
     }
   };
   ```

**Oczekiwany rezultat:** Pełna funkcjonalność logowania z obsługą błędów

---

### Krok 5: Budowa JSX w LoginForm

**Plik:** `src/components/LoginForm.tsx`

**Zadania:**
1. Zbudować return statement z pełną strukturą formularza (patrz: sekcja 4.3)
2. Dodać nagłówek z tytułem i opisem
3. Dodać error banner (warunkowe renderowanie gdy `error` !== null)
4. Zbudować pole Email:
   - Label z htmlFor
   - Input z wszystkimi wymaganymi props (type, value, onChange, onBlur, ref, disabled, aria-*)
   - Error message (warunkowe renderowanie)
5. Zbudować pole Password (analogicznie do Email, bez ref)
6. Dodać przycisk submit z tekstem zmiennym w zależności od `isLoading`
7. Dodać link do rejestracji na dole
8. Dodać odpowiednie klasy Tailwind dla layoutu i stylowania

**Oczekiwany rezultat:** Pełny komponent LoginForm gotowy do użycia

---

### Krok 6: Utworzenie strony login.astro

**Plik:** `src/pages/login.astro`

**Zadania:**
1. Utworzyć nowy plik Astro page
2. Dodać frontmatter z logiką server-side:
   ```astro
   ---
   import AuthLayout from '@/layouts/AuthLayout.astro';
   import LoginForm from '@/components/LoginForm';
   
   // Check if user is already logged in
   const { data: { session } } = await Astro.locals.supabase.auth.getSession();
   
   if (session) {
     return Astro.redirect('/');
   }
   ---
   ```
3. Dodać struktur HTML:
   ```astro
   <AuthLayout title="Zaloguj się - AI Flashcards">
     <LoginForm client:load />
   </AuthLayout>
   ```
4. Sprawdzić czy `client:load` jest odpowiednią dyrektywą (dla interaktywności od początku)

**Oczekiwany rezultat:** Strona logowania dostępna pod `/login`

---

### Krok 7: Konfiguracja aliasów (jeśli potrzeba)

**Plik:** `tsconfig.json`

**Zadania:**
1. Sprawdzić czy alias `@/*` jest skonfigurowany:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```
2. Jeśli nie, dodać konfigurację
3. Sprawdzić czy `astro.config.mjs` zawiera odpowiedni alias (jeśli wymagane przez Astro 5)

**Oczekiwany rezultat:** Aliasy działające w całym projekcie

---

### Krok 8: Testowanie formularza logowania

**Scenariusze testowe:**

1. **Test: Walidacja pustego formularza**
   - Wejść na `/login`
   - Kliknąć "Zaloguj się" bez wypełniania pól
   - **Oczekiwany rezultat:** Błędy walidacji pod oboma polami, brak wywołania API

2. **Test: Walidacja nieprawidłowego emaila**
   - Wprowadzić "test" w pole email
   - Opuścić pole (blur)
   - **Oczekiwany rezultat:** Błąd "Podaj poprawny adres email"

3. **Test: Nieprawidłowe dane logowania**
   - Wprowadzić prawidłowy format email (np. "test@example.com")
   - Wprowadzić dowolne hasło
   - Kliknąć "Zaloguj się"
   - **Oczekiwany rezultat:** Banner z błędem "Nieprawidłowy email lub hasło"

4. **Test: Pomyślne logowanie**
   - Wprowadzić poprawne dane logowania (utworzone wcześniej konto)
   - Kliknąć "Zaloguj się"
   - **Oczekiwany rezultat:** Redirect na `/` (dashboard)

5. **Test: Loading state**
   - Wprowadzić dane i kliknąć "Zaloguj się"
   - **Oczekiwany rezultat:** 
     - Przycisk zmienia tekst na "Logowanie..."
     - Przycisk jest disabled
     - Pola są disabled
     - Po zakończeniu wszystko wraca do normy

6. **Test: Redirect zalogowanego użytkownika**
   - Zalogować się
   - Spróbować wejść na `/login`
   - **Oczekiwany rezultat:** Automatyczny redirect na `/`

7. **Test: Accessibility**
   - Nawigacja Tab przez wszystkie elementy
   - **Oczekiwany rezultat:** Poprawna kolejność fokusa (Email → Password → Button → Link)
   - Sprawdzenie ARIA attributes w DevTools
   - **Oczekiwany rezultat:** aria-invalid, aria-describedby poprawnie ustawione

8. **Test: Keyboard navigation**
   - Wypełnić formularz
   - Wcisnąć Enter
   - **Oczekiwany rezultat:** Formularz się submituje (analogicznie do kliknięcia przycisku)

**Oczekiwany rezultat:** Wszystkie testy przechodzą pomyślnie

---

### Krok 9: Obsługa błędów i edge cases

**Zadania:**
1. Przetestować wszystkie scenariusze błędów opisane w sekcji 10.2
2. Sprawdzić czy komunikaty błędów są przyjazne dla użytkownika
3. Sprawdzić czy formularz odzyskuje stan po błędzie (odblokowanie, możliwość ponownego submitu)
4. Przetestować edge cases z sekcji 10.3
5. Sprawdzić czy fokus wraca do pola email po błędzie

**Oczekiwany rezultat:** Wszystkie edge cases obsłużone, aplikacja nie crashuje

---

### Krok 10: Stylowanie i dopracowanie UX

**Zadania:**
1. Sprawdzić responsywność na różnych rozmiarach ekranu (mobile, tablet, desktop)
2. Sprawdzić czy kolory błędów są wystarczająco kontrastowe (WCAG AA)
3. Sprawdzić czy loading state jest wyraźnie widoczny
4. Sprawdzić czy wszystkie interakcje mają odpowiedni feedback (hover, focus, active states)
5. Przetestować w różnych przeglądarkach (Chrome, Firefox, Safari, Edge)
6. Sprawdzić czy autofocus na email działa poprawnie
7. Sprawdzić czy formularz wygląda dobrze w trybie jasnym (project nie ma dark mode w MVP)

**Oczekiwany rezultat:** Widok logowania jest w pełni funkcjonalny, dostępny i przyjazny użytkownikowi

---

### Krok 11: Dokumentacja i komentarze

**Zadania:**
1. Dodać JSDoc comments do funkcji `validateEmail`, `validatePassword`, `getErrorMessage`, `handleSubmit`
2. Dodać komentarze wyjaśniające nietrywialne fragmenty kodu
3. Zaktualizować dokumentację API (jeśli istnieje) o informacje dotyczące autentykacji
4. Utworzyć commit z opisowym message (np. "feat: implement login page with Supabase Auth")

**Oczekiwany rezultat:** Kod jest czytelny i dobrze udokumentowany dla innych deweloperów

---

### Krok 12: Code review i refactoring

**Zadania:**
1. Przejrzeć kod pod kątem:
   - Powtarzającego się kodu (DRY principle)
   - Możliwości wydzielenia funkcji pomocniczych
   - Spójności nazewnictwa
   - Zgodności z coding guidelines projektu
2. Sprawdzić czy wszystkie importy są używane
3. Sprawdzić czy nie ma console.log (oprócz console.error w catch)
4. Uruchomić linter i naprawić błędy:
   ```bash
   npm run lint
   ```
5. Uruchomić formatter (jeśli skonfigurowany):
   ```bash
   npm run format
   ```

**Oczekiwany rezultat:** Kod jest czysty, zgodny ze standardami projektu i gotowy do merge

---

## Podsumowanie

Plan implementacji widoku logowania obejmuje:
- **3 komponenty/pliki:** AuthLayout.astro, LoginForm.tsx, login.astro
- **3 typy lokalne:** LoginFormState, LoginCredentials, SupabaseAuthResponse (lub użycie typów z SDK)
- **6 stanów lokalnych:** email, password, isLoading, error, emailError, passwordError
- **Integracja z Supabase Auth** poprzez SDK bez dodatkowych endpointów backendowych
- **Kompleksowa walidacja** po stronie klienta i obsługa błędów API
- **Pełna dostępność** (ARIA, fokus, keyboard navigation)
- **Bezpieczeństwo** (generyczne komunikaty błędów, rate limiting przez Supabase)

Implementacja powinna zająć około **4-6 godzin** doświadczonemu developerowi frontendowemu, włączając w to testowanie i dopracowanie UX.
