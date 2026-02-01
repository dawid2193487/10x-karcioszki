# Architektura UI dla AI Flashcards

## 1. Przegląd struktury UI

### 1.1 Główne założenia architektoniczne

AI Flashcards to progresywna aplikacja webowa (PWA) zbudowana w oparciu o Astro 5 z integracją React 19 dla komponentów dynamicznych. Architektura UI została zaprojektowana z naciskiem na:

- **Minimalną złożoność**: Brak zaawansowanych bibliotek do zarządzania stanem (Zustand/Redux) - wykorzystanie natywnych mechanizmów Astro SSR i React Context
- **Keyboard-first UX**: Pełna obsługa skrótów klawiszowych dla wszystkich kluczowych interakcji
- **Progresywne wczytywanie**: Astro SSR dla szybkiego pierwszego ładowania, React tylko dla interaktywnych komponentów
- **Accessibility-first**: Semantyczny HTML, ARIA labels, zarządzanie focusem, screen reader support
- **Mobile-first responsive design**: Tailwind 4 z podejściem mobile-first

### 1.2 Stack technologiczny UI

- **Framework**: Astro 5 (SSR + Static)
- **Interaktywność**: React 19 (functional components, hooks)
- **Styling**: Tailwind 4 + Shadcn/ui
- **Routing**: Astro file-based routing z View Transitions API
- **Autentykacja**: Supabase Auth (middleware)
- **State management**: Astro SSR state + React Context (minimal)
- **Forms**: Natywne formularze HTML z progressive enhancement

### 1.3 Struktura katalogów

```
src/
├── components/
│   ├── auth/              # Komponenty autentykacji
│   ├── decks/             # Komponenty zarządzania taliami
│   ├── flashcards/        # Komponenty fiszek
│   ├── study/             # Komponenty sesji nauki
│   ├── ai/                # Komponenty generowania AI
│   ├── navigation/        # Nawigacja i layout
│   ├── common/            # Komponenty współdzielone
│   └── ui/                # Shadcn/ui primitives
├── layouts/
│   ├── Layout.astro       # Główny layout (authenticated)
│   ├── AuthLayout.astro   # Layout dla stron logowania
│   └── StudyLayout.astro  # Layout dla sesji nauki (minimal)
├── pages/
│   ├── index.astro        # Dashboard (lista talii)
│   ├── login.astro        # Strona logowania
│   ├── signup.astro       # Strona rejestracji
│   ├── decks/
│   │   └── [id].astro     # Widok talii z fiszkami
│   ├── study/
│   │   └── [sessionId].astro  # Sesja nauki
│   ├── generate/
│   │   ├── index.astro    # Formularz generowania AI
│   │   └── review.astro   # Recenzja wygenerowanych fiszek
│   └── api/               # API endpoints (backend)
└── lib/
    └── contexts/          # React contexts dla state
```

---

## 2. Lista widoków

### 2.1 Strona logowania (`/login`)

**Cel główny**: Umożliwienie zalogowania się istniejącemu użytkownikowi

**Kluczowe informacje**:
- Formularz email + hasło
- Link do strony rejestracji
- Komunikaty błędów walidacji i autentykacji

**Kluczowe komponenty**:
- `LoginForm.tsx` (React) - interaktywny formularz
- `AuthLayout.astro` - prosty layout bez nawigacji
- `Button`, `Input` (Shadcn/ui)

**Integracja API**:
- `POST /auth/v1/token?grant_type=password` (Supabase)
- Po sukcesie: przekierowanie na `/` (dashboard)

**Walidacja**:
- Email: format RFC 5322 (frontend + backend)
- Hasło: wymagane (bez walidacji formatu na logowaniu)
- Błędy: generyczne "Invalid credentials" (bezpieczeństwo)

**UX & Accessibility**:
- Autofocus na polu email przy załadowaniu strony
- Enter submituje formularz
- Komunikaty błędów powiązane z polami (aria-describedby)
- Loading state na przycisku podczas oczekiwania na response
- Tab order: Email → Hasło → Submit → Link do rejestracji

**Security**:
- CSRF protection przez Supabase
- Generyczne komunikaty błędów (nie ujawniaj czy email istnieje)
- Rate limiting na poziomie Supabase Auth

**Edge cases**:
- Brak połączenia sieciowego: "Problem z połączeniem. Spróbuj ponownie."
- Timeout: "Logowanie trwa zbyt długo. Spróbuj ponownie."
- Błąd 500: "Coś poszło nie tak. Spróbuj ponownie za chwilę."

---

### 2.2 Strona rejestracji (`/signup`)

**Cel główny**: Umożliwienie utworzenia nowego konta użytkownika

**Kluczowe informacje**:
- Formularz email + hasło + potwierdzenie hasła
- Link do strony logowania
- Wymagania dotyczące hasła
- Komunikaty błędów walidacji

**Kluczowe komponenty**:
- `SignupForm.tsx` (React) - interaktywny formularz z walidacją
- `AuthLayout.astro`
- `Button`, `Input` (Shadcn/ui)
- `PasswordStrengthIndicator.tsx` (opcjonalnie)

**Integracja API**:
- `POST /auth/v1/signup` (Supabase)
- Po sukcesie: auto-login + przekierowanie na `/`

**Walidacja**:
- Email: format RFC 5322, sprawdzenie czy nie istnieje (backend)
- Hasło: min 8 znaków
- Potwierdzenie hasła: musi być identyczne z hasłem
- Real-time validation feedback

**UX & Accessibility**:
- Autofocus na polu email
- Password visibility toggle (ikona oka)
- Real-time feedback przy wpisywaniu hasła (siła hasła)
- Enter submituje formularz
- Tab order: Email → Hasło → Potwierdź hasło → Submit → Link do logowania
- aria-live dla komunikatów walidacji

**Security**:
- Hasło szyfrowane przez Supabase (bcrypt)
- Email confirmation (opcjonalnie - można wyłączyć w MVP)
- Rate limiting na poziomie Supabase Auth

**Edge cases**:
- Email już istnieje: "Ten email jest już zarejestrowany. Zaloguj się."
- Słabe hasło: "Hasło musi mieć min 8 znaków"
- Niezgodne hasła: "Hasła muszą być identyczne"

---

### 2.3 Dashboard - Lista talii (`/`)

**Cel główny**: Centralny punkt nawigacji - przegląd wszystkich talii użytkownika z możliwością szybkiego rozpoczęcia nauki

**Kluczowe informacje**:
- Lista wszystkich talii użytkownika (SSR z Astro)
- Dla każdej talii: nazwa, liczba fiszek, liczba fiszek do powtórki
- Akcje globalne: Utwórz talię, Generuj z AI

**Kluczowe komponenty**:
- `DashboardLayout.astro` - główny layout z nawigacją
- `DeckGrid.astro` - responsywny grid talii
- `DeckCard.tsx` (React) - pojedyncza karta talii z inline editing
- `CreateDeckButton.tsx` (React)
- `EmptyState.astro` - stan pusty dla nowych użytkowników
- `Navigation.astro` - top nav z logo, user menu, "?" help

**Integracja API**:
- `GET /api/decks` (SSR przy pierwszym załadowaniu)
- `POST /api/decks` (client-side dla tworzenia)
- `PATCH /api/decks/:id` (autosave dla edycji nazwy)
- `DELETE /api/decks/:id` (client-side dla usuwania)
- `GET /api/decks/:id/due` (dla licznika due cards)

**Layout - DeckCard**:
```
┌─────────────────────────────────────┐
│ [Nazwa talii - edytowalna]          │
│ 45 fiszek | 12 do powtórki          │
│                                      │
│ [Study 🎯] [Przeglądaj] [🗑️]        │
└─────────────────────────────────────┘
```

**Responsywność**:
- Mobile: 1 kolumna
- Tablet: 2 kolumny
- Desktop: 3 kolumny
- Grid gap: Tailwind `gap-4` lub `gap-6`

**Inline editing nazwy**:
- Kliknięcie na nazwę → textarea z autofocus
- Autosave po opuszczeniu pola (blur) lub Enter
- Debounce 500ms
- Visual indicator: spinner podczas zapisu, checkmark po sukcesie
- Esc anuluje edycję
- Border highlight podczas edycji

**Akcje na karcie**:
- **Study**: Rozpoczyna sesję nauki (tylko jeśli due_count > 0)
  - Jeśli due_count = 0: przycisk disabled z tooltipem "Brak fiszek do powtórki"
- **Przeglądaj**: Otwiera widok talii `/decks/:id`
- **Usuń**: Modal potwierdzenia z informacją o liczbie fiszek

**Delete confirmation modal**:
```
Czy na pewno chcę usunąć talię "[Nazwa]"?
Ta talia zawiera 45 fiszek. Wszystkie zostaną usunięte.

[Anuluj]  [Usuń]
```

