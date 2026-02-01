# Plan implementacji widoku Rejestracji (Signup)

## 1. Przegląd

Widok rejestracji umożliwia nowym użytkownikom utworzenie konta w aplikacji AI Flashcards przy użyciu adresu email i hasła. Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do pustego dashboardu. Widok zapewnia walidację danych w czasie rzeczywistym, komunikaty błędów oraz spełnia wymogi dostępności (WCAG).

**Kluczowe cele:**
- Prosty i intuicyjny proces rejestracji
- Walidacja w czasie rzeczywistym (email, hasło, zgodność haseł)
- Zabezpieczenie przed rejestracją z istniejącym emailem
- Automatyczne logowanie i przekierowanie po sukcesie
- Wskaźnik siły hasła (opcjonalnie)
- Pełna obsługa klawiatury i dostępność

## 2. Routing widoku

**Ścieżka:** `/signup`

**Typ:** Publiczna strona (dostępna dla niezalogowanych użytkowników)

**Konfiguracja:**
- Plik: `src/pages/signup.astro`
- Middleware: Przekierowanie zalogowanych użytkowników na `/` (dashboard)
- Po rejestracji: Automatyczne przekierowanie na `/` (dashboard)

## 3. Struktura komponentów

```
SignupPage (signup.astro)
└── AuthLayout (layouts/AuthLayout.astro)
    └── SignupForm (components/SignupForm.tsx) [React]
        ├── Input (components/ui/input.tsx) [Shadcn/ui] - Email
        ├── Input (components/ui/input.tsx) [Shadcn/ui] - Hasło
        ├── Input (components/ui/input.tsx) [Shadcn/ui] - Potwierdź hasło
        ├── PasswordStrengthIndicator (components/PasswordStrengthIndicator.tsx) [React, opcjonalnie]
        ├── Button (components/ui/button.tsx) [Shadcn/ui] - Submit
        └── Link do /login
```

**Hierarchia:**
1. **SignupPage** - strona Astro, kontener najwyższego poziomu
2. **AuthLayout** - layout dla stron autentykacji (centrowanie, styling)
3. **SignupForm** - główny komponent React z logiką formularza
4. **Input** (×3) - pola formularza z Shadcn/ui
5. **PasswordStrengthIndicator** - wizualny wskaźnik siły hasła (opcjonalny)
6. **Button** - przycisk submit z Shadcn/ui

## 4. Szczegóły komponentów

### 4.1 SignupPage (`src/pages/signup.astro`)

**Opis:**
Strona Astro renderująca widok rejestracji. Odpowiada za przekierowanie zalogowanych użytkowników oraz integrację z layoutem `AuthLayout`.

**Główne elementy:**
- Import i użycie `AuthLayout`
- Import i użycie `SignupForm` z `client:load`
- Meta tags (title, description)

**Obsługiwane interakcje:**
- Brak (statyczna strona Astro, interakcje w `SignupForm`)

**Walidacja:**
- Sprawdzenie czy użytkownik jest zalogowany (middleware lub w komponencie)
- Przekierowanie zalogowanych na `/`

**Typy:**
- Brak specjalnych typów

**Propsy:**
- Brak (root page)

---

### 4.2 AuthLayout (`src/layouts/AuthLayout.astro`)

**Opis:**
Layout Astro dla stron autentykacji (login, signup). Zapewnia spójny wygląd, centrowanie formularza, branding aplikacji.

**Główne elementy:**
- `Layout` - base layout z meta tags
- `<div>` - kontener centrujący (flexbox/grid)
- Logo aplikacji / nazwa
- `<slot />` - miejsce na treść (formularz)
- Opcjonalnie: link do strony głównej, footer

**Struktura HTML:**
```html
<Layout title="Rejestracja - AI Flashcards">
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold">AI Flashcards</h1>
      </div>
      <slot />
    </div>
  </div>
</Layout>
```

**Obsługiwane interakcje:**
- Brak

**Walidacja:**
- Brak

**Typy:**
- `Props { title: string }`

**Propsy:**
- `title: string` - tytuł strony

---

### 4.3 SignupForm (`src/components/SignupForm.tsx`)

**Opis:**
Główny komponent React zawierający logikę formularza rejestracji. Zarządza stanem formularza, walidacją w czasie rzeczywistym, komunikatami błędów oraz integracją z Supabase Auth API. Po pomyślnej rejestracji automatycznie loguje użytkownika i przekierowuje na dashboard.

**Główne elementy:**
```tsx
<form onSubmit={handleSubmit}>
  <div className="space-y-6">
    {/* Nagłówek */}
    <div>
      <h2>Utwórz konto</h2>
      <p>Zacznij naukę z fiszkami AI</p>
    </div>

    {/* Globalny komunikat błędu */}
    {formError && <Alert variant="destructive">{formError}</Alert>}

    {/* Pole Email */}
    <div>
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        autoFocus
        required
        aria-invalid={!!emailError}
        aria-describedby={emailError ? "email-error" : undefined}
      />
      {emailError && <p id="email-error" className="text-sm text-destructive">{emailError}</p>}
    </div>

    {/* Pole Hasło */}
    <div>
      <Label htmlFor="password">Hasło</Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          required
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
        >
          {/* Ikona oka */}
        </button>
      </div>
      {passwordError && <p id="password-error" className="text-sm text-destructive">{passwordError}</p>}
      {password && <PasswordStrengthIndicator password={password} />}
    </div>

    {/* Pole Potwierdź hasło */}
    <div>
      <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
      <Input
        id="confirmPassword"
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
        required
        aria-invalid={!!confirmPasswordError}
        aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
      />
      {confirmPasswordError && <p id="confirm-password-error" className="text-sm text-destructive">{confirmPasswordError}</p>}
    </div>

    {/* Przycisk Submit */}
    <Button
      type="submit"
      className="w-full"
      disabled={isSubmitting || !isFormValid}
    >
      {isSubmitting ? "Rejestrowanie..." : "Utwórz konto"}
    </Button>

    {/* Link do logowania */}
    <p className="text-center text-sm">
      Masz już konto?{" "}
      <a href="/login" className="text-primary hover:underline">
        Zaloguj się
      </a>
    </p>
  </div>
</form>
```

