# Plan implementacji widoku Dashboard - Lista talii

## 1. Przegląd

Dashboard to główny widok aplikacji AI Flashcards dostępny po zalogowaniu użytkownika. Stanowi centralny punkt nawigacji umożliwiający:
- Przegląd wszystkich talii użytkownika z kluczowymi statystykami (liczba fiszek, fiszki do powtórki)
- Szybkie rozpoczęcie sesji nauki dla wybranej talii
- Tworzenie i zarządzanie taliami (utworzenie, edycja nazwy, usunięcie)
- Dostęp do funkcji generowania fiszek przez AI
- Nawigację do widoków szczegółowych talii i tworzenia fiszek

Widok wykorzystuje renderowanie po stronie serwera (SSR) przez Astro do początkowego załadowania danych, a następnie React do interaktywnych komponentów (inline editing, modale, akcje CRUD).

## 2. Routing widoku

- **Ścieżka**: `/` (główna strona aplikacji)
- **Plik**: `src/pages/index.astro`
- **Ochrona**: Middleware sprawdza autentykację użytkownika przed renderowaniem
- **Przekierowanie**: Niezalogowany użytkownik → `/login`

## 3. Struktura komponentów

```
index.astro (SSR - Astro)
└── DashboardLayout.astro
    ├── Navigation.astro
    │   ├── Logo
    │   ├── HelpButton.tsx (React - "?" keyboard shortcut)
    │   └── UserMenu.tsx (React - dropdown z wylogowaniem)
    ├── DashboardHeader.astro
    │   ├── CreateDeckButton.tsx (React)
    │   └── GenerateAIButton.tsx (React - link do /generate)
    └── DashboardContent
        ├── EmptyState.astro (warunek: brak talii)
        └── DeckGrid.astro
            └── DeckCard.tsx (React - inline editing, akcje)
                ├── DeckNameEditor (inline component)
                ├── DeckStats (inline component)
                └── DeckActions (inline component)
                    ├── StudyButton
                    ├── ViewButton
                    └── DeleteButton
```

**Komponenty interaktywne (React):**
- `DeckCard.tsx` - karta talii z inline editing i akcjami
- `CreateDeckButton.tsx` - przycisk z modalem tworzenia talii
- `DeleteConfirmationModal.tsx` - modal potwierdzenia usunięcia
- `UserMenu.tsx` - menu użytkownika z opcjami
- `HelpButton.tsx` - przycisk pomocy ze skrótami klawiszowymi

**Komponenty statyczne (Astro):**
- `DashboardLayout.astro` - główny layout z nawigacją
- `Navigation.astro` - górna nawigacja
- `DashboardHeader.astro` - nagłówek z globalnymi akcjami
- `DeckGrid.astro` - responsywny grid talii
- `EmptyState.astro` - komunikat dla nowych użytkowników

## 4. Szczegóły komponentów

### 4.1 `index.astro` (Główna strona)

**Opis**: 
Strona główna aplikacji odpowiedzialna za SSR. Pobiera dane talii użytkownika z API podczas renderowania po stronie serwera i przekazuje je do komponentów layout.

**Główne elementy**:
```astro
---
// Sprawdzenie autentykacji przez middleware
const supabase = Astro.locals.supabase;
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return Astro.redirect('/login');
}

// Pobranie talii użytkownika (SSR)
const response = await fetch(`${Astro.url.origin}/api/decks`, {
  headers: {
    'Cookie': Astro.request.headers.get('Cookie') || ''
  }
});

const decksData = await response.json();
---

<DashboardLayout user={user} decks={decksData.data}>
  <!-- Zawartość dashboardu -->
</DashboardLayout>
```

**Obsługiwane interakcje**: 
- Brak (komponent serwerowy)

**Walidacja**: 
- Sprawdzenie czy użytkownik jest zalogowany
- Obsługa błędu podczas pobierania danych talii

**Typy**:
- `user: User` (z Supabase auth)
- `decksData: DeckListResponseDTO`

**Propsy**: 
- Brak (strona główna)

### 4.2 `DashboardLayout.astro`

**Opis**: 
Layout aplikacji zawierający nawigację, nagłówek i główną zawartość. Zarządza strukturą strony i przekazuje dane do komponentów dzieci.

**Główne elementy**:
```astro
---
interface Props {
  user: User;
  decks: DeckListItemDTO[];
}

const { user, decks } = Astro.props;
---

<Layout title="Dashboard - AI Flashcards">
  <Navigation user={user} client:load />
  
  <main class="container mx-auto px-4 py-8">
    <DashboardHeader client:load />
    
    {decks.length === 0 ? (
      <EmptyState />
    ) : (
      <DeckGrid decks={decks} client:load />
    )}
  </main>
</Layout>
```

**Obsługiwane interakcje**: 
- Brak (kontener layoutu)

**Walidacja**: 
- Sprawdzenie czy `decks` jest tablicą

**Typy**:
- `Props` interface (user, decks)
- `User` (Supabase)
- `DeckListItemDTO[]`

**Propsy**:
- `user: User` - zalogowany użytkownik
- `decks: DeckListItemDTO[]` - lista talii użytkownika

### 4.3 `Navigation.astro`

**Opis**: 
Górna nawigacja aplikacji zawierająca logo, przycisk pomocy i menu użytkownika.

**Główne elementy**:
```astro
<nav class="bg-white border-b border-gray-200">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="text-xl font-bold text-gray-900">
        AI Flashcards
      </a>
      
      <!-- Actions -->
      <div class="flex items-center gap-4">
        <HelpButton client:load />
        <UserMenu user={user} client:load />
      </div>
    </div>
  </div>
</nav>
```

**Obsługiwane interakcje**: 
- Kliknięcie logo → przekierowanie do `/`

**Walidacja**: 
- Brak

**Typy**:
- `User` (props)

**Propsy**:
- `user: User` - dane zalogowanego użytkownika

### 4.4 `HelpButton.tsx` (React)

**Opis**: 
Przycisk otwierający modal z listą skrótów klawiszowych. Nasłuchuje naciśnięcia klawisza `?` globalnie.

**Główne elementy**:
```tsx
- Button z ikoną "?" (shadcn/ui)
- Dialog (modal) ze skrótami klawiszowymi
- useEffect do nasłuchiwania klawisza "?"
- Lista skrótów pogrupowana według kontekstu
```