**Empty State** (nowy użytkownik):
```
👋 Witaj w AI Flashcards!

Nie masz jeszcze żadnych talii. Zacznij od:

[➕ Utwórz pierwszą talię]  [🤖 Generuj fiszki z AI]
```

**UX & Accessibility**:
- Tab navigation przez karty talii
- Focus trap w modalach
- aria-label dla przycisków akcji (screen readers)
- Keyboard shortcuts: `N` = new deck (opcjonalnie)
- Loading skeletons podczas ładowania danych

**Security**:
- Middleware sprawdza autentykację przed załadowaniem strony
- RLS w Supabase zapewnia izolację danych między użytkownikami

**Edge cases**:
- Brak talii: Empty state z zachętą do utworzenia pierwszej
- Błąd ładowania: Toast "Nie udało się załadować talii. Odśwież stronę."
- Błąd usuwania: Toast "Nie udało się usunąć talii. Spróbuj ponownie."
- Błąd zapisu nazwy: Rollback do poprzedniej nazwy + toast

---

### 2.4 Widok talii - Lista fiszek (`/decks/:id`)

**Cel główny**: Przeglądanie i zarządzanie fiszkami w ramach konkretnej talii

**Kluczowe informacje**:
- Nazwa talii (edytowalna inline)
- Liczba fiszek w talii
- Lista fiszek z możliwością inline editing
- Paginacja dla dużych talii

**Kluczowe komponenty**:
- `DeckHeader.tsx` (React) - nagłówek z nazwą talii i akcjami
- `FlashcardTable.astro` - tabela/lista fiszek
- `FlashcardRow.tsx` (React) - pojedyncza fiszka z inline editing
- `CreateFlashcardForm.tsx` (React) - formularz dodawania fiszki
- `Pagination.tsx` (React) - standardowa paginacja
- `DeleteConfirmationDialog.tsx` (React)

**Integracja API**:
- `GET /api/decks/:id` (SSR - dane talii)
- `GET /api/flashcards?deck_id=:id&page=1&limit=20` (SSR/Client)
- `POST /api/flashcards` (tworzenie nowej fiszki)
- `PATCH /api/flashcards/:id` (autosave dla inline editing)
- `DELETE /api/flashcards/:id` (usuwanie fiszki)

**Layout - Header**:
```
┌──────────────────────────────────────────────────────┐
│ ← Wstecz                                    [? Help] │
│                                                       │
│ [Nazwa talii - edytowalna]                           │
│ 45 fiszek                                            │
│                                                       │
│ [➕ Dodaj fiszkę] [🤖 Generuj AI] [🎯 Rozpocznij naukę] │
└──────────────────────────────────────────────────────┘
```

**Layout - FlashcardTable** (desktop):
```
┌────────────────────────────────────────────────────────┐
│ Przód                  │ Tył                  │ Akcje  │
├────────────────────────┼──────────────────────┼────────┤
│ ¿Cómo estás?           │ How are you?         │ [🗑️]   │
│ ¿Qué hora es?          │ What time is it?     │ [🗑️]   │
│ ...                                                     │
└────────────────────────────────────────────────────────┘

Pokazuję 1-20 z 45 fiszek
[<] [1] [2] [3] [>]

Fiszek na stronę: [20 ▼] (opcje: 20, 50, 100)
```

**Layout - FlashcardCards** (mobile):
```
┌─────────────────────────────┐
│ Przód: ¿Cómo estás?         │
│ Tył: How are you?           │
│                    [🗑️]     │
└─────────────────────────────┘
```

**Inline editing fiszki**:
- Kliknięcie na tekst (front lub back) → textarea
- Autofocus + autoselect tekstu
- Autosave po blur lub Enter (debounce 500ms)
- Esc anuluje edycję
- Border highlight podczas edycji
- Visual feedback: spinner → checkmark
- Walidacja: min 1, max 1000 znaków

**Dodawanie nowej fiszki**:
- Przycisk "Dodaj fiszkę" otwiera inline form lub modal
- Pola: Front (textarea), Back (textarea)
- Submit: `POST /api/flashcards` z `source: 'manual'`
- Po utworzeniu: dodanie do listy (optimistic update)
- Enter w textarea nie submituje - Shift+Enter = nowa linia, Ctrl+Enter = submit

**Paginacja**:
- Query params: `?page=2&limit=20`
- Standardowe controls: Previous, 1, 2, 3, ..., Next
- Dropdown wyboru limitu: 20, 50, 100
- Informacja: "Pokazuję X-Y z Z fiszek"
- Scroll to top po zmianie strony

**UX & Accessibility**:
- Tab navigation przez fiszki
- Focus management przy inline editing
- aria-label dla przycisków delete
- Loading state podczas ładowania strony paginacji
- Optimistic updates z rollback na błąd

**Security**:
- Middleware sprawdza czy talia należy do użytkownika
- RLS w Supabase zapewnia izolację danych

**Edge cases**:
- Pusta talia: Empty state "Dodaj pierwszą fiszkę lub wygeneruj z AI"
- Błąd ładowania: Toast + retry button
- Błąd zapisu: Rollback + toast
- Usunięcie ostatniej fiszki na stronie: przekierowanie na poprzednią stronę
- Próba edycji dwóch fiszek jednocześnie: blur pierwszej (autosave) przed edycją drugiej

---

### 2.5 Formularz generowania AI (`/generate`)

**Cel główny**: Przyjęcie tekstu edukacyjnego od użytkownika i wygenerowanie propozycji fiszek przez AI

**Kluczowe informacje**:
- Textarea dla tekstu wejściowego (100-5000 znaków)
- Real-time licznik znaków
- Szacowana liczba fiszek (~1 na 250 znaków)
- Wybór talii docelowej (istniejąca lub nowa)

**Kluczowe komponenty**:
- `AIGenerateForm.tsx` (React) - główny formularz
- `CharacterCounter.tsx` (React) - licznik znaków
- `DeckSelector.tsx` (React) - dropdown z inline creation
- `EstimatedCount.tsx` (React) - wyświetlenie szacunku
- `LoadingSpinner.tsx` - podczas generowania

**Integracja API**:
- `POST /api/ai/generate` - generowanie fiszek
- `GET /api/decks` - lista talii dla dropdown (SSR)
- `POST /api/decks` - tworzenie nowej talii (inline)

**Layout**:
```
┌────────────────────────────────────────────────┐
│ ← Wstecz                                       │
│                                                 │
│ Generuj fiszki z AI                             │
│                                                 │
│ Wklej tekst edukacyjny:                         │
│ ┌────────────────────────────────────────────┐ │
│ │                                             │ │
│ │ [Textarea - min 100, max 5000 znaków]      │ │
│ │                                             │ │
│ │                                             │ │
│ └────────────────────────────────────────────┘ │
│ 1,234 / 5,000 znaków                           │
│ Szacowana liczba fiszek: ~5                     │
│                                                 │
│ Dodaj do talii:                                 │
│ [Wybierz talię... ▼]                            │
│   - Spanish Vocabulary                          │
│   - Biology 101                                 │
│   - + Utwórz nową talię                         │
│                                                 │
│ [Generuj fiszki] (disabled jeśli < 100 chars)   │
└────────────────────────────────────────────────┘
```

**Character counter**:
- Real-time update podczas wpisywania
- Zmiana koloru:
  - < 100 znaków: czerwony (błąd)
  - 100-5000: zielony (valid)
  - > 5000: czerwony (przekroczono limit)
- Format: "1,234 / 5,000 znaków"

**Estimated count**:
- Formuła: `Math.floor(textLength / 250)` lub `Math.max(1, Math.floor(textLength / 250))`
- Format: "Szacowana liczba fiszek: ~5"
- Update real-time

**Deck selector**:
- Dropdown z listą istniejących talii
- Opcja "+ Utwórz nową talię" na końcu listy
- Po wybraniu opcji "Utwórz nową":
  - Dropdown się rozwija → input field
  - Enter tworzy talię (`POST /api/decks`)
  - Nowa talia jest auto-select
  - Dropdown zamyka się
- Default: ostatnio używana talia (local storage) lub pierwsza na liście

**Validation**:
- Text: min 100, max 5000 znaków (frontend + backend)
- Deck: wymagane (wybrana lub nowo utworzona)
- Submit disabled jeśli walidacja nie przechodzi

**Submit flow**:
1. Kliknięcie "Generuj fiszki"
2. Loading state (spinner + disabled button)
3. `POST /api/ai/generate` z tekstem
4. Po sukcesie: zapisz draft fiszek w React Context
5. Zapisz `generation_log_id` w context
6. Zapisz wybraną talię w context
7. Przekierowanie na `/generate/review`