**Obsługiwane interakcje:**
- `onChange` na polach input - walidacja w czasie rzeczywistym
- `onSubmit` na formularzu - wysłanie danych do Supabase Auth
- `onClick` na ikonie oka - toggle widoczności hasła
- `onClick` na linku "Zaloguj się" - przekierowanie do `/login`
- Obsługa `Enter` - submit formularza

**Walidacja:**

**Email:**
- Format: RFC 5322 (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` lub bardziej zaawansowany)
- Wymagane: tak
- Błąd: "Wprowadź poprawny adres email"
- Walidacja: onChange + onBlur

**Hasło:**
- Minimalna długość: 8 znaków
- Wymagane: tak
- Błąd: "Hasło musi mieć minimum 8 znaków"
- Walidacja: onChange

**Potwierdź hasło:**
- Zgodność z hasłem głównym
- Wymagane: tak
- Błąd: "Hasła muszą być identyczne"
- Walidacja: onChange (porównanie z `password`)

**Formularz (submit):**
- Wszystkie pola wypełnione
- Brak błędów walidacji
- Email nie istnieje w bazie (sprawdzane przez backend)

**Typy:**
- `SignupFormState` - interfejs stanu formularza
- `SignupFormErrors` - interfejs błędów walidacji
- `SignupCredentials` - typ danych wysyłanych do API
- `SupabaseAuthResponse` - typ odpowiedzi z Supabase Auth

**Propsy:**
- Brak (komponent standalone)

---

### 4.4 Input (`src/components/ui/input.tsx`)

**Opis:**
Komponent input z Shadcn/ui. Zapewnia spójny wygląd, obsługę błędów (aria-invalid), focus states oraz integrację z labelami.

**Uwaga:** Komponent do utworzenia - obecnie brak w projekcie.

**Główne elementy:**
```tsx
<input
  className={cn(
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1",
    "text-sm shadow-sm transition-colors",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
    className
  )}
  ref={ref}
  {...props}
/>
```

**Obsługiwane interakcje:**
- `onChange`, `onBlur`, `onFocus` - przekazywane przez propsy
- Obsługa `autoFocus`, `disabled`, `required`

**Walidacja:**
- Wizualna indykacja błędów przez `aria-invalid` i style

**Typy:**
- `React.ComponentProps<"input">` + forwarded ref

**Propsy:**
- Wszystkie standardowe atrybuty `<input>`
- `className?: string` - dodatkowe klasy CSS

---

### 4.5 Label (`src/components/ui/label.tsx`)

**Opis:**
Komponent label z Shadcn/ui (Radix UI). Zapewnia dostępność i spójny wygląd etykiet pól formularza.

**Uwaga:** Komponent do utworzenia - obecnie brak w projekcie.

**Główne elementy:**
```tsx
<RadixLabel.Root
  className={cn(
    "text-sm font-medium leading-none",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...props}
/>
```

**Typy:**
- `React.ComponentProps<typeof RadixLabel.Root>`

**Propsy:**
- `htmlFor: string` - id pola input
- `children: React.ReactNode`

---

### 4.6 Alert (`src/components/ui/alert.tsx`)

**Opis:**
Komponent alert z Shadcn/ui. Wyświetla komunikaty błędów lub informacji.

**Uwaga:** Komponent do utworzenia - obecnie brak w projekcie.

**Główne elementy:**
```tsx
<div
  className={cn(
    "relative w-full rounded-lg border px-4 py-3 text-sm",
    {
      "bg-destructive/10 text-destructive border-destructive": variant === "destructive",
      "bg-background text-foreground": variant === "default",
    },
    className
  )}
  role="alert"
  {...props}
/>
```

**Typy:**
- `variant: "default" | "destructive"`

**Propsy:**
- `variant?: "default" | "destructive"`
- `children: React.ReactNode`

---

### 4.7 PasswordStrengthIndicator (`src/components/PasswordStrengthIndicator.tsx`)

**Opis:**
Komponent React wyświetlający wizualny wskaźnik siły hasła. Opcjonalny - można zaimplementować w późniejszej fazie.

**Główne elementy:**
```tsx
<div className="mt-2">
  <div className="flex gap-1">
    <div className={cn("h-1 flex-1 rounded", strengthColor[0])} />
    <div className={cn("h-1 flex-1 rounded", strengthColor[1])} />
    <div className={cn("h-1 flex-1 rounded", strengthColor[2])} />
    <div className={cn("h-1 flex-1 rounded", strengthColor[3])} />
  </div>
  <p className="text-xs text-muted-foreground mt-1">{strengthText}</p>
</div>
```

**Logika siły hasła:**
- Słabe (0-1): < 8 znaków, tylko litery lub cyfry
- Średnie (2): 8+ znaków, litery + cyfry
- Silne (3): 8+ znaków, litery + cyfry + znaki specjalne
- Bardzo silne (4): 12+ znaków, litery (małe+duże) + cyfry + znaki specjalne

**Typy:**
- `PasswordStrength: 0 | 1 | 2 | 3 | 4`

**Propsy:**
- `password: string`

## 5. Typy

### 5.1 Nowe typy ViewModel

```typescript
/**
 * Stan formularza rejestracji
 * Przechowuje wartości wszystkich pól formularza
 */
export interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

/**
 * Błędy walidacji formularza rejestracji
 * Każde pole może mieć komunikat błędu lub null jeśli brak błędu
 */
export interface SignupFormErrors {
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
  form: string | null; // Globalny błąd formularza (np. z API)
}

/**
 * Dane logowania wysyłane do Supabase Auth API
 * Format zgodny z dokumentacją Supabase Auth
 */
export interface SignupCredentials {
  email: string;
  password: string;
}

/**
 * Siła hasła (0-4)
 * 0 = bardzo słabe, 4 = bardzo silne
 */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * Props dla PasswordStrengthIndicator
 */
export interface PasswordStrengthIndicatorProps {
  password: string;
}
```

### 5.2 Typy z Supabase Auth

```typescript
/**
 * Typ odpowiedzi z Supabase Auth (signup/login)
 * Źródło: @supabase/supabase-js
 */
export interface SupabaseAuthResponse {
  data: {
    user: {
      id: string;
      email: string;
      created_at: string;
    } | null;
    session: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
    } | null;
  };
  error: {
    message: string;
    status?: number;
  } | null;
}
```

### 5.3 Istniejące typy (do wykorzystania)

- Brak - autentykacja obsługiwana przez Supabase Auth, nie wymaga custom typów z `types.ts`

## 6. Zarządzanie stanem

### 6.1 Stan lokalny w SignupForm (React useState)

**Stan formularza:**
```typescript
const [formState, setFormState] = useState<SignupFormState>({
  email: "",
  password: "",
  confirmPassword: "",
  showPassword: false,
  showConfirmPassword: false,
});
```

**Stan błędów:**
```typescript
const [errors, setErrors] = useState<SignupFormErrors>({
  email: null,
  password: null,
  confirmPassword: null,
  form: null,
});
```

**Stan submitu:**
```typescript
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
```

### 6.2 Custom hook (opcjonalnie)

Logikę formularza można wyodrębnić do custom hooka dla lepszej reużywalności:

**Hook:** `useSignupForm` (w `src/components/hooks/useSignupForm.ts`)

**Zwracane wartości:**
```typescript
interface UseSignupFormReturn {
  formState: SignupFormState;
  errors: SignupFormErrors;
  isSubmitting: boolean;
  isFormValid: boolean;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}
```

**Logika hooka:**
- Zarządzanie stanem formularza
- Walidacja w czasie rzeczywistym
- Wywołanie Supabase Auth API
- Obsługa błędów
- Przekierowanie po sukcesie

### 6.3 Nie ma potrzeby na globalny stan

- Formularz nie współdzieli stanu z innymi komponentami
- Sesja użytkownika zarządzana przez Supabase Auth (cookie/localStorage)
- Brak potrzeby na Context API, Redux, Zustand

## 7. Integracja API

### 7.1 Endpoint

**Endpoint:** Supabase Auth API  
**Metoda:** `POST`  
**Path:** `/auth/v1/signup` (automatycznie przez `supabase.auth.signUp()`)

### 7.2 Request

**Typ:** `SignupCredentials`

```typescript
interface SignupCredentials {
  email: string;
  password: string;
}
```

**Przykład:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 7.3 Response (sukces)

**Status:** `200 OK`

**Typ:** `SupabaseAuthResponse` (data.user i data.session nie są null)

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "created_at": "2026-02-01T12:00:00Z"
  }
}
```

### 7.4 Response (błąd)

**Status:** `400 Bad Request` lub `422 Unprocessable Entity`

**Typ:** `SupabaseAuthResponse` (error nie jest null)

**Przykłady błędów:**

1. **Email już istnieje:**
```json
{
  "error": {
    "message": "User already registered",
    "status": 422
  }
}
```

2. **Nieprawidłowy email:**
```json
{
  "error": {
    "message": "Invalid email format",
    "status": 400
  }
}
```

3. **Słabe hasło:**
```json
{
  "error": {
    "message": "Password should be at least 8 characters",
    "status": 400
  }
}
```

### 7.5 Implementacja wywołania API

```typescript
import { supabaseClient } from "@/db/supabase.client";

async function handleSignup(credentials: SignupCredentials): Promise<void> {
  try {
    setIsSubmitting(true);
    setErrors({ ...errors, form: null });

    const { data, error } = await supabaseClient.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      // Obsługa błędów z API
      if (error.message.includes("already registered")) {
        setErrors({ ...errors, form: "Ten email jest już zarejestrowany. Zaloguj się." });
      } else if (error.message.includes("Invalid email")) {
        setErrors({ ...errors, email: "Wprowadź poprawny adres email" });
      } else if (error.message.includes("Password")) {
        setErrors({ ...errors, password: "Hasło musi mieć minimum 8 znaków" });
      } else {
        setErrors({ ...errors, form: "Wystąpił błąd. Spróbuj ponownie." });
      }
      return;
    }

    if (data.user && data.session) {
      // Sukces - użytkownik zalogowany automatycznie
      // Przekierowanie na dashboard
      window.location.href = "/";
    }
  } catch (err) {
    console.error("Signup error:", err);
    setErrors({ ...errors, form: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." });
  } finally {
    setIsSubmitting(false);
  }
}
```

### 7.6 Auto-login i przekierowanie

Po pomyślnej rejestracji:
1. Supabase automatycznie tworzy sesję (`data.session`)
2. Session token zapisywany w localStorage/cookie
3. Middleware wykrywa sesję przy następnym request
4. Użytkownik przekierowany na `/` (dashboard)

## 8. Interakcje użytkownika

### 8.1 Wypełnianie formularza

**Scenariusz:** Użytkownik wpisuje dane w formularzu

**Kroki:**
1. Użytkownik otwiera `/signup`
2. Focus automatycznie na polu email (autofocus)
3. Użytkownik wpisuje email → walidacja onChange (format)
4. Użytkownik wpisuje hasło → walidacja onChange (długość), pokazuje się wskaźnik siły
5. Użytkownik wpisuje potwierdzenie hasła → walidacja onChange (zgodność z hasłem)
6. Każde pole pokazuje błędy walidacji w czasie rzeczywistym pod inputem

**Obsługa:**
- `onChange` handlers z debounce (opcjonalnie, 300ms)
- Aktualizacja stanu formularza
- Uruchomienie walidacji
- Wyświetlenie błędów

### 8.2 Toggle widoczności hasła

**Scenariusz:** Użytkownik chce zobaczyć wpisane hasło

**Kroki:**
1. Użytkownik klika ikonę oka obok pola hasła
2. Typ pola zmienia się z `password` na `text`
3. Ikona oka zmienia się (np. z "eye" na "eye-off")
4. Ponowne kliknięcie przywraca typ `password`

**Obsługa:**
```typescript
const togglePasswordVisibility = () => {
  setFormState({ ...formState, showPassword: !formState.showPassword });
};
```

### 8.3 Submit formularza

**Scenariusz:** Użytkownik wypełnił formularz i klika "Utwórz konto"

**Kroki:**
1. Użytkownik klika przycisk "Utwórz konto" lub naciska Enter
2. Jeśli formularz nieprawidłowy → przycisk disabled, nic się nie dzieje
3. Jeśli formularz prawidłowy:
   - Przycisk pokazuje "Rejestrowanie..." i jest disabled
   - Wywołanie `supabase.auth.signUp()`
   - Czekanie na odpowiedź
4. **Sukces:**
   - Sesja utworzona automatycznie
   - Przekierowanie na `/` (dashboard)
5. **Błąd:**
   - Wyświetlenie komunikatu błędu nad formularzem lub przy odpowiednim polu
   - Przycisk wraca do stanu aktywnego

**Obsługa:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Finalna walidacja
  if (!isFormValid) return;
  
  await handleSignup({
    email: formState.email,
    password: formState.password,
  });
};
```

### 8.4 Nawigacja do logowania

**Scenariusz:** Użytkownik już ma konto i chce się zalogować

**Kroki:**
1. Użytkownik klika link "Zaloguj się" pod formularzem
2. Przekierowanie na `/login`

**Obsługa:**
```tsx
<a href="/login" className="text-primary hover:underline">
  Zaloguj się