**Obsługiwane interakcje**:
- Kliknięcie przycisku → otwarcie modalu
- Naciśnięcie `?` → otwarcie modalu
- Naciśnięcie `Esc` lub kliknięcie poza modalem → zamknięcie
- Kliknięcie `X` w modalu → zamknięcie

**Walidacja**: 
- Brak

**Typy**:
- Stan: `isOpen: boolean`

**Propsy**: 
- Brak

### 4.5 `UserMenu.tsx` (React)

**Opis**: 
Dropdown menu użytkownika z opcjami wylogowania i informacjami o koncie.

**Główne elementy**:
```tsx
- Avatar użytkownika (inicjały z email)
- DropdownMenu (shadcn/ui)
- Elementy menu:
  - Email użytkownika (disabled)
  - Separator
  - Wyloguj (onClick -> logout)
```

**Obsługiwane interakcje**:
- Kliknięcie avatara → otwarcie menu
- Kliknięcie "Wyloguj" → wylogowanie użytkownika
- Kliknięcie poza menu → zamknięcie

**Walidacja**: 
- Brak

**Typy**:
```typescript
interface UserMenuProps {
  user: User;
}
```

**Propsy**:
- `user: User` - dane zalogowanego użytkownika

### 4.6 `DashboardHeader.astro`

**Opis**: 
Nagłówek dashboardu zawierający tytuł i globalne akcje (tworzenie talii, generowanie AI).

**Główne elementy**:
```astro
<header class="mb-8">
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold text-gray-900">Moje talie</h1>
    
    <div class="flex gap-4">
      <CreateDeckButton client:load />
      <Button variant="outline" onclick="window.location.href='/generate'">
        🤖 Generuj z AI
      </Button>
    </div>
  </div>
</header>
```

**Obsługiwane interakcje**: 
- Kliknięcie "Generuj z AI" → przekierowanie do `/generate`

**Walidacja**: 
- Brak

**Typy**:
- Brak

**Propsy**: 
- Brak

### 4.7 `CreateDeckButton.tsx` (React)

**Opis**: 
Przycisk otwierający modal z formularzem tworzenia nowej talii. Obsługuje walidację, wysyłanie requestu do API i aktualizację UI.

**Główne elementy**:
```tsx
- Button (shadcn/ui)
- Dialog (modal) z formularzem
- Input do nazwy talii
- Licznik znaków (0/100)
- Przyciski: Anuluj, Utwórz
- Loading state podczas zapisu
- Toast z komunikatem sukcesu/błędu
```

**Obsługiwane interakcje**:
- Kliknięcie przycisku → otwarcie modalu
- Wprowadzenie tekstu → walidacja długości (1-100 znaków)
- Kliknięcie "Utwórz" → POST /api/decks
- Kliknięcie "Anuluj" lub Esc → zamknięcie bez zapisu
- Enter w input → submit formularza

**Walidacja**:
- Nazwa talii wymagana (min 1 znak)
- Maksymalna długość: 100 znaków
- Przycisk "Utwórz" disabled gdy:
  - Nazwa pusta
  - Nazwa > 100 znaków
  - Request w trakcie (loading)

**Typy**:
```typescript
interface CreateDeckFormState {
  name: string;
  isLoading: boolean;
  error: string | null;
}

interface CreateDeckResponse {
  id: string;
  name: string;
  flashcard_count: number;
  due_count: number;
  created_at: string;
  updated_at: string;
}
```

**Propsy**: 
- Brak (standalone komponent)

### 4.8 `EmptyState.astro`

**Opis**: 
Komunikat wyświetlany dla nowych użytkowników, którzy nie mają jeszcze żadnych talii. Zachęca do utworzenia pierwszej talii lub wygenerowania fiszek przez AI.

**Główne elementy**:
```astro
<div class="flex flex-col items-center justify-center py-16 text-center">
  <div class="text-6xl mb-4">👋</div>
  
  <h2 class="text-2xl font-bold text-gray-900 mb-2">
    Witaj w AI Flashcards!
  </h2>
  
  <p class="text-gray-600 mb-8 max-w-md">
    Nie masz jeszcze żadnych talii. Zacznij od utworzenia pierwszej talii 
    lub wygeneruj fiszki z AI.
  </p>
  
  <div class="flex gap-4">
    <CreateDeckButton client:load />
    <Button variant="outline" onclick="window.location.href='/generate'">
      🤖 Generuj fiszki z AI
    </Button>
  </div>
</div>
```

**Obsługiwane interakcje**: 
- Kliknięcie przycisków (delegacja do CreateDeckButton i link do /generate)

**Walidacja**: 
- Brak

**Typy**:
- Brak

**Propsy**: 
- Brak

### 4.9 `DeckGrid.astro`

**Opis**: 
Responsywny grid wyświetlający karty talii. Zarządza layoutem w zależności od rozmiaru ekranu.

**Główne elementy**:
```astro
---
interface Props {
  decks: DeckListItemDTO[];
}

const { decks } = Astro.props;
---

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {decks.map(deck => (
    <DeckCard deck={deck} client:load />
  ))}
</div>
```

**Obsługiwane interakcje**: 
- Brak (kontener layoutu)

**Walidacja**: 
- Sprawdzenie czy `decks` jest tablicą

**Typy**:
- `Props` interface
- `DeckListItemDTO[]`

**Propsy**:
- `decks: DeckListItemDTO[]` - lista talii do wyświetlenia

### 4.10 `DeckCard.tsx` (React) - KOMPONENT GŁÓWNY

**Opis**: 
Interaktywna karta talii z inline editing nazwy i przyciskami akcji. Zarządza stanem edycji, autosave, usuwaniem i nawigacją do sesji nauki.