**UX & Accessibility**:
- Autofocus na textarea
- Textarea autoresize (min 10 linii, max unlimited)
- Tab order: Textarea → Deck selector → Submit
- aria-live dla licznika znaków (screen readers)
- Keyboard shortcuts: Ctrl+Enter = submit (gdy valid)

**Security**:
- Walidacja po stronie backendu (100-5000 chars)
- Rate limiting: 10 requestów/minutę (backend)
- Sanityzacja tekstu przed wysłaniem do AI

**Edge cases**:
- Tekst < 100 znaków: Submit disabled + komunikat "Minimum 100 znaków"
- Tekst > 5000 znaków: Submit disabled + komunikat "Maksimum 5000 znaków"
- Rate limit exceeded (429): Toast "Zbyt wiele prób. Spróbuj za X sekund."
- AI timeout: Toast "Generowanie trwa zbyt długo. Spróbuj z krótszym tekstem."
- AI error (500): Toast "Nie udało się wygenerować fiszek. Spróbuj ponownie."
- Brak talii: Automatyczna opcja utworzenia pierwszej talii

---

### 2.6 Recenzja wygenerowanych fiszek (`/generate/review`)

**Cel główny**: Umożliwienie użytkownikowi przejrzenia, edycji, akceptacji lub odrzucenia wygenerowanych przez AI fiszek

**Kluczowe informacje**:
- Draft fiszek z React Context (nie persystowane w DB)
- Aktualna fiszka: front + back (oba widoczne)
- Licznik: aktualna / total
- Licznik: zaakceptowane / odrzucone
- Wybrana talia docelowa

**Kluczowe komponenty**:
- `AIReviewInterface.tsx` (React) - główny kontener
- `FlashcardReviewCard.tsx` (React) - pojedyncza fiszka do recenzji
- `ReviewActions.tsx` (React) - przyciski akcji
- `ReviewProgress.tsx` (React) - liczniki postępu
- `ReviewSummary.tsx` (React) - modal podsumowania
- `KeyboardShortcutsHelp.tsx` (React) - overlay pomocy

**State management**:
- React Context: `AIReviewContext`
  - `draftFlashcards: Array<{front: string, back: string}>`
  - `currentIndex: number`
  - `acceptedCount: number`
  - `rejectedCount: number`
  - `editedCards: Set<number>` (indeksy edytowanych)
  - `deckId: string` (wybrana talia)
  - `generationLogId: string` (z poprzedniego kroku)

**Integracja API**:
- `POST /api/flashcards` - zapisanie zaakceptowanej fiszki
- `POST /api/ai/review-actions` - logowanie akcji (accepted/edited/rejected)

**Layout - Card-by-card view**:
```
┌────────────────────────────────────────────────┐
│ ← Wstecz                       Fiszka 3 / 12   │
│ Zaakceptowane: 2 | Odrzucone: 1                │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │                                             │ │
│ │  Przód:                                     │ │
│ │  What is the Spanish verb 'estar' used for? │ │
│ │                                             │ │
│ │  Tył:                                       │ │
│ │  To describe temporary states and locations │ │
│ │                                             │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ [❌ Odrzuć (Del)]  [✏️ Edytuj (E)]  [✅ Akceptuj (Enter)] │
│                                                 │
│ Tip: Tab = następna fiszka, ? = pomoc          │
└────────────────────────────────────────────────┘
```

**Tryb edycji**:
```
┌────────────────────────────────────────────────┐
│ Fiszka 3 / 12 (Edycja)                         │
│                                                 │
│ Przód:                                          │
│ ┌────────────────────────────────────────────┐ │
│ │ [Textarea z frontem - edytowalne]          │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ Tył:                                            │
│ ┌────────────────────────────────────────────┐ │
│ │ [Textarea z tyłem - edytowalne]            │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ [Anuluj (Esc)]              [Zapisz (Enter)]   │
└────────────────────────────────────────────────┘
```

**Akcje użytkownika**:

1. **Akceptuj (Enter)**:
   - `POST /api/flashcards` z `{deck_id, front, back, source: 'ai'}`
   - `POST /api/ai/review-actions` z `{generation_log_id, flashcard_id, action_type: 'accepted', original_front, original_back}`
   - Increment `acceptedCount`
   - Przejdź do następnej fiszki (currentIndex++)
   - Toast: "Fiszka dodana ✓"

2. **Edytuj (E)**:
   - Włącz tryb edycji (textareas zamiast text)
   - Autofocus na textarea front
   - Autoselect content
   - Przycisk "Zapisz" lub Enter submituje
   - Po zapisie:
     - `POST /api/flashcards` z edytowaną treścią
     - `POST /api/ai/review-actions` z `{action_type: 'edited', original_front, original_back, edited_front, edited_back}`
     - Increment `acceptedCount`
     - Dodaj index do `editedCards`
     - Przejdź do następnej fiszki
     - Toast: "Fiszka zapisana ✓"

3. **Odrzuć (Delete)**:
   - `POST /api/ai/review-actions` z `{generation_log_id, flashcard_id: null, action_type: 'rejected', original_front, original_back}`
   - Increment `rejectedCount`
   - Przejdź do następnej fiszki
   - Toast: "Fiszka odrzucona"

4. **Następna (Tab)**:
   - currentIndex++ (bez zapisu)
   - Jeśli była ostatnia: pokaż podsumowanie

5. **Poprzednia (Shift+Tab)**:
   - currentIndex-- (jeśli > 0)

**Podsumowanie (modal po ostatniej fiszce)**:
```
┌────────────────────────────────────┐
│  Recenzja zakończona! 🎉           │
│                                     │
│  Zaakceptowane: 8 fiszek            │
│  Edytowane: 3 fiszki                │
│  Odrzucone: 1 fiszka                │
│                                     │
│  Dodano do talii: Spanish Vocabulary│
│                                     │
│  [Zamknij] [Generuj więcej]        │
└────────────────────────────────────┘
```

**Keyboard shortcuts**:
- `Enter` = Akceptuj fiszkę
- `E` = Edytuj fiszkę
- `Delete` = Odrzuć fiszkę
- `Tab` = Następna fiszka
- `Shift+Tab` = Poprzednia fiszka
- `Esc` = Anuluj edycję (w trybie edycji) lub wróć do listy talii
- `?` = Pokaż pomoc

**Keyboard shortcuts help** (overlay):
- Pokazuje się automatycznie przy pierwszej recenzji (dismissable)
- Przycisk "?" w prawym górnym rogu zawsze dostępny
- Modal z listą wszystkich skrótów

**UX & Accessibility**:
- Focus trap na aktualnej fiszce
- aria-live dla liczników (screen readers)
- Loading state podczas zapisywania
- Optimistic updates z rollback na błąd
- Animacja fade-in przy zmianie fiszki (smooth transition)

**Security**:
- Draft fiszek tylko w React state (nie w local storage - zbyt duże)
- Walidacja po stronie backendu przy zapisie
- Rate limiting na endpointach

**Edge cases**:
- Brak draft fiszek w context: przekierowanie na `/generate`
- Błąd zapisu fiszki: Rollback + toast + pozostań na aktualnej fiszce
- Wyjście ze strony przed zakończeniem recenzji: Confirm dialog "Niezapisane zmiany zostaną utracone"
- Tylko jedna fiszka: Brak nawigacji Tab/Shift+Tab
- Wszystkie odrzucone: Podsumowanie "Nie dodano żadnych fiszek. Spróbuj ponownie?"

---

### 2.7 Sesja nauki (`/study/:sessionId`)

**Cel główny**: Przeprowadzenie sesji nauki z wykorzystaniem algorytmu spaced repetition (SM-2)

**Kluczowe informacje**:
- Aktualna fiszka: front (początkowo), back (po odkryciu)
- Licznik pozostałych fiszek
- Przyciski oceny trudności (Again, Hard, Good, Easy) z przewidywanym czasem następnej powtórki
- Session ID (z URL)

**Kluczowe komponenty**:
- `StudySession.tsx` (React) - główny kontener sesji
- `FlashcardDisplay.tsx` (React) - wyświetlenie fiszki z flip animation
- `DifficultyButtons.tsx` (React) - przyciski oceny (1-4)
- `SessionProgress.tsx` (React) - licznik i progress bar
- `SessionSummary.tsx` (React) - modal podsumowania
- `KeyboardShortcutsOverlay.tsx` (React) - overlay przy pierwszej sesji

**State management**:
- React Context: `StudySessionContext`
  - `sessionId: string` (z URL params)
  - `deckId: string` (z API)
  - `dueCards: Array<Flashcard>` (z API)
  - `currentCardIndex: number`
  - `isAnswerRevealed: boolean`
  - `cardsReviewed: number`
  - `reviewStartTimes: Map<cardId, timestamp>` (dla response_time_ms)