</a>
```

### 8.5 Keyboard navigation

**Tab order:**
1. Pole email
2. Pole hasło
3. Ikona toggle hasła
4. Pole potwierdź hasło
5. Ikona toggle potwierdź hasło
6. Przycisk "Utwórz konto"
7. Link "Zaloguj się"

**Enter:**
- W dowolnym polu input → submit formularza (jeśli valid)

**Escape:**
- Zamknięcie komunikatów błędów (opcjonalnie)

## 9. Warunki i walidacja

### 9.1 Walidacja email

**Komponent:** SignupForm  
**Trigger:** onChange, onBlur

**Warunki:**
- Niepuste pole
- Format: `[local]@[domain].[tld]`
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (podstawowy) lub validator.js

**Komunikaty błędów:**
- Puste: "Email jest wymagany"
- Nieprawidłowy format: "Wprowadź poprawny adres email"

**Wpływ na UI:**
- Jeśli błąd: czerwony border, tekst błędu pod polem, `aria-invalid="true"`
- Jeśli OK: domyślny border, brak tekstu błędu

**Implementacja:**
```typescript
const validateEmail = (email: string): string | null => {
  if (!email) return "Email jest wymagany";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Wprowadź poprawny adres email";
  }
  
  return null;
};

const handleEmailChange = (value: string) => {
  setFormState({ ...formState, email: value });
  setErrors({ ...errors, email: validateEmail(value) });
};
```

### 9.2 Walidacja hasła

**Komponent:** SignupForm  
**Trigger:** onChange

**Warunki:**
- Minimalna długość: 8 znaków
- Niepuste pole

**Komunikaty błędów:**
- Puste: "Hasło jest wymagane"
- Za krótkie: "Hasło musi mieć minimum 8 znaków"

**Wpływ na UI:**
- Jeśli błąd: czerwony border, tekst błędu pod polem
- Jeśli OK: domyślny border, wskaźnik siły hasła

**Implementacja:**
```typescript
const validatePassword = (password: string): string | null => {
  if (!password) return "Hasło jest wymagane";
  
  if (password.length < 8) {
    return "Hasło musi mieć minimum 8 znaków";
  }
  
  return null;
};