**Główne elementy**:
```tsx
<Card className="hover:shadow-lg transition-shadow">
  {/* Nazwa talii - klikalna, edytowalna */}
  {isEditing ? (
    <Input 
      value={editedName}
      onChange={handleNameChange}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      autoFocus
      maxLength={100}
    />
  ) : (
    <h3 onClick={handleStartEdit} className="cursor-pointer">
      {deck.name}
    </h3>
  )}
  
  {/* Licznik znaków podczas edycji */}
  {isEditing && (
    <span className="text-sm text-gray-500">
      {editedName.length}/100
    </span>
  )}
  
  {/* Wskaźnik zapisu */}
  {isSaving && <Spinner size="sm" />}
  {justSaved && <CheckIcon className="text-green-500" />}
  
  {/* Statystyki */}
  <div className="flex gap-4 text-sm text-gray-600">
    <span>{deck.flashcard_count} fiszek</span>
    <span>{deck.due_count} do powtórki</span>
  </div>
  
  {/* Akcje */}
  <div className="flex gap-2 mt-4">
    <Button 
      onClick={handleStudy}
      disabled={deck.due_count === 0}
      className="flex-1"
    >
      Study 🎯
    </Button>
    
    <Button 
      variant="outline"
      onClick={handleView}
    >
      Przeglądaj
    </Button>
    
    <Button 
      variant="ghost"
      size="icon"
      onClick={handleDeleteClick}
    >
      🗑️
    </Button>
  </div>
</Card>

{/* Modal potwierdzenia usunięcia */}
<DeleteConfirmationModal 
  isOpen={showDeleteModal}
  deckName={deck.name}
  flashcardCount={deck.flashcard_count}
  onConfirm={handleDeleteConfirm}
  onCancel={handleDeleteCancel}
/>
```

**Obsługiwane interakcje**:

1. **Inline editing nazwy**:
   - Kliknięcie na nazwę → tryb edycji (focus na input)
   - Wprowadzanie tekstu → walidacja długości (1-100)
   - Blur (opuszczenie pola) → autosave (debounce 500ms)
   - Enter → autosave i wyjście z trybu edycji
   - Esc → anulowanie edycji (przywrócenie poprzedniej nazwy)

2. **Akcje**:
   - Kliknięcie "Study" → przekierowanie do `/study/:id` (jeśli due_count > 0)
   - Kliknięcie "Przeglądaj" → przekierowanie do `/decks/:id`
   - Kliknięcie 🗑️ → otwarcie modalu potwierdzenia

3. **Usuwanie**:
   - Kliknięcie "Usuń" w modalu → DELETE /api/decks/:id
   - Kliknięcie "Anuluj" → zamknięcie modalu

**Walidacja**:
- Nazwa talii: min 1 znak, max 100 znaków
- Nie można zapisać pustej nazwy
- Autosave tylko gdy nazwa się zmieniła
- Przycisk "Study" disabled gdy `due_count === 0`

**Typy**:
```typescript
interface DeckCardProps {
  deck: DeckListItemDTO;
}

interface DeckCardState {
  isEditing: boolean;
  editedName: string;
  isSaving: boolean;
  justSaved: boolean;
  showDeleteModal: boolean;
  error: string | null;
}

// Hook do autosave z debounce
interface UseAutosaveOptions {
  delay: number;
  onSave: (value: string) => Promise<void>;
}

function useAutosave(value: string, options: UseAutosaveOptions): {
  isSaving: boolean;
  justSaved: boolean;
  error: string | null;
}
```

**Propsy**:
- `deck: DeckListItemDTO` - dane talii do wyświetlenia

### 4.11 `DeleteConfirmationModal.tsx` (React)

**Opis**: 
Reużywalny modal potwierdzenia usunięcia talii. Wyświetla szczegóły talii i prosi o potwierdzenie akcji.

**Główne elementy**:
```tsx
<Dialog open={isOpen} onOpenChange={onCancel}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Usunąć talię?</DialogTitle>
      <DialogDescription>
        Czy na pewno chcesz usunąć talię "{deckName}"?
        Ta talia zawiera {flashcardCount} fiszek. 
        Wszystkie zostaną usunięte.
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Anuluj
      </Button>
      <Button 
        variant="destructive" 
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? 'Usuwanie...' : 'Usuń'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Obsługiwane interakcje**:
- Kliknięcie "Anuluj" → wywołanie `onCancel()`
- Kliknięcie "Usuń" → wywołanie `onConfirm()`
- Kliknięcie poza modalem → wywołanie `onCancel()`
- Naciśnięcie Esc → wywołanie `onCancel()`

**Walidacja**: 
- Przycisk "Usuń" disabled podczas usuwania (loading state)

**Typy**:
```typescript
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  deckName: string;
  flashcardCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Propsy**:
- `isOpen: boolean` - czy modal jest otwarty
- `deckName: string` - nazwa talii do wyświetlenia
- `flashcardCount: number` - liczba fiszek w talii
- `onConfirm: () => void` - callback potwierdzenia
- `onCancel: () => void` - callback anulowania

## 5. Typy

### 5.1 Istniejące typy (z `src/types.ts`)

```typescript
// DTO dla elementu listy talii
export interface DeckListItemDTO {
  id: string;
  name: string;
  flashcard_count: number;
  due_count: number;
  created_at: string;
  updated_at: string;
}

// Response z paginacją dla listy talii
export interface DeckListResponseDTO {
  data: DeckListItemDTO[];
  pagination: PaginationDTO;
}

// Command do tworzenia nowej talii
export interface CreateDeckCommand {
  name: string;
}

// Command do aktualizacji talii
export interface UpdateDeckCommand {
  name: string;
}

// DTO paginacji
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

### 5.2 Nowe typy dla widoku Dashboard

```typescript
// src/components/dashboard/types.ts

/**
 * Props dla komponentu DeckCard
 */
export interface DeckCardProps {
  deck: DeckListItemDTO;
}

/**
 * Stan wewnętrzny komponentu DeckCard
 */
export interface DeckCardState {
  isEditing: boolean;        // Czy nazwa jest w trybie edycji
  editedName: string;        // Tymczasowa wartość nazwy podczas edycji
  isSaving: boolean;         // Czy zapis jest w trakcie
  justSaved: boolean;        // Czy właśnie zapisano (dla checkmark animacji)
  showDeleteModal: boolean;  // Czy pokazać modal usuwania
  error: string | null;      // Błąd podczas zapisywania/usuwania
}

/**
 * Props dla modalu potwierdzenia usunięcia
 */
export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  deckName: string;
  flashcardCount: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Props dla komponentu UserMenu
 */
export interface UserMenuProps {
  user: {
    email: string;
    id: string;
  };
}

/**
 * Opcje dla hooka useAutosave
 */
export interface UseAutosaveOptions {
  delay: number;                           // Opóźnienie debounce (ms)
  onSave: (value: string) => Promise<void>; // Funkcja zapisująca
}