**Integracja API**:
- `POST /api/study-sessions` - utworzenie sesji (przed wejściem na /study/:sessionId)
- `GET /api/study-sessions/:id` - pobranie danych sesji (SSR)
- `GET /api/decks/:id/due?limit=100` - pobranie fiszek do nauki (SSR)
- `POST /api/study-sessions/:id/reviews` - zapisanie oceny fiszki (po każdej ocenie)
- `PATCH /api/study-sessions/:id/complete` - zakończenie sesji (opcjonalnie)

**Layout - StudyLayout** (minimal):
```
┌────────────────────────────────────────────────┐
│ [Deck name]    12 fiszek pozostało    [X Exit] │
├────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              ┌──────────────────┐              │
│              │                  │              │
│              │  ¿Cómo estás?    │              │
│              │                  │              │
│              │  [Pokaż (Space)] │              │
│              │                  │              │
│              └──────────────────┘              │
│                                                 │
│                                                 │
├────────────────────────────────────────────────┤
│  [Again (1)]  [Hard (2)]  [Good (3)]  [Easy (4)] │
│   < 10 min      4 days      1 week     2 weeks   │
│  (disabled)    (disabled)  (disabled)  (disabled) │
└────────────────────────────────────────────────┘
```

**Layout - Po odkryciu odpowiedzi**:
```
┌────────────────────────────────────────────────┐
│ Spanish Vocabulary    11 fiszek pozostało  [X] │
├────────────────────────────────────────────────┤
│                                                 │
│              ┌──────────────────┐              │
│              │  ¿Cómo estás?    │              │
│              │                  │              │
│              │  How are you?    │              │
│              │                  │              │
│              └──────────────────┘              │
│                                                 │
├────────────────────────────────────────────────┤
│  [Again (1)]  [Hard (2)]  [Good (3)]  [Easy (4)] │
│   < 10 min      4 days      1 week     2 weeks   │
│  (enabled)     (enabled)   (enabled)   (enabled) │
└────────────────────────────────────────────────┘
```

**Flip interaction** (card reveal):
- Przycisk "Pokaż odpowiedź" lub Spacja
- CSS flip animation (3D transform)
- Front znika → Back pojawia się
- Przyciski oceny stają się enabled
- Timer stop dla response_time_ms

**Difficulty buttons**:
- **Again (1)**: Czerwony, "< 10 min" (naucz ponownie)
- **Hard (2)**: Pomarańczowy, "4 days" (trudna)
- **Good (3)**: Zielony, "1 week" (dobra, standard)
- **Easy (4)**: Niebieski, "2 weeks" (łatwa)

Czasy są **szacowane** na podstawie algorytmu SM-2:
- Pobierane z backendu po odkryciu odpowiedzi (opcjonalnie)
- Lub obliczane frontend na podstawie obecnych wartości `easiness_factor`, `interval`, `repetitions`

**Submit review flow**:
1. Kliknięcie przycisku oceny (np. "Good")
2. Loading state (disabled buttons)
3. `POST /api/study-sessions/:sessionId/reviews` z `{flashcard_id, rating, response_time_ms}`
4. Backend zwraca zaktualizowane dane fiszki (next_review_date, easiness_factor, interval, repetitions)
5. Increment `cardsReviewed` w context
6. currentCardIndex++
7. Reset `isAnswerRevealed = false`
8. Załaduj następną fiszkę lub pokaż podsumowanie

**Session progress**:
- Licznik: "12 fiszek pozostało" (zmniejsza się)
- Progress bar (opcjonalnie): `cardsReviewed / totalDueCards * 100%`
- Smooth animation przy zmianie

**Exit behavior**:
- Przycisk "Exit" w header
- Confirm dialog: "Czy na pewno chcesz zakończyć sesję?"
- Po potwierdzeniu: przekierowanie na `/decks/:id`
- Postęp jest zapisany (każda ocena to osobny POST)
- Opcjonalnie: `PATCH /api/study-sessions/:id/complete` dla statystyk

**Session completion**:
- Po ocenie ostatniej fiszki: modal podsumowania
- Automatyczne wywołanie `PATCH /api/study-sessions/:id/complete` (opcjonalnie, dla duration)

**Summary modal**:
```
┌────────────────────────────────────┐
│  Sesja zakończona! 🎉              │
│                                     │
│  Przejrzane fiszki: 12              │
│  Czas trwania: 15 min 32 s          │
│                                     │
│  Oceny:                             │
│  Again: 2                           │
│  Hard: 3                            │
│  Good: 5                            │
│  Easy: 2                            │
│                                     │
│  [Zamknij] [Ucz się ponownie]      │
└────────────────────────────────────┘
```

**Keyboard shortcuts**:
- `Space` = Odkryj odpowiedź (tylko gdy ukryta)
- `1` = Again (tylko gdy odpowiedź odkryta)
- `2` = Hard (tylko gdy odpowiedź odkryta)
- `3` = Good (tylko gdy odpowiedź odkryta)
- `4` = Easy (tylko gdy odpowiedź odkryta)
- `?` = Pokaż pomoc

**First-time UX**:
- Przy pierwszej sesji użytkownika: dismissable overlay z kluczowymi skrótami
- Opcja "Nie pokazuj ponownie" (local storage)

**UX & Accessibility**:
- Large, centered flashcard (max-width, responsive)
- Focus management: autofocus na przycisku "Pokaż" lub na przyciskach oceny
- aria-live dla licznika (screen readers)
- aria-disabled dla przycisków oceny gdy odpowiedź ukryta
- Smooth transitions między fiszkami
- Loading states podczas zapisywania oceny

**Security**:
- Session ID w URL musi należeć do zalogowanego użytkownika (middleware)
- RLS w Supabase zapewnia izolację danych

**Edge cases**:
- Brak fiszek do powtórki: Przekierowanie na `/decks/:id` z komunikatem "Brak fiszek do powtórki"
- Błąd zapisu oceny: Rollback + toast + pozostań na aktualnej fiszce
- Session ID nieprawidłowe: 404 lub przekierowanie na dashboard
- Tylko jedna fiszka: Normalny flow, po ocenie od razu podsumowanie
- Wyjście ze strony podczas sesji: Brak confirm dialog (postęp zapisany)

---

### 2.8 Tworzenie fiszki manualnie (Modal/Inline Form)

**Cel główny**: Szybkie dodanie pojedynczej fiszki przez użytkownika

**Kluczowe informacje**:
- Front (pytanie) - textarea
- Back (odpowiedź) - textarea
- Wybór talii (dropdown z inline creation)

**Kluczowe komponenty**:
- `CreateFlashcardModal.tsx` (React) lub inline form
- `DeckSelector.tsx` (React) - reusable z AI generate
- `Button`, `Input`, `Textarea` (Shadcn/ui)

**Integracja API**:
- `POST /api/flashcards` z `{deck_id, front, back, source: 'manual'}`
- `POST /api/decks` (jeśli inline creation)

**Layout - Modal**:
```
┌────────────────────────────────────┐
│  Dodaj nową fiszkę            [X]  │
│                                     │
│  Przód (pytanie):                   │
│  ┌──────────────────────────────┐  │
│  │ [Textarea]                   │  │
│  └──────────────────────────────┘  │
│                                     │
│  Tył (odpowiedź):                   │
│  ┌──────────────────────────────┐  │
│  │ [Textarea]                   │  │
│  └──────────────────────────────┘  │
│                                     │
│  Dodaj do talii:                    │
│  [Wybierz talię... ▼]               │
│                                     │
│  [Anuluj]         [Dodaj fiszkę]   │
└────────────────────────────────────┘
```

**Validation**:
- Front: wymagane, 1-1000 znaków
- Back: wymagane, 1-1000 znaków
- Deck: wymagane (wybrana lub nowo utworzona)
- Real-time feedback

**UX & Accessibility**:
- Autofocus na textarea Front
- Tab order: Front → Back → Deck selector → Submit
- Enter w textarea: nowa linia (nie submit)
- Ctrl+Enter (lub Cmd+Enter): submit
- Esc: zamknij modal
- Focus trap w modalu

**Optimistic update**:
- Po kliknięciu "Dodaj fiszkę": natychmiastowe dodanie do listy
- Loading state
- Rollback na błąd + toast

**Edge cases**:
- Puste pola: Submit disabled + walidacja
- Błąd zapisu: Toast "Nie udało się dodać fiszki. Spróbuj ponownie."
- Bardzo długi tekst: Textarea autoresize, scrollbar

---

## 3. Mapa podróży użytkownika

### 3.1 Główne ścieżki użytkownika

#### Ścieżka 1: Nowy użytkownik - Pierwszy kontakt