const handlePasswordChange = (value: string) => {
  setFormState({ ...formState, password: value });
  setErrors({ ...errors, password: validatePassword(value) });
  
  // Rewalidacja potwierdzenia hasła jeśli już wypełnione
  if (formState.confirmPassword) {
    setErrors({
      ...errors,
      password: validatePassword(value),
      confirmPassword: validateConfirmPassword(formState.confirmPassword, value),
    });
  }
};
```

### 9.3 Walidacja potwierdzenia hasła

**Komponent:** SignupForm  
**Trigger:** onChange

**Warunki:**
- Musi być identyczne z hasłem głównym
- Niepuste pole

**Komunikaty błędów:**
- Puste: "Potwierdź hasło"
- Niezgodne: "Hasła muszą być identyczne"

**Wpływ na UI:**
- Jeśli błąd: czerwony border, tekst błędu pod polem
- Jeśli OK: domyślny border, brak tekstu błędu

**Implementacja:**
```typescript
const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
  if (!confirmPassword) return "Potwierdź hasło";
  
  if (confirmPassword !== password) {
    return "Hasła muszą być identyczne";
  }
  
  return null;
};

const handleConfirmPasswordChange = (value: string) => {
  setFormState({ ...formState, confirmPassword: value });
  setErrors({
    ...errors,
    confirmPassword: validateConfirmPassword(value, formState.password),
  });
};
```

### 9.4 Walidacja formularza (submit)

**Komponent:** SignupForm  
**Trigger:** onSubmit

**Warunki:**
- Wszystkie pola wypełnione
- Wszystkie pola bez błędów walidacji
- `isFormValid === true`

**Implementacja:**
```typescript
const isFormValid = useMemo(() => {
  return (
    formState.email !== "" &&
    formState.password !== "" &&
    formState.confirmPassword !== "" &&
    errors.email === null &&
    errors.password === null &&
    errors.confirmPassword === null
  );
}, [formState, errors]);
```

**Wpływ na UI:**
- Jeśli nieprawidłowy: przycisk disabled, szary kolor
- Jeśli prawidłowy: przycisk aktywny, domyślny kolor

### 9.5 Walidacja na poziomie API (backend)

**Backend:** Supabase Auth

**Dodatkowe warunki:**
- Email nie może już istnieć w bazie
- Hasło musi spełniać politykę bezpieczeństwa Supabase

**Obsługa błędów:**
- Email już istnieje: `errors.form = "Ten email jest już zarejestrowany. Zaloguj się."`
- Słabe hasło: `errors.password = "Hasło musi mieć minimum 8 znaków"`
- Inny błąd: `errors.form = "Wystąpił błąd. Spróbuj ponownie."`

## 10. Obsługa błędów

### 10.1 Błędy walidacji (client-side)

**Typ:** Błędy użytkownika (nieprawidłowe dane)

**Scenariusze:**
1. Email w złym formacie
2. Hasło za krótkie (< 8 znaków)
3. Hasła niezgodne

**Obsługa:**
- Walidacja w czasie rzeczywistym (onChange)
- Komunikaty błędów pod polami input
- Czerwony border na nieprawidłowych polach
- `aria-invalid="true"` dla screen readerów
- Disable przycisku submit gdy formularz nieprawidłowy

**Priorytet:** Wysoki (kluczowe dla UX)

### 10.2 Błędy API (backend)

**Typ:** Błędy biznesowe lub serwera

**Scenariusze:**
1. **Email już zarejestrowany (422):**
   - Komunikat: "Ten email jest już zarejestrowany. Zaloguj się."
   - Wyświetlenie: Alert nad formularzem + link do `/login`

2. **Nieprawidłowy email (400):**
   - Komunikat: "Wprowadź poprawny adres email"
   - Wyświetlenie: Przy polu email

3. **Słabe hasło (400):**
   - Komunikat: "Hasło musi mieć minimum 8 znaków"
   - Wyświetlenie: Przy polu hasło

4. **Błąd serwera (500):**
   - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
   - Wyświetlenie: Alert nad formularzem

5. **Timeout (network error):**
   - Komunikat: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie."
   - Wyświetlenie: Alert nad formularzem

**Obsługa:**
```typescript
if (error) {
  if (error.message.includes("already registered")) {
    setErrors({ ...errors, form: "Ten email jest już zarejestrowany. Zaloguj się." });
  } else if (error.message.includes("Invalid email")) {
    setErrors({ ...errors, email: "Wprowadź poprawny adres email" });
  } else if (error.message.includes("Password")) {
    setErrors({ ...errors, password: "Hasło musi mieć minimum 8 znaków" });
  } else {
    setErrors({ ...errors, form: "Wystąpił błąd. Spróbuj ponownie." });
  }
}
```

**Priorytet:** Krytyczny (blokuje rejestrację)

### 10.3 Błędy sieciowe

**Typ:** Błędy infrastruktury

**Scenariusze:**
1. Brak internetu
2. Timeout API
3. CORS error (development)

**Obsługa:**
```typescript
try {
  // API call
} catch (err) {
  console.error("Signup error:", err);
  setErrors({
    ...errors,
    form: "Wystąpił nieoczekiwany błąd. Sprawdź połączenie i spróbuj ponownie.",
  });
}
```

**Priorytet:** Wysoki (rzadkie, ale blokujące)

### 10.4 Edge cases

**1. Użytkownik już zalogowany:**
- Middleware przekierowuje na `/`
- Brak możliwości dostępu do `/signup`

**2. Użytkownik klika submit wiele razy:**
- Przycisk disabled podczas `isSubmitting`
- Zapobiega wielokrotnym wywołaniom API

**3. Użytkownik wraca do formularza (browser back):**
- Stan formularza resetowany (brak persistencji)
- Możliwość rozpoczęcia od nowa

**4. Email confirmation (opcjonalnie):**
- Jeśli włączone w Supabase: użytkownik musi potwierdzić email
- Komunikat: "Sprawdź email i potwierdź konto."
- W MVP: wyłączone (autoconfirm)

## 11. Kroki implementacji

### Faza 1: Setup i komponenty UI podstawowe (30 min)

1. **Utworzenie komponentów Shadcn/ui:**
   ```bash
   # W terminalu
   npx shadcn@latest add input
   npx shadcn@latest add label
   npx shadcn@latest add alert
   ```
   - Dodaje komponenty: `Input`, `Label`, `Alert` do `src/components/ui/`
   - Weryfikacja: komponenty powinny być dostępne w `src/components/ui/`

2. **Utworzenie AuthLayout:**
   - Plik: `src/layouts/AuthLayout.astro`
   - Kod:
     ```astro
     ---
     import Layout from "./Layout.astro";
     
     interface Props {
       title: string;
     }
     
     const { title } = Astro.props;
     ---
     
     <Layout title={title}>
       <div class="min-h-screen flex items-center justify-center bg-background p-4">
         <div class="w-full max-w-md">
           <div class="text-center mb-8">
             <h1 class="text-2xl font-bold text-foreground">AI Flashcards</h1>
             <p class="text-sm text-muted-foreground mt-2">Ucz się efektywnie z fiszkami AI</p>
           </div>
           <slot />
         </div>
       </div>
     </Layout>
     ```
   - Weryfikacja: Layout renderuje się poprawnie

### Faza 2: Typy i interfaces (15 min)

3. **Dodanie typów do types.ts:**
   - Plik: `src/types.ts`
   - Dodaj na końcu pliku:
     ```typescript
     // ============================================================================
     // Auth DTOs
     // ============================================================================
     
     /**
      * Stan formularza rejestracji
      */
     export interface SignupFormState {
       email: string;
       password: string;
       confirmPassword: string;
       showPassword: boolean;
       showConfirmPassword: boolean;
     }
     
     /**
      * Błędy walidacji formularza rejestracji
      */
     export interface SignupFormErrors {
       email: string | null;
       password: string | null;
       confirmPassword: string | null;
       form: string | null;
     }
     
     /**
      * Dane rejestracji wysyłane do Supabase Auth
      */
     export interface SignupCredentials {
       email: string;
       password: string;
     }
     
     /**
      * Siła hasła (0-4)
      */
     export type PasswordStrength = 0 | 1 | 2 | 3 | 4;
     
     /**
      * Props dla PasswordStrengthIndicator
      */
     export interface PasswordStrengthIndicatorProps {
       password: string;
     }
     ```
   - Weryfikacja: TypeScript kompiluje się bez błędów

### Faza 3: Komponent SignupForm - struktura (45 min)

4. **Utworzenie SignupForm:**
   - Plik: `src/components/SignupForm.tsx`
   - Struktura podstawowa:
     ```tsx
     import { useState, useMemo } from "react";
     import { Button } from "@/components/ui/button";
     import { Input } from "@/components/ui/input";
     import { Label } from "@/components/ui/label";
     import { Alert } from "@/components/ui/alert";
     import { supabaseClient } from "@/db/supabase.client";
     import type { SignupFormState, SignupFormErrors, SignupCredentials } from "@/types";
     
     export default function SignupForm() {
       // State management (Faza 4)
       
       // Validation functions (Faza 5)
       
       // Event handlers (Faza 5)
       
       // Submit handler (Faza 6)
       
       // JSX (Faza 4)
       return (
         <form onSubmit={handleSubmit} className="space-y-6">
           {/* Nagłówek */}
           {/* Globalny błąd */}
           {/* Pole Email */}
           {/* Pole Hasło */}
           {/* Pole Potwierdź hasło */}
           {/* Przycisk Submit */}
           {/* Link do logowania */}
         </form>
       );
     }
     ```

5. **Dodanie stanu (useState):**
   ```tsx
   const [formState, setFormState] = useState<SignupFormState>({
     email: "",
     password: "",
     confirmPassword: "",
     showPassword: false,
     showConfirmPassword: false,
   });
   
   const [errors, setErrors] = useState<SignupFormErrors>({
     email: null,
     password: null,
     confirmPassword: null,
     form: null,
   });
   
   const [isSubmitting, setIsSubmitting] = useState(false);
   ```

6. **Dodanie JSX formularza:**
   - Zaimplementuj pełną strukturę HTML z sekcji 4.3
   - Użyj komponentów `Input`, `Label`, `Button`, `Alert`
   - Dodaj ikony oka (np. lucide-react: `Eye`, `EyeOff`)
   - Weryfikacja: Formularz renderuje się poprawnie

### Faza 4: Walidacja (45 min)

7. **Dodanie funkcji walidacji:**
   ```tsx
   const validateEmail = (email: string): string | null => {
     if (!email) return "Email jest wymagany";
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email)) return "Wprowadź poprawny adres email";
     return null;
   };
   
   const validatePassword = (password: string): string | null => {
     if (!password) return "Hasło jest wymagane";
     if (password.length < 8) return "Hasło musi mieć minimum 8 znaków";
     return null;
   };
   
   const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
     if (!confirmPassword) return "Potwierdź hasło";
     if (confirmPassword !== password) return "Hasła muszą być identyczne";
     return null;
   };
   ```

8. **Dodanie event handlers:**
   ```tsx
   const handleEmailChange = (value: string) => {
     setFormState({ ...formState, email: value });
     setErrors({ ...errors, email: validateEmail(value) });
   };
   
   const handlePasswordChange = (value: string) => {
     setFormState({ ...formState, password: value });
     const passwordError = validatePassword(value);
     const confirmError = formState.confirmPassword
       ? validateConfirmPassword(formState.confirmPassword, value)
       : null;
     setErrors({ ...errors, password: passwordError, confirmPassword: confirmError });
   };
   
   const handleConfirmPasswordChange = (value: string) => {
     setFormState({ ...formState, confirmPassword: value });
     setErrors({
       ...errors,
       confirmPassword: validateConfirmPassword(value, formState.password),
     });
   };
   
   const togglePasswordVisibility = () => {
     setFormState({ ...formState, showPassword: !formState.showPassword });
   };
   
   const toggleConfirmPasswordVisibility = () => {
     setFormState({ ...formState, showConfirmPassword: !formState.showConfirmPassword });
   };
   ```

9. **Dodanie computed value dla validacji formularza:**
   ```tsx
   const isFormValid = useMemo(() => {
     return (
       formState.email !== "" &&
       formState.password !== "" &&
       formState.confirmPassword !== "" &&
       errors.email === null &&
       errors.password === null &&
       errors.confirmPassword === null
     );
   }, [formState, errors]);
   ```

10. **Podpięcie handlers do JSX:**
    - `onChange` dla wszystkich inputów
    - `onClick` dla toggle visibility
    - Weryfikacja: Walidacja działa w czasie rzeczywistym

### Faza 5: Integracja API (30 min)

11. **Dodanie handleSubmit:**
    ```tsx
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!isFormValid || isSubmitting) return;
      
      try {
        setIsSubmitting(true);
        setErrors({ ...errors, form: null });
        
        const { data, error } = await supabaseClient.auth.signUp({
          email: formState.email,
          password: formState.password,
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            setErrors({ ...errors, form: "Ten email jest już zarejestrowany. Zaloguj się." });
          } else if (error.message.includes("Invalid email")) {
            setErrors({ ...errors, email: "Wprowadź poprawny adres email" });
          } else if (error.message.includes("Password")) {
            setErrors({ ...errors, password: "Hasło musi mieć minimum 8 znaków" });
          } else {
            setErrors({ ...errors, form: "Wystąpił błąd. Spróbuj ponownie." });
          }
          return;
        }
        
        if (data.user && data.session) {
          // Sukces - przekierowanie
          window.location.href = "/";
        }
      } catch (err) {
        console.error("Signup error:", err);
        setErrors({ ...errors, form: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." });
      } finally {
        setIsSubmitting(false);
      }
    };
    ```

12. **Weryfikacja integracji:**
    - Test z prawidłowymi danymi → sukces, przekierowanie
    - Test z istniejącym emailem → błąd "już zarejestrowany"
    - Test z nieprawidłowym emailem → błąd walidacji
    - Test z krótkim hasłem → błąd walidacji

### Faza 6: Strona signup.astro (15 min)

13. **Utworzenie strony signup:**
    - Plik: `src/pages/signup.astro`
    - Kod:
      ```astro
      ---
      import AuthLayout from "@/layouts/AuthLayout.astro";
      import SignupForm from "@/components/SignupForm";
      
      // Sprawdzenie czy użytkownik już zalogowany (opcjonalnie - middleware)
      const user = Astro.locals.user;
      if (user) {
        return Astro.redirect("/");
      }
      ---
      
      <AuthLayout title="Rejestracja - AI Flashcards">
        <div class="bg-card rounded-lg border border-border shadow-sm p-6">
          <SignupForm client:load />
        </div>
      </AuthLayout>
      ```

14. **Weryfikacja routingu:**
    - Otwarcie `/signup` → formularz renderuje się
    - Zalogowany użytkownik → przekierowanie na `/`

### Faza 7: PasswordStrengthIndicator (opcjonalnie, 30 min)

15. **Utworzenie PasswordStrengthIndicator:**
    - Plik: `src/components/PasswordStrengthIndicator.tsx`
    - Kod:
      ```tsx
      import { useMemo } from "react";
      import { cn } from "@/lib/utils";
      import type { PasswordStrength, PasswordStrengthIndicatorProps } from "@/types";
      
      export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
        const strength = useMemo((): PasswordStrength => {
          if (password.length === 0) return 0;
          if (password.length < 8) return 0;
          
          let score: PasswordStrength = 1;
          
          const hasLower = /[a-z]/.test(password);
          const hasUpper = /[A-Z]/.test(password);
          const hasNumber = /\d/.test(password);
          const hasSpecial = /[^a-zA-Z0-9]/.test(password);
          
          if (hasLower && hasNumber) score = 2;
          if (hasLower && hasUpper && hasNumber && hasSpecial) score = 3;
          if (password.length >= 12 && hasLower && hasUpper && hasNumber && hasSpecial) score = 4;
          
          return score;
        }, [password]);
        
        const strengthConfig = {
          0: { text: "Bardzo słabe", color: "bg-destructive" },
          1: { text: "Słabe", color: "bg-destructive" },
          2: { text: "Średnie", color: "bg-warning" },
          3: { text: "Silne", color: "bg-success" },
          4: { text: "Bardzo silne", color: "bg-success" },
        };
        
        const config = strengthConfig[strength];
        
        return (
          <div className="mt-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded transition-colors",
                    index < strength ? config.color : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Siła hasła: {config.text}
            </p>
          </div>
        );
      }
      ```

16. **Dodanie do SignupForm:**
    - Import: `import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";`
    - Użycie: Pod polem hasło, tylko gdy `password !== ""`
    - Weryfikacja: Wskaźnik zmienia się w czasie rzeczywistym