/**
 * Return type dla hooka useAutosave
 */
export interface UseAutosaveReturn {
  isSaving: boolean;
  justSaved: boolean;
  error: string | null;
  save: () => Promise<void>;
}

/**
 * Props dla formularza tworzenia talii
 */
export interface CreateDeckFormState {
  name: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Props dla komponentu EmptyState
 */
export interface EmptyStateProps {
  onCreateDeck?: () => void;
  onGenerateAI?: () => void;
}

/**
 * Props dla DashboardLayout
 */
export interface DashboardLayoutProps {
  user: User; // z Supabase
  decks: DeckListItemDTO[];
}

/**
 * Props dla DeckGrid
 */
export interface DeckGridProps {
  decks: DeckListItemDTO[];
}
```

### 5.3 ViewModel types (kompozycje dla UI)

```typescript
/**
 * ViewModel dla karty talii z dodatkowymi computed properties dla UI
 */
export interface DeckCardViewModel extends DeckListItemDTO {
  // Computed properties
  hasCardsToReview: boolean;      // due_count > 0
  canStudy: boolean;               // hasCardsToReview
  isEmpty: boolean;                // flashcard_count === 0
  formattedCreatedAt: string;      // sformatowana data utworzenia
  formattedUpdatedAt: string;      // sformatowana data aktualizacji
}

/**
 * ViewModel dla dashboardu z computed statistics
 */
export interface DashboardViewModel {
  decks: DeckCardViewModel[];
  totalDecks: number;
  totalFlashcards: number;
  totalDueCards: number;
  isEmpty: boolean;
}
```

## 6. Zarządzanie stanem

### 6.1 Stan globalny

Dashboard nie wymaga globalnego zarządzania stanem (Redux, Zustand). Każdy komponent React zarządza swoim lokalnym stanem używając `useState`.

### 6.2 Stan lokalny komponentów

**DeckCard.tsx**:
```typescript
const [isEditing, setIsEditing] = useState(false);
const [editedName, setEditedName] = useState(deck.name);
const [showDeleteModal, setShowDeleteModal] = useState(false);

// Autosave hook
const { isSaving, justSaved, error } = useAutosave(editedName, {
  delay: 500,
  onSave: async (name) => {
    if (name === deck.name || name.trim() === '') return;
    
    const response = await fetch(`/api/decks/${deck.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) throw new Error('Failed to save');
    
    // Aktualizacja UI - możliwe przez reload lub optymistyczny update
    window.location.reload(); // Proste rozwiązanie dla MVP
  }
});
```

**CreateDeckButton.tsx**:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [name, setName] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**UserMenu.tsx**:
```typescript
const [isOpen, setIsOpen] = useState(false);
```

**HelpButton.tsx**:
```typescript
const [isOpen, setIsOpen] = useState(false);
```

### 6.3 Custom Hooks

**`useAutosave.ts`**:
```typescript
import { useEffect, useRef, useState } from 'react';

export function useAutosave(
  value: string,
  options: UseAutosaveOptions
): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const justSavedTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for autosave
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setError(null);
        
        await options.onSave(value);
        
        setJustSaved(true);
        justSavedTimeoutRef.current = setTimeout(() => {
          setJustSaved(false);
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setIsSaving(false);
      }
    }, options.delay);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (justSavedTimeoutRef.current) clearTimeout(justSavedTimeoutRef.current);
    };
  }, [value, options.delay]);
  
  return { isSaving, justSaved, error };
}
```

**`useDeckMutations.ts`** (opcjonalny - dla bardziej zaawansowanego cache management):
```typescript
export function useDeckMutations() {
  const updateDeck = async (id: string, command: UpdateDeckCommand) => {
    const response = await fetch(`/api/decks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update deck');
    }
    
    return response.json();
  };
  
  const deleteDeck = async (id: string) => {
    const response = await fetch(`/api/decks/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete deck');
    }
  };
  
  const createDeck = async (command: CreateDeckCommand) => {
    const response = await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create deck');
    }
    
    return response.json();
  };
  
  return { updateDeck, deleteDeck, createDeck };
}
```

## 7. Integracja API

### 7.1 GET /api/decks (SSR)

**Kiedy**: Podczas renderowania strony po stronie serwera (index.astro)

**Request**:
```typescript
// Brak body, autentykacja przez cookies
GET /api/decks
Headers: {
  'Cookie': 'session_cookie...'
}
```

**Response** (`200 OK`):
```typescript
interface DeckListResponseDTO {
  data: DeckListItemDTO[];
  pagination: {
    page: 1,
    limit: 20,
    total: 5,
    total_pages: 1
  }
}
```

**Obsługa błędów**:
- `401 Unauthorized` → przekierowanie do `/login` przez middleware
- `500 Server Error` → wyświetlenie komunikatu błędu

### 7.2 POST /api/decks (Client-side)

**Kiedy**: Kliknięcie "Utwórz" w CreateDeckButton

**Request**:
```typescript
POST /api/decks
Headers: {
  'Content-Type': 'application/json'
}
Body: CreateDeckCommand {
  name: string; // 1-100 znaków
}
```

**Response** (`201 Created`):
```typescript
interface DeckDTO {
  id: string;
  name: string;
  flashcard_count: 0;
  due_count: 0;
  created_at: string;
  updated_at: string;
}
```

**Obsługa błędów**:
- `400 Bad Request` (walidacja) → wyświetlenie komunikatu z `error.message`
- `401 Unauthorized` → przekierowanie do `/login`
- `500 Server Error` → toast "Nie udało się utworzyć talii. Spróbuj ponownie."

**Po sukcesie**:
- Toast sukcesu: "Talia utworzona!"
- Reload strony: `window.location.reload()` lub optymistyczny update UI

### 7.3 PATCH /api/decks/:id (Client-side)

**Kiedy**: Autosave w DeckCard po zmianie nazwy (debounce 500ms)

**Request**:
```typescript
PATCH /api/decks/{deck.id}
Headers: {
  'Content-Type': 'application/json'
}
Body: UpdateDeckCommand {
  name: string; // 1-100 znaków
}
```

**Response** (`200 OK`):
```typescript
interface DeckDTO {
  id: string;
  name: string;
  flashcard_count: number;
  due_count: number;
  created_at: string;
  updated_at: string;
}
```

**Obsługa błędów**:
- `400 Bad Request` → rollback do poprzedniej nazwy + error state
- `401 Unauthorized` → przekierowanie do `/login`
- `404 Not Found` → toast "Talia nie istnieje"
- `500 Server Error` → rollback + toast "Nie udało się zapisać. Spróbuj ponownie."

**Po sukcesie**:
- Wskaźnik checkmark przez 2 sekundy
- Optymistyczny update UI (nazwa pozostaje zmieniona)

### 7.4 DELETE /api/decks/:id (Client-side)

**Kiedy**: Kliknięcie "Usuń" w modalu potwierdzenia

**Request**:
```typescript
DELETE /api/decks/{deck.id}
// Brak body
```

**Response** (`204 No Content`):
- Brak body

**Obsługa błędów**:
- `401 Unauthorized` → przekierowanie do `/login`
- `404 Not Found` → toast "Talia nie istnieje"
- `500 Server Error` → toast "Nie udało się usunąć talii. Spróbuj ponownie."

**Po sukcesie**:
- Toast sukcesu: "Talia usunięta"
- Reload strony: `window.location.reload()` lub usunięcie z UI

### 7.5 GET /api/decks/:id/due (Opcjonalne - dla tooltip)

**Kiedy**: Hover na przycisku "Study" (opcjonalne dla tooltipa z podglądem fiszek)

**Request**:
```typescript
GET /api/decks/{deck.id}/due?limit=3
```

**Response** (`200 OK`):
```typescript
interface DueCardsResponseDTO {
  data: DueFlashcardDTO[];
  total: number;
}
```

**Użycie**: Tooltip z podglądem pierwszych 3 fiszek do powtórki

## 8. Interakcje użytkownika

### 8.1 Tworzenie nowej talii

**Flow**:
1. Użytkownik klika "Utwórz talię" w headerze lub EmptyState
2. Otwiera się modal z formularzem
3. Użytkownik wprowadza nazwę talii
4. System waliduje długość w czasie rzeczywistym (licznik znaków)
5. Przycisk "Utwórz" jest disabled dopóki nazwa nie spełnia wymagań
6. Użytkownik klika "Utwórz" lub Enter
7. System wysyła POST /api/decks
8. Loading state na przycisku ("Tworzenie...")
9. Po sukcesie: toast sukcesu, reload strony, nowa talia pojawia się na liście
10. Po błędzie: komunikat błędu pod formularzem, możliwość ponownej próby

**Skróty klawiszowe**:
- `Enter` → submit formularza
- `Esc` → zamknięcie modalu

### 8.2 Edycja nazwy talii (inline)

**Flow**:
1. Użytkownik klika na nazwę talii w karcie
2. Nazwa zmienia się w input z autofocus
3. Licznik znaków pojawia się (0/100)
4. Użytkownik edytuje nazwę
5. Po każdej zmianie uruchamia się debounce timer (500ms)
6. Po 500ms bez zmian: autosave (PATCH /api/decks/:id)
7. Wskaźnik "Zapisywanie..." (spinner)
8. Po sukcesie: checkmark przez 2 sekundy, nazwa zaktualizowana
9. Po błędzie: rollback do poprzedniej nazwy, komunikat błędu (toast)
10. Blur lub Enter → wyjście z trybu edycji
11. Esc → anulowanie edycji, przywrócenie poprzedniej nazwy

**Walidacja**:
- Min 1 znak
- Max 100 znaków
- Nie można zapisać pustej nazwy
- Autosave nie uruchamia się jeśli nazwa nie uległa zmianie

### 8.3 Rozpoczęcie sesji nauki

**Flow**:
1. Użytkownik klika przycisk "Study 🎯" na karcie talii
2. System sprawdza `deck.due_count`
3. Jeśli `due_count > 0`: przekierowanie do `/study/:id`
4. Jeśli `due_count === 0`: przycisk jest disabled, tooltip "Brak fiszek do powtórki"

**Tooltip** (hover na disabled button):
- "Brak fiszek do powtórki. Wszystkie fiszki są aktualne."

### 8.4 Przeglądanie talii

**Flow**:
1. Użytkownik klika przycisk "Przeglądaj" na karcie talii
2. Przekierowanie do `/decks/:id`
3. Wyświetlenie wszystkich fiszek w talii z możliwością edycji

### 8.5 Usuwanie talii

**Flow**:
1. Użytkownik klika ikonę 🗑️ na karcie talii
2. Otwiera się modal potwierdzenia
3. Modal wyświetla: nazwę talii i liczbę fiszek do usunięcia
4. Użytkownik klika "Usuń" lub "Anuluj"
5. Jeśli "Usuń": 
   - Loading state na przycisku ("Usuwanie...")
   - DELETE /api/decks/:id
   - Po sukcesie: toast sukcesu, reload strony, talia znika z listy
   - Po błędzie: toast błędu, modal pozostaje otwarty
6. Jeśli "Anuluj" lub Esc: zamknięcie modalu bez akcji

**Skróty klawiszowe**:
- `Enter` → potwierdzenie usunięcia (focus na "Usuń")
- `Esc` → anulowanie

### 8.6 Nawigacja i help

**Flow**:
1. Użytkownik klika "?" w nawigacji lub naciska `?` na klawiaturze
2. Otwiera się modal ze skrótami klawiszowymi
3. Skróty pogrupowane według kontekstu (Dashboard, Nauka, Recenzja AI)
4. Użytkownik może zamknąć modal: X, Esc, kliknięcie poza modalem

**Skróty globalne**:
- `?` → pomoc
- `N` → nowa talia (opcjonalne)

### 8.7 Wylogowanie

**Flow**:
1. Użytkownik klika avatar w nawigacji
2. Otwiera się dropdown menu
3. Menu pokazuje: email użytkownika (disabled), separator, "Wyloguj"
4. Użytkownik klika "Wyloguj"
5. System wywołuje `/api/auth/logout` lub `supabase.auth.signOut()`
6. Przekierowanie do `/login`

## 9. Warunki i walidacja

### 9.1 Walidacja formularza tworzenia talii (CreateDeckButton)

**Pole: name**
- Wymagane: TAK
- Typ: string
- Min długość: 1 znak
- Max długość: 100 znaków
- Walidacja w czasie rzeczywistym: TAK (licznik znaków)

**Stan przycisku "Utwórz"**:
- Disabled gdy:
  - `name.trim().length === 0`
  - `name.length > 100`
  - `isLoading === true`

**Komunikaty błędów**:
- Puste pole: "Nazwa talii jest wymagana"
- Przekroczenie limitu: "Nazwa może mieć maksymalnie 100 znaków"
- Błąd API: komunikat z response.error.message

### 9.2 Walidacja inline editing nazwy talii (DeckCard)

**Pole: editedName**
- Wymagane: TAK
- Typ: string
- Min długość: 1 znak
- Max długość: 100 znaków
- Walidacja przed zapisem: TAK

**Logika autosave**:
```typescript
if (editedName.trim().length === 0) {
  // Nie zapisuj, pozostaw w trybie edycji
  return;
}

if (editedName === deck.name) {
  // Brak zmian, nie wysyłaj request
  return;
}

if (editedName.length > 100) {
  // Przekroczenie limitu, nie zapisuj
  setError('Nazwa może mieć maksymalnie 100 znaków');
  return;
}

// Zapisz
await saveDeckName(editedName);
```

**Rollback**:
- Po naciśnięciu Esc: `setEditedName(deck.name)`
- Po błędzie API: `setEditedName(deck.name)` + toast błędu

### 9.3 Warunki dla przycisków akcji (DeckCard)

**Przycisk "Study 🎯"**:
```typescript
disabled={deck.due_count === 0}
```
- Jeśli disabled: tooltip "Brak fiszek do powtórki"
- Jeśli enabled: onClick → przekierowanie do `/study/${deck.id}`

**Przycisk "Przeglądaj"**:
- Zawsze enabled
- onClick → przekierowanie do `/decks/${deck.id}`

**Przycisk 🗑️**:
- Zawsze enabled
- onClick → otwarcie modalu potwierdzenia

### 9.4 Warunki renderowania (warunkowy rendering)

**EmptyState vs DeckGrid**:
```astro
{decks.length === 0 ? (
  <EmptyState />
) : (
  <DeckGrid decks={decks} />
)}
```

**Wskaźniki stanu w DeckCard**:
```tsx
{isSaving && <Spinner className="h-4 w-4" />}
{justSaved && <CheckIcon className="h-4 w-4 text-green-500" />}
{error && <AlertCircle className="h-4 w-4 text-red-500" />}
```

## 10. Obsługa błędów

### 10.1 Błędy autentykacji (401 Unauthorized)

**Scenariusz**: Użytkownik nie jest zalogowany lub sesja wygasła

**Obsługa**:
- Middleware w Astro sprawdza autentykację przed renderowaniem
- Jeśli brak użytkownika: `return Astro.redirect('/login')`
- Dla błędów 401 z API (client-side): przekierowanie do `/login`

```typescript
if (response.status === 401) {
  window.location.href = '/login';
  return;
}
```

### 10.2 Błędy walidacji (400 Bad Request)

**Scenariusz**: Niepoprawne dane w formularzu (np. nazwa > 100 znaków)

**Obsługa**:
```typescript
if (response.status === 400) {
  const error = await response.json();
  
  // Wyświetl komunikat błędu
  if (error.errors && Array.isArray(error.errors)) {
    // Zod validation errors
    const errorMessages = error.errors
      .map(e => e.message)
      .join(', ');
    
    setError(errorMessages);
  } else {
    setError(error.message || 'Validation failed');
  }
  
  // Toast dla użytkownika
  toast.error(error.message);
}
```

### 10.3 Błędy Not Found (404)

**Scenariusz**: Talia nie istnieje lub nie należy do użytkownika

**Obsługa**:
```typescript
if (response.status === 404) {
  toast.error('Talia nie istnieje');
  
  // Reload strony aby odświeżyć listę
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}
```

### 10.4 Błędy serwera (500 Server Error)

**Scenariusz**: Błąd po stronie backendu (database error, Supabase error)

**Obsługa**:
```typescript
if (response.status >= 500) {
  toast.error('Coś poszło nie tak. Spróbuj ponownie za chwilę.');
  
  // Rollback UI do poprzedniego stanu
  setEditedName(deck.name);
  setIsEditing(false);
}
```

### 10.5 Błędy sieciowe (Network Error)

**Scenariusz**: Brak połączenia z internetem, timeout

**Obsługa**:
```typescript
try {
  const response = await fetch(...);
} catch (error) {
  if (error instanceof TypeError) {
    // Network error
    toast.error('Problem z połączeniem. Sprawdź internet i spróbuj ponownie.');
  } else {
    toast.error('Nieoczekiwany błąd. Spróbuj ponownie.');
  }
  
  // Rollback UI
  setEditedName(deck.name);
  setIsEditing(false);
}
```

### 10.6 Błędy podczas ładowania danych (SSR)

**Scenariusz**: Błąd podczas pobierania talii w index.astro

**Obsługa**:
```astro
---
let decksData;
let loadingError = null;

try {
  const response = await fetch(`${Astro.url.origin}/api/decks`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to load decks');
  }
  
  decksData = await response.json();
} catch (error) {
  console.error('Failed to load decks:', error);
  loadingError = 'Nie udało się załadować talii. Odśwież stronę.';
  decksData = { data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
}
---

{loadingError && (
  <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {loadingError}
    <button onclick="window.location.reload()" class="ml-4 underline">
      Odśwież
    </button>
  </div>
)}
```

### 10.7 Edge cases

**Pusta lista talii**:
- Renderowanie EmptyState
- Przyciski do utworzenia pierwszej talii lub generowania z AI

**Talia bez fiszek do powtórki (due_count = 0)**:
- Przycisk "Study" disabled
- Tooltip z wyjaśnieniem

**Bardzo długa nazwa talii (overflow)**:
- CSS: `truncate` lub `line-clamp-2`
- Tooltip z pełną nazwą na hover

**Jednoczesna edycja dwóch talii**:
- Każda karta zarządza swoim stanem niezależnie
- Możliwe, ale nie zalecane (UX)

**Usunięcie ostatniej talii**:
- Po sukcesie: reload → EmptyState
- Zachęta do utworzenia nowej talii

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

Utworzyć strukturę katalogów i pliki:

```
src/
  pages/
    index.astro                          # Główna strona dashboardu (SSR)
  layouts/
    DashboardLayout.astro                # Layout z nawigacją
  components/
    dashboard/
      Navigation.astro                   # Górna nawigacja
      DashboardHeader.astro              # Nagłówek z akcjami
      DashboardContent.astro             # Kontener zawartości
      EmptyState.astro                   # Stan pusty
      DeckGrid.astro                     # Grid talii
      DeckCard.tsx                       # Karta talii (React)
      CreateDeckButton.tsx               # Przycisk tworzenia (React)
      DeleteConfirmationModal.tsx        # Modal usuwania (React)
      UserMenu.tsx                       # Menu użytkownika (React)
      HelpButton.tsx                     # Przycisk pomocy (React)
      types.ts                           # Typy dla komponentów dashboard
    hooks/
      useAutosave.ts                     # Hook autosave
      useDeckMutations.ts                # Hook dla operacji na taliach
```

### Krok 2: Implementacja komponentów statycznych (Astro)

1. **Navigation.astro**:
   - Layout górnej nawigacji
   - Logo (link do `/`)
   - Placeholder dla HelpButton i UserMenu (React components)

2. **DashboardHeader.astro**:
   - Tytuł "Moje talie"
   - Placeholder dla CreateDeckButton
   - Link/przycisk "Generuj z AI"

3. **EmptyState.astro**:
   - Icon, nagłówek, opis
   - Przyciski (CreateDeckButton, link do /generate)

4. **DeckGrid.astro**:
   - Responsywny grid (Tailwind: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
   - Mapowanie `decks` do `DeckCard` components

5. **DashboardLayout.astro**:
   - Import Layout bazowego
   - Kompozycja: Navigation, Header, Content (EmptyState lub DeckGrid)
   - Props: user, decks

### Krok 3: Implementacja index.astro (SSR)

```astro
---
import DashboardLayout from '@/layouts/DashboardLayout.astro';
import type { DeckListResponseDTO } from '@/types';

// Sprawdzenie autentykacji
const supabase = Astro.locals.supabase;
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return Astro.redirect('/login');
}

// Pobranie talii użytkownika
let decksData: DeckListResponseDTO;
let loadingError: string | null = null;

try {
  const response = await fetch(`${Astro.url.origin}/api/decks`, {
    headers: {
      'Cookie': Astro.request.headers.get('Cookie') || ''
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to load decks');
  }
  
  decksData = await response.json();
} catch (error) {
  console.error('Dashboard loading error:', error);
  loadingError = 'Nie udało się załadować talii. Odśwież stronę.';
  decksData = { 
    data: [], 
    pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } 
  };
}
---

<DashboardLayout user={user} decks={decksData.data}>
  {loadingError && (
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {loadingError}
      <button 
        onclick="window.location.reload()" 
        class="ml-4 underline font-medium"
      >
        Odśwież
      </button>
    </div>
  )}
</DashboardLayout>
```

### Krok 4: Implementacja custom hooks

1. **useAutosave.ts**:
   - Implementacja debounce logic
   - Stan: isSaving, justSaved, error
   - useEffect z setTimeout
   - Cleanup timeouts
   - Return interface UseAutosaveReturn

2. **useDeckMutations.ts** (opcjonalny):
   - Functions: createDeck, updateDeck, deleteDeck
   - Obsługa błędów
   - Return typed functions

### Krok 5: Implementacja komponentów React - UserMenu i HelpButton

1. **UserMenu.tsx**:
   - Shadcn DropdownMenu
   - Avatar z inicjałami (email[0].toUpperCase())
   - Menu items: email (disabled), separator, logout
   - Logout handler:
     ```typescript
     const handleLogout = async () => {
       await fetch('/api/auth/logout', { method: 'POST' });
       window.location.href = '/login';
     };
     ```

2. **HelpButton.tsx**:
   - Shadcn Dialog
   - Przycisk "?" w nawigacji
   - useEffect do nasłuchiwania klawisza "?"
   - Lista skrótów (hardcoded):
     ```typescript
     const shortcuts = [
       { key: '?', description: 'Pokaż tę pomoc' },
       { key: 'N', description: 'Nowa talia', context: 'Dashboard' },
       { key: 'Space', description: 'Odkryj odpowiedź', context: 'Nauka' },
       // ... więcej
     ];
     ```

### Krok 6: Implementacja CreateDeckButton.tsx

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CreateDeckCommand } from '@/types';

export function CreateDeckButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim().length === 0 || name.length > 100) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name } as CreateDeckCommand)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create deck');
      }
      