1. **Landing / Redirect** → `/signup`
2. **Rejestracja** (`/signup`)
   - Wypełnienie formularza (email, hasło)
   - Submit → auto-login
3. **Dashboard** (`/`)
   - Empty state: Brak talii
   - Dwie opcje: "Utwórz pierwszą talię" lub "Generuj fiszki z AI"

**Wariant A: Manualne tworzenie**
4. **Utworzenie talii** (modal/inline form)
   - Nazwa talii → Submit
5. **Widok talii** (`/decks/:id`)
   - Empty state: Brak fiszek
   - "Dodaj pierwszą fiszkę"
6. **Dodanie fiszki** (modal)
   - Front, Back → Submit
7. **Powrót do widoku talii**
   - Fiszka widoczna na liście
8. **Rozpoczęcie sesji nauki**
   - Kliknięcie "Rozpocznij naukę" → utworzenie session → `/study/:sessionId`
9. **Sesja nauki**
   - Odkrycie odpowiedzi → Ocena → Powtórzenie dla wszystkich fiszek
10. **Podsumowanie sesji**
    - Modal z wynikami → "Zamknij" → Dashboard

**Wariant B: Generowanie z AI**
4. **Formularz generowania** (`/generate`)
   - Wklejenie tekstu (100-5000 znaków)
   - Wybór talii (nowa lub istniejąca)
   - Submit → Loading
5. **Recenzja fiszek** (`/generate/review`)
   - Przejrzenie wygenerowanych fiszek
   - Akceptacja / Edycja / Odrzucenie
   - Podsumowanie → "Zamknij" → Widok talii
6. **Widok talii** (`/decks/:id`)
   - Zaakceptowane fiszki widoczne
7. **Rozpoczęcie sesji nauki** (jak w wariancie A)

---

#### Ścieżka 2: Powracający użytkownik - Codzienna sesja nauki

1. **Login** (`/login`)
   - Email, hasło → Submit
2. **Dashboard** (`/`)
   - Lista talii z licznikami due cards
3. **Wybór talii do nauki**
   - Kliknięcie "Study" przy talii z due_count > 0
   - Utworzenie session → `/study/:sessionId`
4. **Sesja nauki**
   - Przejrzenie fiszek → Oceny
5. **Podsumowanie**
   - Modal → "Zamknij" → Dashboard
6. **Logout** (opcjonalnie)
   - User menu → Wyloguj → `/login`

---

#### Ścieżka 3: Zarządzanie taliami i fiszkami

1. **Dashboard** (`/`)
2. **Edycja nazwy talii**
   - Kliknięcie na nazwę → Inline editing → Autosave
3. **Przeglądanie fiszek**
   - Kliknięcie "Przeglądaj" → `/decks/:id`
4. **Edycja fiszki**
   - Kliknięcie na tekst → Inline editing → Autosave
5. **Dodanie nowej fiszki**
   - Modal → Front, Back → Submit
6. **Usunięcie fiszki**
   - Kliknięcie ikony delete → Confirm → Usunięcie
7. **Powrót do dashboardu**
   - Kliknięcie "← Wstecz" lub logo

---

#### Ścieżka 4: Generowanie dodatkowych fiszek dla istniejącej talii

1. **Dashboard** (`/`)
2. **Wybór talii**
   - Kliknięcie "Przeglądaj" → `/decks/:id`
3. **Generowanie AI**
   - Kliknięcie "Generuj AI" → `/generate`
4. **Formularz**
   - Tekst → Wybór aktualnej talii (auto-selected) → Submit
5. **Recenzja**
   - Akceptacja fiszek → "Zamknij" → Widok talii
6. **Widok talii**
   - Nowe fiszki dodane do listy
7. **Rozpoczęcie nauki** (opcjonalnie)

---

### 3.2 触发点 (Trigger Points) i przejścia

| Akcja użytkownika | Punkt wyjścia | Punkt docelowy | Warunek |
|-------------------|---------------|----------------|---------|
| Rejestracja sukces | `/signup` | `/` (Dashboard) | Auto-login |
| Logowanie sukces | `/login` | `/` (Dashboard) | Valid credentials |
| Utworzenie talii | `/` lub `/decks/:id` | `/decks/:id` (nowa) | Formularz valid |
| Kliknięcie "Study" | `/` (Dashboard) | `/study/:sessionId` | due_count > 0 |
| Kliknięcie "Przeglądaj" | `/` (Dashboard) | `/decks/:id` | - |
| Kliknięcie "Generuj AI" | `/` lub `/decks/:id` | `/generate` | - |
| Submit generowania | `/generate` | `/generate/review` | Valid text |
| Zakończenie recenzji | `/generate/review` | `/decks/:id` | Wszystkie przejrzane |
| Zakończenie sesji | `/study/:sessionId` | `/decks/:id` | Wszystkie ocenione |
| Wylogowanie | Dowolna strona | `/login` | - |
| Brak autentykacji | Dowolna chronionystrona | `/login` | Middleware redirect |

---

### 3.3 Przepływy błędów i edge cases

**Błąd autentykacji (401)**:
- Middleware wykrywa brak tokenu → Przekierowanie na `/login`
- Toast: "Sesja wygasła. Zaloguj się ponownie."

**Rate limit (429)**:
- Response z `Retry-After` header
- Toast: "Zbyt wiele prób. Spróbuj za X sekund."
- Disabled submit na X sekund

**Błąd serwera (500)**:
- Toast: "Coś poszło nie tak. Spróbuj ponownie za chwilę."
- Retry button w toast (opcjonalnie)

**Brak fiszek do nauki**:
- Przycisk "Study" disabled z tooltipem
- Kliknięcie → Toast: "Brak fiszek do powtórki. Dodaj nowe lub wróć później."

**Pusta talia**:
- Empty state w `/decks/:id`
- Opcje: "Dodaj fiszkę" lub "Generuj z AI"

**Niezapisane zmiany**:
- Wyjście z `/generate/review` przed zakończeniem
- Confirm dialog: "Niezapisane fiszki zostaną utracone. Kontynuować?"

---

## 4. Układ i struktura nawigacji

### 4.1 Główna nawigacja (Top Navigation Bar)

**Lokalizacja**: Wszystkie strony z wyjątkiem `/login`, `/signup`, `/study/:sessionId`

**Elementy**:
```
┌────────────────────────────────────────────────────┐
│ [🧠 AI Flashcards]  [Talie] [Generuj AI]  [👤 ▼] [?] │
└────────────────────────────────────────────────────┘
```

- **Logo / Brand** (lewo): Link do `/` (Dashboard)
- **Talie**: Link do `/` (Dashboard)
- **Generuj AI**: Link do `/generate`
- **User menu** (prawo): Dropdown
  - Email użytkownika (disabled)
  - Ustawienia (opcjonalnie, przyszły feature)
  - Wyloguj → `/login`
- **Pomoc "?"** (prawo): Otwiera modal z keyboard shortcuts

**Responsywność**:
- Desktop: Poziomy pasek
- Mobile: Hamburger menu (ikona) → Side drawer

---

### 4.2 Breadcrumbs / Back navigation

**Lokalizacja**: Strony zagnieżdżone (`/decks/:id`, `/generate`, `/generate/review`)

**Format**:
```
← Wstecz
```
lub
```
← Dashboard
```

- Zawsze link do poprzedniej strony w hierarchii
- Dashboard → Deck View → Study Session
- Dashboard → Generate → Review

**Alternatywnie**:
- Breadcrumbs: `Dashboard > Spanish Vocabulary`
- Klikalne segmenty

---

### 4.3 Nawigacja w formularzach i modalach

**Modals**:
- Header z tytułem + przycisk "X" (close)
- Footer z przyciskami akcji: "Anuluj" / "Zapisz"
- Esc zamyka modal
- Focus trap (Tab nie wychodzi poza modal)

**Multi-step forms** (AI generate flow):
- Step 1: `/generate` (formularz)
- Step 2: `/generate/review` (recenzja)
- Brak progress indicator (tylko 2 kroki)

---

### 4.4 Deep linking i bookmarking

**Wspierane ścieżki**:
- `/` - Dashboard (wymaga autentykacji)
- `/login` - Login (redirect jeśli zalogowany)
- `/signup` - Signup (redirect jeśli zalogowany)
- `/decks/:id` - Widok talii (wymaga autentykacji + własność talii)
- `/study/:sessionId` - Sesja nauki (wymaga autentykacji + własność sesji)
- `/generate` - Formularz AI (wymaga autentykacji)
- `/generate/review` - Recenzja AI (wymaga draft w context - redirect jeśli brak)

**Nie wspierane** (internal only):
- `/generate/review` bez draft → redirect na `/generate`
- `/study/:sessionId` dla nieistniejącej sesji → 404 lub redirect