### Faza 8: Middleware (opcjonalnie, 15 min)

17. **Dodanie sprawdzenia sesji w middleware:**
    - Plik: `src/middleware/index.ts`
    - Dodaj logikę przekierowania zalogowanych z `/signup` na `/`
    - Kod:
      ```typescript
      // W istniejącym middleware
      if (url.pathname === "/signup") {
        const user = locals.user;
        if (user) {
          return Response.redirect(new URL("/", url));
        }
      }
      ```
    - Weryfikacja: Zalogowani nie mogą otworzyć `/signup`

### Faza 9: Testy manualne (30 min)

18. **Testy funkcjonalne:**
    - [ ] Formularz renderuje się poprawnie
    - [ ] Autofocus na polu email działa
    - [ ] Walidacja email w czasie rzeczywistym
    - [ ] Walidacja hasła w czasie rzeczywistym
    - [ ] Walidacja potwierdzenia hasła
    - [ ] Toggle widoczności hasła działa
    - [ ] Przycisk disabled gdy formularz nieprawidłowy
    - [ ] Submit z prawidłowymi danymi → sukces, przekierowanie
    - [ ] Submit z istniejącym emailem → komunikat błędu
    - [ ] Submit z nieprawidłowym emailem → komunikat błędu
    - [ ] Submit z krótkim hasłem → komunikat błędu
    - [ ] Submit z niezgodnymi hasłami → komunikat błędu
    - [ ] Błędy wyświetlają się przy odpowiednich polach
    - [ ] Wskaźnik siły hasła działa (jeśli zaimplementowany)
    - [ ] Link do `/login` działa
    - [ ] Tab order prawidłowy
    - [ ] Enter submituje formularz
    - [ ] Screen reader accessibility (aria-labels, aria-invalid)