      toast.success('Talia utworzona!');
      setIsOpen(false);
      setName('');
      
      // Reload to show new deck
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się utworzyć talii');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = name.trim().length > 0 && name.length <= 100;

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        ➕ Utwórz talię
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Utwórz nową talię</DialogTitle>
              <DialogDescription>
                Podaj nazwę dla nowej talii fiszek
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nazwa talii</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Hiszpański - Słownictwo"
                  maxLength={100}
                  autoFocus
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {name.length}/100 znaków
                  </span>
                  {name.length > 100 && (
                    <span className="text-red-500">
                      Przekroczono limit
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isLoading}
              >
                {isLoading ? 'Tworzenie...' : 'Utwórz'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Krok 7: Implementacja DeleteConfirmationModal.tsx

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DeleteConfirmationModalProps } from './types';

export function DeleteConfirmationModal({
  isOpen,
  deckName,
  flashcardCount,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usunąć talię?</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć talię "{deckName}"?
            <br />
            Ta talia zawiera {flashcardCount} {flashcardCount === 1 ? 'fiszkę' : 'fiszek'}. 
            Wszystkie zostaną usunięte.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Usuń
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Krok 8: Implementacja DeckCard.tsx (komponent główny)

```tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAutosave } from '@/components/hooks/useAutosave';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { DeckCardProps } from './types';
import type { UpdateDeckCommand } from '@/types';

export function DeckCard({ deck }: DeckCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(deck.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Autosave hook
  const { isSaving, justSaved, error: saveError } = useAutosave(editedName, {
    delay: 500,
    onSave: async (name) => {
      if (name === deck.name || name.trim() === '') return;
      
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name } as UpdateDeckCommand)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }
    }
  });

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setEditedName(deck.name);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    if (editedName.trim() === '') {
      setEditedName(deck.name);
    }
    setIsEditing(false);
  };

  const handleStudy = () => {
    if (deck.due_count > 0) {
      window.location.href = `/study/${deck.id}`;
    }
  };

  const handleView = () => {
    window.location.href = `/decks/${deck.id}`;
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }
      
      toast.success('Talia usunięta');
      window.location.reload();
    } catch (error) {
      toast.error('Nie udało się usunąć talii. Spróbuj ponownie.');
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        {/* Nazwa talii */}
        <div className="mb-4">
          {isEditing ? (
            <div>
              <Input
                value={editedName}
                onChange={handleNameChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                maxLength={100}
                autoFocus
                className="text-xl font-semibold"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">
                  {editedName.length}/100
                </span>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                {justSaved && <Check className="h-4 w-4 text-green-500" />}
                {saveError && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
          ) : (
            <h3
              onClick={handleStartEdit}
              className="text-xl font-semibold cursor-pointer hover:text-blue-600 transition-colors"
            >
              {deck.name}
            </h3>
          )}
        </div>

        {/* Statystyki */}
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <span>{deck.flashcard_count} fiszek</span>
          <span className="text-blue-600 font-medium">
            {deck.due_count} do powtórki
          </span>
        </div>

        {/* Akcje */}
        <div className="flex gap-2">
          <Button
            onClick={handleStudy}
            disabled={deck.due_count === 0}
            className="flex-1"
            title={deck.due_count === 0 ? 'Brak fiszek do powtórki' : undefined}
          >
            Study 🎯
          </Button>
          
          <Button
            variant="outline"
            onClick={handleView}
          >
            Przeglądaj
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        deckName={deck.name}
        flashcardCount={deck.flashcard_count}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
```

### Krok 9: Styling i responsywność (Tailwind)

1. Sprawdzić responsywny grid w DeckGrid.astro:
   ```astro
   <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
   ```

2. Dodać hover effects i transitions:
   ```tsx
   className="hover:shadow-lg transition-shadow"
   className="cursor-pointer hover:text-blue-600 transition-colors"
   ```

3. Sprawdzić mobile navigation (hamburger menu jeśli potrzebny)

4. Testować na różnych rozdzielczościach:
   - Mobile: 375px (1 kolumna)
   - Tablet: 768px (2 kolumny)
   - Desktop: 1024px+ (3 kolumny)

### Krok 10: Integracja z API i testowanie

1. **Testowanie GET /api/decks (SSR)**:
   - Sprawdzić czy dane są poprawnie pobierane
   - Testować scenariusz braku talii (EmptyState)
   - Testować błędy autentykacji

2. **Testowanie POST /api/decks**:
   - Utworzyć talię przez CreateDeckButton
   - Sprawdzić walidację (puste pole, > 100 znaków)
   - Sprawdzić reload po sukcesie
   - Testować błędy API

3. **Testowanie PATCH /api/decks/:id**:
   - Edytować nazwę talii inline
   - Sprawdzić autosave (debounce 500ms)
   - Sprawdzić wskaźniki (spinner, checkmark)
   - Testować rollback po błędzie
   - Testować Esc (anulowanie)

4. **Testowanie DELETE /api/decks/:id**:
   - Usunąć talię przez modal
   - Sprawdzić potwierdzenie
   - Sprawdzić reload po sukcesie
   - Testować anulowanie

5. **Testowanie nawigacji**:
   - Kliknąć "Study" (przekierowanie do /study/:id)
   - Kliknąć "Przeglądaj" (przekierowanie do /decks/:id)
   - Kliknąć "Generuj z AI" (przekierowanie do /generate)

### Krok 11: Obsługa błędów i edge cases

1. **Dodać toasty (Sonner)**:
   ```tsx
   import { toast } from 'sonner';
   
   toast.success('Talia utworzona!');
   toast.error('Nie udało się utworzyć talii');
   ```

2. **Dodać error boundaries** (React):
   - Opcjonalnie: ErrorBoundary component dla DeckCard

3. **Testować edge cases**:
   - Bardzo długie nazwy talii (truncate)
   - Talia bez fiszek (disabled Study button)
   - Usunięcie ostatniej talii (EmptyState)
   - Jednoczesna edycja wielu talii
   - Błędy sieci (offline)

### Krok 12: Accessibility i keyboard shortcuts

1. **Dodać aria-labels**:
   ```tsx
   <Button aria-label="Delete deck">
     <Trash2 />
   </Button>
   ```

2. **Sprawdzić keyboard navigation**:
   - Tab przez karty talii
   - Enter na przyciskach
   - Esc w modalach
   - Focus trap w modalach (Shadcn Dialog robi to automatycznie)

3. **Dodać keyboard shortcut "N" dla nowej talii** (opcjonalnie):
   ```tsx
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
         const target = e.target as HTMLElement;
         if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
           setIsOpen(true);
         }
       }
     };
     
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, []);
   ```

### Krok 13: Optymalizacje wydajności

1. **SSR optimization**:
   - Cache headers dla `/api/decks` (opcjonalnie)
   - Lazy loading dla React components (`client:load` → `client:visible` dla poniżej fold)

2. **Debounce dla autosave**:
   - Już zaimplementowane w useAutosave (500ms)

3. **Optymistyczny UI update** (zamiast reload):
   - Opcjonalnie: użyć React Query lub SWR dla cache management
   - MVP: `window.location.reload()` jest wystarczające

### Krok 14: Dokumentacja i finalizacja

1. **Dodać komentarze JSDoc** do komponentów:
   ```tsx
   /**
    * DeckCard displays a single deck with inline editing and actions
    * @param deck - Deck data from API
    */
   export function DeckCard({ deck }: DeckCardProps) { ... }
   ```

2. **Zaktualizować types.ts** z nowymi typami

3. **Code review**:
   - Sprawdzić zgodność z PRD
   - Sprawdzić coverage User Stories
   - Sprawdzić zgodność z AI Instructions (Tailwind, Astro, React patterns)

4. **Testing manual**:
   - Przejść przez wszystkie User Stories (US-004 do US-020)
   - Sprawdzić responsywność
   - Sprawdzić accessibility (screen reader)
   - Sprawdzić keyboard navigation

5. **Deployment prep**:
   - Sprawdzić czy wszystkie komponenty są `client:load` gdzie potrzeba
   - Sprawdzić czy nie ma console.log w production code
   - Sprawdzić error handling