**URL Parameters**:
- `/decks/:id?page=2&limit=50` - Paginacja fiszek
- Query params są persystowane w URL (bookmarkable)

---

### 4.5 Nawigacja klawiszowa (Keyboard Navigation)

**Globalne**:
- `?` - Otwórz pomoc z keyboard shortcuts

**Dashboard**:
- `Tab` - Nawigacja między kartami talii
- `Enter` - Otwórz wybraną talię (focus)
- `N` (opcjonalnie) - Nowa talia

**Deck View**:
- `Tab` - Nawigacja między fiszkami
- `Enter` - Edytuj fiszkę (focus)

**AI Review**:
- `Enter` - Akceptuj
- `E` - Edytuj
- `Delete` - Odrzuć
- `Tab` - Następna fiszka
- `Shift+Tab` - Poprzednia fiszka
- `Esc` - Anuluj edycję lub wyjdź

**Study Session**:
- `Space` - Odkryj odpowiedź
- `1` - Again
- `2` - Hard
- `3` - Good
- `4` - Easy

---

## 5. Kluczowe komponenty

### 5.1 Komponenty nawigacyjne

#### `Navigation.astro`
- **Opis**: Top navigation bar z logo, menu, user dropdown
- **Props**: `user` (email, avatar)
- **Responsywność**: Desktop = horizontal bar, Mobile = hamburger menu
- **Accessibility**: aria-label, role="navigation"

#### `Breadcrumbs.astro`
- **Opis**: Nawigacja hierarchiczna (opcjonalnie)
- **Props**: `items: Array<{label, href}>`
- **Przykład**: `Dashboard > Spanish Vocabulary`

#### `BackButton.tsx`
- **Opis**: Przycisk "← Wstecz" z nawigacją do poprzedniej strony
- **Props**: `href: string`, `label?: string`
- **Behavior**: `router.push(href)` lub `window.history.back()`

---

### 5.2 Komponenty autentykacji

#### `LoginForm.tsx` (React)
- **Opis**: Formularz logowania z walidacją
- **Props**: Brak (standalone)
- **State**: `email`, `password`, `isLoading`, `error`
- **API**: `POST /auth/v1/token?grant_type=password` (Supabase)
- **Validation**: Zod schema, real-time feedback

#### `SignupForm.tsx` (React)
- **Opis**: Formularz rejestracji z walidacją
- **Props**: Brak
- **State**: `email`, `password`, `confirmPassword`, `isLoading`, `error`
- **API**: `POST /auth/v1/signup` (Supabase)
- **Validation**: Zod, password strength indicator

---

### 5.3 Komponenty talii

#### `DeckCard.tsx` (React)
- **Opis**: Karta talii na dashboardzie z inline editing
- **Props**: `deck: Deck` (id, name, flashcard_count, due_count)
- **State**: `isEditing`, `editedName`
- **API**: `PATCH /api/decks/:id` (autosave)
- **Actions**: Study, View, Delete
- **Accessibility**: aria-label dla przycisków

#### `DeckGrid.astro`
- **Opis**: Responsywny grid kart talii
- **Props**: `decks: Deck[]`
- **Layout**: CSS Grid (1-3 kolumny responsive)

#### `CreateDeckButton.tsx` (React)
- **Opis**: Przycisk + modal/inline form tworzenia talii
- **State**: `isOpen`, `deckName`, `isLoading`
- **API**: `POST /api/decks`

#### `DeckSelector.tsx` (React)
- **Opis**: Dropdown wyboru talii z inline creation
- **Props**: `decks: Deck[]`, `selectedDeckId`, `onChange`
- **State**: `isCreatingNew`, `newDeckName`
- **API**: `POST /api/decks` (inline creation)
- **Reusable**: Używany w AI generate i manual flashcard creation

---

### 5.4 Komponenty fiszek

#### `FlashcardRow.tsx` (React)
- **Opis**: Pojedyncza fiszka w tabeli z inline editing
- **Props**: `flashcard: Flashcard` (id, front, back)
- **State**: `isEditingFront`, `isEditingBack`, `editedFront`, `editedBack`
- **API**: `PATCH /api/flashcards/:id` (autosave, debounce 500ms)
- **Actions**: Delete

#### `FlashcardTable.astro`
- **Opis**: Tabela/lista fiszek w widoku talii
- **Props**: `flashcards: Flashcard[]`, `deckId`
- **Responsive**: Table (desktop), Card list (mobile)

#### `CreateFlashcardModal.tsx` (React)
- **Opis**: Modal tworzenia fiszki manualnie
- **Props**: `deckId?: string` (opcjonalnie pre-selected)
- **State**: `front`, `back`, `selectedDeckId`, `isLoading`
- **API**: `POST /api/flashcards`
- **Validation**: Zod, real-time

#### `Pagination.tsx` (React)
- **Opis**: Standardowa paginacja dla list fiszek
- **Props**: `page`, `totalPages`, `limit`, `onPageChange`, `onLimitChange`
- **Query params**: Sync z URL (`?page=2&limit=50`)

---

### 5.5 Komponenty AI

#### `AIGenerateForm.tsx` (React)
- **Opis**: Formularz generowania fiszek z AI
- **State**: `text`, `charCount`, `estimatedCount`, `selectedDeckId`, `isLoading`
- **API**: `POST /api/ai/generate`
- **Validation**: 100-5000 znaków, real-time feedback
- **Components**: `CharacterCounter`, `DeckSelector`, `EstimatedCount`

#### `AIReviewInterface.tsx` (React)
- **Opis**: Kontener recenzji wygenerowanych fiszek (card-by-card)
- **State**: Context-based (`AIReviewContext`)
- **Components**: `FlashcardReviewCard`, `ReviewActions`, `ReviewProgress`, `ReviewSummary`

#### `FlashcardReviewCard.tsx` (React)
- **Opis**: Pojedyncza fiszka w recenzji (edytowalna)
- **Props**: `flashcard: {front, back}`, `index`, `isEditing`
- **State**: `editedFront`, `editedBack`
- **Actions**: Accept, Edit, Reject

#### `ReviewActions.tsx` (React)
- **Opis**: Przyciski akcji w recenzji (Accept, Edit, Reject)
- **Props**: `onAccept`, `onEdit`, `onReject`, `isEditing`
- **Keyboard**: Enter, E, Delete

#### `ReviewSummary.tsx` (React)
- **Opis**: Modal podsumowania recenzji
- **Props**: `acceptedCount`, `editedCount`, `rejectedCount`, `deckName`
- **Actions**: Close, Generate More

---

### 5.6 Komponenty sesji nauki

#### `StudySession.tsx` (React)
- **Opis**: Główny kontener sesji nauki
- **State**: Context-based (`StudySessionContext`)
- **Components**: `FlashcardDisplay`, `DifficultyButtons`, `SessionProgress`
- **API**: `POST /api/study-sessions/:id/reviews`, `PATCH /api/study-sessions/:id/complete`

#### `FlashcardDisplay.tsx` (React)
- **Opis**: Wyświetlenie fiszki z flip animation
- **Props**: `flashcard: {front, back}`, `isAnswerRevealed`
- **Animation**: CSS 3D flip transform
- **Actions**: Reveal answer (Space)

#### `DifficultyButtons.tsx` (React)
- **Opis**: Przyciski oceny trudności (1-4)
- **Props**: `onRate`, `isEnabled`, `nextReviewTimes: {again, hard, good, easy}`
- **Layout**: Fixed footer, full width, 4 przyciski
- **Keyboard**: 1-4

#### `SessionProgress.tsx` (React)
- **Opis**: Licznik i progress bar sesji
- **Props**: `cardsReviewed`, `totalCards`
- **Display**: "12 fiszek pozostało", progress bar (opcjonalnie)

#### `SessionSummary.tsx` (React)
- **Opis**: Modal podsumowania sesji
- **Props**: `cardsReviewed`, `duration`, `ratings: {again, hard, good, easy}`
- **Actions**: Close, Study Again

---

### 5.7 Komponenty wspólne (Common)

#### `Button` (Shadcn/ui)
- **Opis**: Przycisk z wariantami (primary, secondary, danger, ghost)
- **Props**: `variant`, `size`, `disabled`, `isLoading`, `onClick`
- **Accessibility**: aria-label, aria-disabled

#### `Input` / `Textarea` (Shadcn/ui)
- **Opis**: Pola tekstowe z walidacją
- **Props**: `value`, `onChange`, `error`, `disabled`
- **Accessibility**: aria-describedby dla błędów

#### `Modal` / `Dialog` (Shadcn/ui)
- **Opis**: Modal dialog z overlay
- **Props**: `isOpen`, `onClose`, `title`, `children`
- **Behavior**: Focus trap, Esc to close, click overlay to close
- **Accessibility**: role="dialog", aria-modal