19. **Testy edge cases:**
    - [ ] Zalogowany użytkownik nie może otworzyć `/signup`
    - [ ] Wielokrotne kliknięcie submit → tylko jedno wywołanie API
    - [ ] Browser back po rejestracji → formularz zresetowany
    - [ ] Błąd sieci → komunikat błędu

### Faza 10: Polish i optymalizacje (15 min)

20. **Optymalizacje:**
    - Debounce na walidacji email (opcjonalnie)
    - Loading state animation (spinner w przycisku)
    - Transition animations (fade-in błędów)
    - Focus management (focus na pierwszym błędzie po submit)

21. **Accessibility audit:**
    - [ ] Wszystkie pola mają `<label>`
    - [ ] Komunikaty błędów mają `id` i `aria-describedby`
    - [ ] Nieprawidłowe pola mają `aria-invalid="true"`
    - [ ] Przycisk toggle hasła ma `aria-label`
    - [ ] Alert ma `role="alert"`
    - [ ] Color contrast zgodny z WCAG AA

22. **Code review:**
    - [ ] Kod zgodny z PRD
    - [ ] Typy poprawnie zdefiniowane
    - [ ] Brak console.log w production
    - [ ] Error handling kompletny
    - [ ] Komentarze JSDoc gdzie potrzebne

### Faza 11: Dokumentacja (10 min)

23. **Aktualizacja dokumentacji:**
    - Dodaj opis komponentu `SignupForm` do README (jeśli istnieje)
    - Dodaj przykłady użycia
    - Zdokumentuj propsy i typy

24. **Commit i push:**
    ```bash
    git add .
    git commit -m "feat: implement signup view with validation and Supabase Auth integration"
    git push origin feature/signup-view
    ```

---

## Podsumowanie

Ten plan implementacji obejmuje pełny proces tworzenia widoku rejestracji, od podstawowych komponentów UI po zaawansowaną walidację i integrację z Supabase Auth. Implementacja powinna zająć około 4-5 godzin pracy programisty frontendowego.

**Kluczowe punkty do zapamiętania:**
- Walidacja w czasie rzeczywistym dla lepszego UX
- Obsługa wszystkich edge cases i błędów API
- Accessibility (WCAG) jako priorytet
- Automatyczne logowanie po rejestracji
- Czysty, testowalny kod zgodny z best practices React i Astro