#### `Toast` (Shadcn/ui)
- **Opis**: Powiadomienia toast
- **Props**: `message`, `type` (success, error, info), `duration`
- **Position**: Top-right (desktop), Top-center (mobile)
- **Accessibility**: aria-live="polite"

#### `Spinner` / `LoadingSpinner`
- **Opis**: Wskaźnik ładowania
- **Props**: `size` (small, medium, large)
- **Accessibility**: role="status", aria-label="Loading"

#### `EmptyState.astro`
- **Opis**: Komunikat stanu pustego z zachętą do akcji
- **Props**: `title`, `description`, `actionLabel`, `actionHref`
- **Przykład**: "Brak talii. Utwórz pierwszą."

#### `ErrorBoundary.tsx` (React)
- **Opis**: Obsługa błędów renderowania React
- **Fallback**: Friendly error message + reload button

#### `KeyboardShortcutsModal.tsx` (React)
- **Opis**: Modal z listą wszystkich skrótów klawiszowych
- **Trigger**: `?` key
- **Content**: Tabela skrótów pogrupowanych (Global, Study, Review)

#### `ConfirmationDialog.tsx` (React)
- **Opis**: Dialog potwierdzenia akcji (np. usunięcie)
- **Props**: `title`, `message`, `onConfirm`, `onCancel`, `confirmLabel`, `cancelLabel`
- **Accessibility**: Focus na "Cancel" domyślnie

---

### 5.8 Komponenty layoutów

#### `Layout.astro`
- **Opis**: Główny layout dla zalogowanych stron
- **Slots**: `<slot />` dla content
- **Includes**: `<Navigation />`, meta tags, global styles
- **Middleware**: Sprawdza autentykację

#### `AuthLayout.astro`
- **Opis**: Layout dla stron login/signup (bez nawigacji)
- **Slots**: `<slot />`
- **Includes**: Centered container, brand logo

#### `StudyLayout.astro`
- **Opis**: Minimalny layout dla sesji nauki (fullscreen)
- **Slots**: `<slot />`
- **Includes**: Header z exit button, footer z difficulty buttons
- **No navigation**: Brak top nav (focus na nauce)

---

## 6. Mapowanie wymagań na elementy UI

### 6.1 Wymagania funkcjonalne → Komponenty UI

| Wymaganie (RF) | Widok / Komponent | Opis implementacji |
|----------------|-------------------|--------------------|
| RF-001, RF-002 | `/signup`, `SignupForm.tsx` | Formularz rejestracji z email + password |
| RF-003, RF-004 | Wszystkie widoki | Middleware + RLS zapewniają separację danych |
| RF-005 | `Navigation.astro`, User dropdown | Link "Wyloguj" → wywołanie `POST /auth/v1/logout` |
| RF-006 | `CreateDeckButton.tsx`, `CreateDeckModal.tsx` | Modal z polem nazwy → `POST /api/decks` |
| RF-007 | `/` (Dashboard), `DeckGrid.astro` | SSR pobiera listę talii → wyświetlenie w grid |
| RF-008 | `DeckCard.tsx` inline editing | Kliknięcie na nazwę → textarea → autosave `PATCH /api/decks/:id` |
| RF-009 | `DeckCard.tsx`, Delete button → `ConfirmationDialog` | Modal potwierdzenia → `DELETE /api/decks/:id` |
| RF-010, RF-011 | `DeckCard.tsx` | Wyświetlenie `flashcard_count` i `due_count` z API |
| RF-012-RF-020 | `/generate`, `AIGenerateForm.tsx` | Formularz z walidacją → `POST /api/ai/generate` |
| RF-021-RF-030 | `/generate/review`, `AIReviewInterface.tsx` | Card-by-card review → akcje: Accept/Edit/Reject |
| RF-031-RF-038 | `CreateFlashcardModal.tsx`, `FlashcardRow.tsx` | Modal tworzenia + inline editing w tabeli |
| RF-039-RF-047 | `/study/:sessionId`, `StudySession.tsx` | Sesja nauki z algorytmem SM-2, difficulty buttons |
| RF-048-RF-055 | Wszystkie widoki z keyboard support | Event listeners dla klawiszy, `KeyboardShortcutsModal` |
| RF-056-RF-061 | Wszystkie formularze | Zod validation frontend, Supabase RLS backend |
| RF-062-RF-066 | Backendserwisy + logika zapisywania | `source` field, `ai_review_actions` table, timestamps |

---

### 6.2 Historyjki użytkownika → Widoki

| User Story (US) | Widok główny | Komponenty kluczowe |
|-----------------|--------------|---------------------|
| US-001 | `/signup` | `SignupForm.tsx` |
| US-002 | `/login` | `LoginForm.tsx` |
| US-003 | Wszystkie (user menu) | `Navigation.astro` |
| US-004 | `/` (Dashboard) | `CreateDeckButton.tsx` |
| US-005 | `/` (Dashboard) | `DeckGrid.astro`, `DeckCard.tsx` |
| US-006 | `/` (Dashboard), `/decks/:id` | `DeckCard.tsx` inline editing |
| US-007 | `/` (Dashboard) | `DeckCard.tsx`, `ConfirmationDialog` |
| US-008 | `/decks/:id` lub Dashboard | `CreateFlashcardModal.tsx` |
| US-009 | `/decks/:id` | `FlashcardRow.tsx` inline editing |
| US-010 | `/decks/:id` | `FlashcardRow.tsx`, Delete button |
| US-011 | `/generate` | `AIGenerateForm.tsx`, `CharacterCounter` |
| US-012 | Backend (nie widok) | API endpoint logic |
| US-013 | `/generate/review` | `AIReviewInterface.tsx` |
| US-014 | `/generate/review` | `ReviewActions.tsx`, Accept button |
| US-015 | `/generate/review` | `ReviewActions.tsx`, Edit mode |
| US-016 | `/generate/review` | `ReviewActions.tsx`, Reject button |
| US-017 | `/generate/review` | Keyboard navigation (Tab/Shift+Tab) |
| US-018 | `/generate` | `DeckSelector.tsx` |
| US-019 | `/generate/review` | `ReviewSummary.tsx` modal |
| US-020 | `/` (Dashboard) | `DeckCard.tsx`, Study button → `/study/:sessionId` |
| US-021 | `/study/:sessionId` | `FlashcardDisplay.tsx` (front only) |
| US-022 | `/study/:sessionId` | `FlashcardDisplay.tsx`, Reveal button/Space |
| US-023 | `/study/:sessionId` | `DifficultyButtons.tsx` |
| US-024 | `/study/:sessionId` | `SessionSummary.tsx` modal |
| US-025-US-027 | Wszystkie | `KeyboardShortcutsModal.tsx`, event listeners |
| US-028-US-031 | Backend + wszystkie formularze | Zod validation, error handling |
| US-032-US-034 | Backend (analytics) | Database logging, nie bezpośredni UI w MVP |

---

### 6.3 Przypadki brzegowe → Obsługa w UI

| Edge Case | Widok | Rozwiązanie UI |
|-----------|-------|----------------|
| Nowy użytkownik bez talii | `/` | `EmptyState.astro` z CTA "Utwórz talię" / "Generuj AI" |
| Talia bez fiszek | `/decks/:id` | `EmptyState.astro` w `FlashcardTable` |
| Brak fiszek do powtórki | `/` (Dashboard) | Przycisk "Study" disabled z tooltipem |
| Rate limit exceeded (429) | `/generate` | Toast z komunikatem + `Retry-After` timer |
| AI timeout | `/generate` | Toast "Generowanie trwa zbyt długo" + retry button |
| Błąd zapisu (500) | Wszystkie formularze | Toast + rollback optimistic update |
| Niezapisane zmiany | `/generate/review` | Confirm dialog przy opuszczeniu strony |
| Session wygasła (401) | Wszystkie chronione | Middleware redirect → `/login` + toast |
| Nieprawidłowy session ID | `/study/:sessionId` | 404 page lub redirect → Dashboard |
| Tylko jedna fiszka w sesji | `/study/:sessionId` | Normalny flow, po ocenie → podsumowanie |
| Usunięcie ostatniej fiszki na stronie | `/decks/:id` (paginacja) | Auto-redirect na poprzednią stronę |
| Bardzo długi tekst w fiszce | Wszystkie wyświetlenia fiszek | CSS truncation + full text on hover/click |
| Duplicate deck name | `/` (create deck) | Dozwolone (backend nie wymusza unique) |
| Concurrent edits (2 użytkowników) | `/decks/:id` inline editing | Last write wins (brak conflict detection w MVP) |

---

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Kluczowe wymagania dostępności

- **Keyboard Navigation**: Wszystkie interakcje dostępne przez klawiaturę (Tab, Enter, Space, Arrows)
- **Focus Management**: Widoczny focus indicator, focus trap w modalach
- **ARIA Labels**: aria-label dla ikon bez tekstu, aria-describedby dla błędów walidacji
- **Screen Reader Support**: Semantic HTML (nav, main, button, form), aria-live dla dynamicznego contentu
- **Color Contrast**: Minimum 4.5:1 dla tekstu, 3:1 dla UI elements (Tailwind defaults spełniają)
- **Responsive Text**: Font size minimum 16px, skalowanie z przeglądarką
- **Alt Text**: Wszystkie obrazy (jeśli dodane w przyszłości) z alt text

### 7.2 Implementacja per widok

**Dashboard**:
- `<nav>` dla nawigacji, `<main>` dla contentu
- Deck cards: `role="button"` dla klikanych elementów
- aria-label="Study [Deck Name]" dla przycisków Study

**Formularze**:
- `<label for="...">` dla wszystkich inputów
- aria-describedby dla komunikatów błędów
- aria-invalid="true" dla pól z błędami

**Modals**:
- role="dialog", aria-modal="true"
- aria-labelledby dla tytułu modalu
- Focus trap (Tab nie wychodzi)
- Autofocus na Cancel button (bezpieczniejsze niż Delete)

**Study Session**:
- aria-live="polite" dla licznika fiszek
- aria-disabled dla przycisków difficulty (gdy odpowiedź ukryta)
- Announce flashcard front/back dla screen readers

**Toast Notifications**:
- aria-live="polite" (lub "assertive" dla błędów krytycznych)
- role="status" lub "alert"

---

## 8. Security w UI

### 8.1 Zabezpieczenia frontend

- **No sensitive data in state**: Nie przechowywać API keys, tokenów w local storage (tylko httpOnly cookies)
- **Input sanitization**: Wszystkie dane od użytkownika sanityzowane przed wyświetleniem (React automatic escaping)
- **CSRF protection**: Supabase automatycznie obsługuje przez JWT
- **XSS prevention**: React domyślnie escapuje, nie używać `dangerouslySetInnerHTML` bez sanityzacji
- **Rate limiting feedback**: Wyświetlanie komunikatów o limitach bez ujawniania szczegółów implementacji

### 8.2 Autentykacja i autoryzacja

- **Middleware**: Wszystkie chronione strony sprawdzają autentykację przed renderowaniem
- **RLS (Row Level Security)**: Supabase zapewnia izolację danych na poziomie DB
- **Token expiration**: Auto-logout po wygaśnięciu tokenu (1h), refresh token automatycznie
- **Logout**: Natychmiastowe usunięcie tokenu i przekierowanie na `/login`

### 8.3 Error handling bez ujawniania szczegółów

- **Generic error messages**: "Coś poszło nie tak" zamiast stack traces
- **No sensitive data in logs**: Logi nie zawierają haseł, tokenów, danych osobowych
- **401 vs 403**: Użyj generycznych komunikatów "Unauthorized" (nie ujawniaj czy user istnieje)

---

## 9. Performance & Optimization

### 9.1 Strategie optymalizacji

- **Astro SSR**: Szybkie pierwszeładowanie przez pre-rendering HTML
- **React.memo()**: Dla komponentów list (DeckCard, FlashcardRow) aby zapobiec re-renderom
- **Debounced autosave**: 500ms debounce dla inline editing (redukcja API calls)
- **Pagination**: Limit 20/50/100 fiszek per page (nie ładuj wszystkich na raz)
- **Lazy loading**: Modals i secondary components ładowane on-demand
- **Optimistic updates**: UI update natychmiast, rollback na błąd
- **Image optimization**: (future) Astro Image component dla obrazów

### 9.2 Bundle size

- **Tree shaking**: Tailwind purge unused CSS
- **Code splitting**: React components lazy loaded per route
- **Minimal dependencies**: Brak ciężkich bibliotek (no Redux, no Zustand)

### 9.3 Monitoring (future)

- **Core Web Vitals**: LCP, FID, CLS tracking
- **Error tracking**: Sentry lub podobne dla production errors
- **Analytics**: User behavior tracking (opcjonalnie, z zgodą użytkownika)

---

## 10. Responsywność

### 10.1 Breakpoints (Tailwind)

- **Mobile**: `< 640px` (sm)
- **Tablet**: `640px - 1024px` (sm - lg)
- **Desktop**: `> 1024px` (lg+)

### 10.2 Responsive patterns

**Dashboard**:
- Mobile: 1 kolumna, vertical stack
- Tablet: 2 kolumny, grid
- Desktop: 3 kolumny, grid

**Navigation**:
- Mobile: Hamburger menu → slide-in drawer
- Desktop: Horizontal top bar

**Flashcard Table**:
- Mobile: Card layout (vertical stack)
- Desktop: Table layout (columns)

**Study Session**:
- Mobile: Fullscreen card, difficulty buttons w footer
- Desktop: Centered card (max-width 600px), difficulty buttons w footer

**Modals**:
- Mobile: Fullscreen (100vh, 100vw)
- Desktop: Centered overlay (max-width 500px)

---

## 11. Podsumowanie architektury UI

### 11.1 Kluczowe decyzje architektoniczne

1. **Astro + React hybrid**: SSR dla performance, React tylko dla interaktywności
2. **Minimal state management**: Brak Redux/Zustand, React Context tylko dla AI review i study session
3. **Keyboard-first**: Pełna obsługa skrótów klawiszowych
4. **Inline editing**: Autosave z debounce, optimistic updates
5. **Card-by-card review**: Focus na pojedynczej fiszce zamiast listy
6. **Standard pagination**: Query params dla bookmarkable URLs
7. **Progressive enhancement**: HTML forms działają bez JS, JS dla lepszego UX

### 11.2 Priorytety UX

1. **Szybkość**: Minimalna liczba kliknięć do rozpoczęcia nauki
2. **Feedback**: Real-time walidacja, visual indicators (spinner, checkmark)
3. **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation
4. **Error recovery**: Optimistic updates z rollback, retry buttons
5. **Learning curve**: First-time overlays, keyboard shortcuts help

### 11.3 Skalowanie w przyszłości

**Możliwe rozszerzenia**:
- Search/filter dla dużych kolekcji talii/fiszek
- Bulk operations (multi-select, batch delete)
- Advanced statistics dashboard
- Collaborative features (shared decks)
- Mobile apps (React Native reuse components)
- Offline mode (Service Workers, IndexedDB)

**Architektura wspiera**:
- Dodawanie nowych widoków przez Astro routing
- Reusable components (Shadcn/ui + custom)
- API-first design (frontend ← REST API → backend)
- Modular structure (łatwe dodawanie features)

---

## 12. Next Steps (Implementacja)

### 12.1 Kolejność implementacji

1. **Faza 1: Core Infrastructure**
   - Setup Astro + React + Tailwind
   - Layouts (Layout.astro, AuthLayout.astro)
   - Navigation component
   - Shadcn/ui primitives (Button, Input, Modal)

2. **Faza 2: Autentykacja**
   - Login page + LoginForm
   - Signup page + SignupForm
   - Middleware (auth check)
   - User menu (logout)

3. **Faza 3: Zarządzanie taliami**
   - Dashboard (DeckGrid, DeckCard)
   - Create deck (modal)
   - Inline editing nazwy talii
   - Delete deck (confirmation)

4. **Faza 4: Zarządzanie fiszkami**
   - Deck view (FlashcardTable, FlashcardRow)
   - Create flashcard (modal)
   - Inline editing fiszek
   - Pagination

5. **Faza 5: AI Generation**
   - Generate form (AIGenerateForm)
   - Character counter, estimated count
   - Deck selector
   - Review interface (AIReviewInterface)
   - Review actions (Accept, Edit, Reject)
   - Review summary

6. **Faza 6: Study Session**
   - Study session component (StudySession)
   - Flashcard display (flip animation)
   - Difficulty buttons
   - Session progress
   - Session summary

7. **Faza 7: Polish & Optimization**
   - Keyboard shortcuts (all views)
   - Help modal (KeyboardShortcutsModal)
   - Error handling (ErrorBoundary, Toast)
   - Loading states (Spinner)
   - Accessibility audit
   - Performance optimization (React.memo, debounce)

### 12.2 Testing strategy

- **Unit tests**: React components (Jest + RTL)
- **Integration tests**: User flows (Playwright)
- **E2E tests**: Critical paths (signup → create deck → study)
- **Accessibility tests**: axe-core, manual keyboard navigation
- **Performance tests**: Lighthouse CI

---

**Koniec dokumentu architektury UI**
