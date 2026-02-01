# Dokument wymagań produktu (PRD) - AI Flashcards

## 1. Przegląd produktu

AI Flashcards to aplikacja webowa umożliwiająca tworzenie i naukę za pomocą fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji. Produkt rozwiązuje problem czasochłonności manualnego tworzenia wysokiej jakości fiszek przez automatyzację procesu generowania przy użyciu AI (Google Gemini), przy jednoczesnym zachowaniu pełnej kontroli użytkownika nad jakością końcowego materiału.

Aplikacja łączy w sobie trzy kluczowe elementy:
- Generator fiszek oparty o AI, który przekształca surowy tekst edukacyjny w zestaw pytań i odpowiedzi
- Prosty edytor umożliwiający manualne tworzenie i modyfikację fiszek
- System powtórek oparty o algorytm spaced repetition (SM-2)

Produkt jest skierowany do przeciętnego użytkownika znającego koncepcję fiszek i poszukującego efektywniejszego sposobu ich tworzenia. Użytkownicy to osoby uczące się nowych zagadnień, studentowie, samoucy oraz wszyscy, którzy chcą efektywnie przyswajać wiedzę.

Produkt realizowany będzie w formie progresywnej aplikacji webowej (PWA) z planem rozbudowy o aplikacje mobilne w przyszłości. MVP koncentruje się na podstawowych funkcjonalnościach bez zaawansowanych integracji czy współdzielenia materiałów.

## 2. Problem użytkownika

Główny problem:
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca użytkowników do korzystania z efektywnej metody nauki jaką jest spaced repetition. Użytkownicy muszą poświęcić znaczną ilość czasu na:
- Analizę materiału źródłowego i identyfikację kluczowych informacji
- Formułowanie pytań testujących zrozumienie, nie tylko zapamiętanie
- Pisanie zwięzłych, precyzyjnych odpowiedzi
- Organizację fiszek w logiczne zestawy

Konsekwencje problemu:
- Użytkownicy rezygnują z tworzenia fiszek pomimo znajomości korzyści płynących z tej metody nauki
- Tworzone fiszki są niskiej jakości (zbyt ogólne pytania, nieścisłe odpowiedzi)
- Brak regularności w nauce z powodu wysokiego progu wejścia
- Frustracja wynikająca z proporcji: dużo czasu na przygotowanie, mało na faktyczną naukę

Potrzeby użytkownika:
- Szybkie przekształcenie materiału źródłowego (notatki, artykuły, podręczniki) w gotowe fiszki
- Zachowanie kontroli nad jakością i treścią fiszek
- Możliwość łatwej edycji i dostosowania wygenerowanych materiałów
- Prosty system organizacji fiszek (talie)
- Efektywny interfejs nauki z algorytmem powtórek
- Dostęp do swoich materiałów z dowolnego urządzenia

## 3. Wymagania funkcjonalne

### 3.1 System użytkowników i autentykacja

RF-001: System musi umożliwiać rejestrację nowego użytkownika z wykorzystaniem email i hasła
RF-002: System musi umożliwiać logowanie istniejącego użytkownika
RF-003: System musi przechowywać fiszki i talie w kontekście konkretnego użytkownika
RF-004: System musi zapewniać separację danych między użytkownikami
RF-005: System musi umożliwiać wylogowanie użytkownika

### 3.2 Zarządzanie taliami

RF-006: System musi umożliwiać tworzenie nowej talii z nazwą
RF-007: System musi wyświetlać listę wszystkich talii użytkownika
RF-008: System musi umożliwiać edycję nazwy talii
RF-009: System musi umożliwiać usunięcie talii wraz ze wszystkimi fiszkami
RF-010: System musi wyświetlać liczbę fiszek w każdej talii
RF-011: System musi wyświetlać liczbę fiszek oczekujących na powtórkę w talii

### 3.3 Generowanie fiszek przez AI

RF-012: System musi przyjmować tekst wejściowy o długości 100-5000 znaków
RF-013: System musi wyświetlać licznik znaków w czasie rzeczywistym podczas wprowadzania tekstu
RF-014: System musi walidować długość tekstu przed wysłaniem (min 100, max 5000 znaków)
RF-015: System musi generować ~1 fiszkę na każde 250 znaków tekstu
RF-016: Generowanie fiszek musi odbywać się asynchronicznie przez backend (Google Gemini API)
RF-017: System musi zwracać listę wygenerowanych fiszek w formacie JSON z kluczami 'front' i 'back'
RF-018: Prompt systemowy do AI musi być konfigurowalny z poziomu kodu
RF-019: System nie może wystawiać API key Google Gemini na frontend
RF-020: System musi obsługiwać błędy API (timeout, limit, błędy serwera)

### 3.4 Recenzja wygenerowanych fiszek

RF-021: System musi wyświetlać wszystkie wygenerowane fiszki w interfejsie recenzji
RF-022: Użytkownik musi móc zaakceptować fiszkę bez zmian (przycisk lub Enter)
RF-023: Użytkownik musi móc edytować fiszkę inline przed akceptacją (przycisk lub E)
RF-024: Użytkownik musi móc odrzucić fiszkę (przycisk lub Delete)
RF-025: System musi umożliwiać nawigację między fiszkami (Tab = następna)
RF-026: System musi wyświetlać licznik: aktualna fiszka / total fiszek
RF-027: Użytkownik musi móc wybrać talię docelową podczas recenzji (nowa lub istniejąca)
RF-028: Każda akceptacja musi wysyłać pojedyncze żądanie POST do backendu
RF-029: Draft wygenerowanych fiszek musi istnieć tylko na frontendzie (brak persystencji)
RF-030: System musi wyświetlać podsumowanie po zakończeniu recenzji (zaakceptowane/odrzucone)

### 3.5 Manualne zarządzanie fiszkami

RF-031: System musi umożliwiać manualne utworzenie fiszki z polem front i back
RF-032: System musi umożliwiać wybór talii podczas tworzenia fiszki (nowa lub istniejąca)
RF-033: Fiszka może należeć tylko do jednej talii
RF-034: System musi wyświetlać wszystkie fiszki w ramach talii
RF-035: System musi umożliwiać inline editing fiszek w widoku talii (klik na tekst)
RF-036: System musi automatycznie zapisywać zmiany podczas edycji (autosave)
RF-037: System musi umożliwiać usunięcie pojedynczej fiszki
RF-038: Format fiszek jest wyłącznie tekstowy (bez obrazów, audio, formatowania)

### 3.6 Algorytm powtórek i sesja nauki

RF-039: System musi integrować otwarty algorytm spaced repetition (SM-2 lub prostszy)
RF-040: Użytkownik musi móc rozpocząć sesję nauki dla wybranej talii
RF-041: System musi wyświetlać jedną fiszkę na raz (tylko przód)
RF-042: Użytkownik musi móc odkryć odpowiedź (przycisk lub Spacja)
RF-043: Użytkownik musi móc ocenić trudność fiszki (Again, Hard, Good, Easy) przyciskami lub klawiszami 1-4
RF-044: System musi planować następną powtórkę na podstawie oceny trudności
RF-045: System musi wyświetlać licznik pozostałych fiszek w sesji
RF-046: System musi wyświetlać podsumowanie po zakończeniu sesji (liczba przejrzanych, czas, statystyki)
RF-047: System musi zapisywać historię powtórek dla każdej fiszki

### 3.7 Skróty klawiszowe

RF-048: System musi obsługiwać Spacja = odkryj odpowiedź (sesja nauki)
RF-049: System musi obsługiwać 1-4 = ocena trudności (sesja nauki)
RF-050: System musi obsługiwać Enter = akceptuj fiszkę (recenzja AI)
RF-051: System musi obsługiwać E = edytuj fiszkę (recenzja AI)
RF-052: System musi obsługiwać Delete = odrzuć fiszkę (recenzja AI)
RF-053: System musi obsługiwać Tab = następna fiszka (recenzja AI)
RF-054: System musi obsługiwać ? = wyświetl listę wszystkich skrótów klawiszowych
RF-055: Skróty klawiszowe nie mogą kolidować z domyślnymi skrótami przeglądarki

### 3.8 Bezpieczeństwo i walidacja

RF-056: System musi walidować wszystkie dane wejściowe przy użyciu Zod schemas
RF-057: System musi implementować rate limiting na endpointach AI
RF-058: System musi przechowywać API keys tylko w zmiennych środowiskowych backendu
RF-059: System musi walidować długość tekstu po stronie backendu (100-5000 znaków)
RF-060: System musi zapobiegać SQL injection przez użycie prepared statements
RF-061: System musi zapobiegać XSS przez sanityzację danych wejściowych

### 3.9 Tracking i analityka

RF-062: System musi logować źródło każdej fiszki (AI vs manual)
RF-063: System musi logować każdą akcję podczas recenzji (akceptuj/edytuj/odrzuć)
RF-064: System musi zapisywać timestamp utworzenia fiszki
RF-065: System musi zapisywać timestamp ostatniej edycji fiszki
RF-066: System musi umożliwiać obliczenie metryk sukcesu (acceptance rate, usage rate)

## 4. Granice produktu

### 4.1 Co NIE wchodzi w zakres MVP

Poza zakresem MVP:
- Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
- Import wielu formatów plików (PDF, DOCX, PPT, itp.)
- Współdzielenie zestawów fiszek między użytkownikami
- Publiczne biblioteki fiszek
- Integracje z innymi platformami edukacyjnymi (Notion, Google Classroom, itp.)
- Aplikacje mobilne (iOS, Android)
- Wsparcie dla obrazów, audio, video w fiszkach
- Formatowanie tekstu (bold, italic, highlights)
- Zaawansowane typy fiszek (cloze deletion, multiple choice, matching)
- Gamifikacja (punkty, osiągnięcia, rankingi)
- Współpraca zespołowa (shared decks, collaborative editing)
- Export do Anki lub innych platform
- Offline mode
- Statystyki zaawansowane (wykresy postępu, heatmapy)
- Limity użytkowania i płatności
- Tagi i zaawansowana kategoryzacja
- Wyszukiwanie full-text w fiszkach
- Zagnieżdżone talie (podfoldery)
- API publiczne dla integracji zewnętrznych
- Obsługa wielu języków interfejsu (tylko angielski lub polski w MVP)

### 4.2 Ograniczenia techniczne

- Maksymalna długość tekstu wejściowego: 5000 znaków
- Minimalna długość tekstu wejściowego: 100 znaków
- Format fiszek: wyłącznie tekstowy (plain text)
- Struktura organizacji: 2-poziomowa (Talie → Fiszki), bez zagnieżdżania
- Jeden użytkownik = jedna talia per fiszka (brak fiszek w wielu taliach)
- Provider AI: Google Gemini (bez możliwości wyboru innego providera w MVP)
- Platforma: Web only (brak aplikacji natywnych)

### 4.3 Założenia użytkownika

- Użytkownik zna koncepcję fiszek i spaced repetition
- Użytkownik nie wymaga obszernego tutoriala
- Użytkownik doceni skróty klawiszowe dla efektywności
- Użytkownik ma dostęp do stabilnego połączenia internetowego
- Użytkownik korzysta z nowoczesnej przeglądarki (Chrome, Firefox, Safari, Edge)

## 5. Historyjki użytkowników

### Autentykacja i konta

US-001: Rejestracja nowego użytkownika
Jako nowy użytkownik
Chcę zarejestrować konto przy użyciu email i hasła
Aby móc zapisywać swoje fiszki i talie

Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, hasło, potwierdzenie hasła
- System waliduje format email (RFC 5322)
- System wymaga hasła o długości minimum 8 znaków
- System wymaga zgodności hasła z potwierdzeniem hasła
- System wyświetla komunikaty o błędach walidacji
- Po udanej rejestracji użytkownik jest automatycznie zalogowany
- Po udanej rejestracji użytkownik jest przekierowany do pustego dashboardu
- System zapobiega rejestracji z istniejącym emailem
- System szyfruje hasło przed zapisem w bazie (bcrypt/Argon2)

US-002: Logowanie istniejącego użytkownika
Jako zarejestrowany użytkownik
Chcę zalogować się do swojego konta
Aby uzyskać dostęp do moich fiszek i talii

Kryteria akceptacji:
- Formularz logowania zawiera pola: email, hasło
- System waliduje format email
- System wyświetla komunikat o błędzie przy niepoprawnych danych
- System nie ujawnia czy błąd dotyczy email czy hasła (bezpieczeństwo)
- Po udanym logowaniu użytkownik jest przekierowany do dashboardu
- System zapamiętuje sesję użytkownika (token/cookie)
- Sesja wygasa po określonym czasie (np. 7 dni)

US-003: Wylogowanie użytkownika
Jako zalogowany użytkownik
Chcę wylogować się z aplikacji
Aby zabezpieczyć swoje konto na współdzielonym urządzeniu

Kryteria akceptacji:
- Przycisk wylogowania jest widoczny w nawigacji/menu użytkownika
- Po kliknięciu wylogowania sesja jest natychmiast zakończona
- Po wylogowaniu użytkownik jest przekierowany do strony logowania
- Token/cookie sesyjny jest usuwany
- Próba dostępu do chronionych stron po wylogowaniu przekierowuje do logowania

### Zarządzanie taliami

US-004: Utworzenie nowej talii
Jako użytkownik
Chcę utworzyć nową talię fiszek
Aby organizować materiały według tematów

Kryteria akceptacji:
- Przycisk "Utwórz talię" jest widoczny na dashboardzie
- Po kliknięciu wyświetla się formularz z polem nazwy talii
- Nazwa talii jest wymagana (min 1, max 100 znaków)
- Po zapisaniu talia pojawia się na liście talii użytkownika
- Nowa talia jest pusta (0 fiszek)
- System wyświetla komunikat potwierdzający utworzenie
- System zapisuje timestamp utworzenia talii

US-005: Wyświetlanie listy talii
Jako użytkownik
Chcę widzieć listę wszystkich moich talii
Aby wybrać talię do nauki lub edycji

Kryteria akceptacji:
- Dashboard wyświetla wszystkie talie użytkownika
- Każda talia pokazuje: nazwę, liczbę fiszek, liczbę fiszek do powtórki
- Talie są sortowane alfabetycznie (lub po dacie utworzenia)
- Pusta lista wyświetla komunikat zachęcający do utworzenia pierwszej talii
- Każda talia ma przyciski akcji: otwórz, edytuj nazwę, usuń
- Kliknięcie w talię otwiera widok fiszek w tej talii

US-006: Edycja nazwy talii
Jako użytkownik
Chcę zmienić nazwę istniejącej talii
Aby lepiej odzwierciedlała aktualną zawartość

Kryteria akceptacji:
- Przycisk edycji jest widoczny przy każdej talii
- Po kliknięciu nazwa talii staje się edytowalna (inline editing)
- Zmiana jest zapisywana automatycznie po opuszczeniu pola (autosave)
- System waliduje nazwę (min 1, max 100 znaków)
- System wyświetla komunikat o błędzie walidacji
- Anulowanie edycji (Esc) przywraca poprzednią nazwę

US-007: Usunięcie talii
Jako użytkownik
Chcę usunąć talię, której już nie potrzebuję
Aby utrzymać porządek w moich materiałach

Kryteria akceptacji:
- Przycisk usuń jest widoczny przy każdej talii
- System wyświetla modal potwierdzenia przed usunięciem
- Modal informuje o liczbie fiszek, które zostaną usunięte
- Użytkownik musi potwierdzić usunięcie
- Po potwierdzeniu talia i wszystkie jej fiszki są usuwane z bazy
- System wyświetla komunikat potwierdzający usunięcie
- Lista talii jest automatycznie odświeżana

### Manualne tworzenie fiszek

US-008: Utworzenie fiszki manualnie
Jako użytkownik
Chcę ręcznie utworzyć fiszkę
Aby dodać własne pytanie i odpowiedź

Kryteria akceptacji:
- Przycisk "Dodaj fiszkę" jest widoczny w widoku talii i na dashboardzie
- Formularz zawiera pola: front (pytanie), back (odpowiedź), wybór talii
- Oba pola front i back są wymagane (min 1 znak, max 1000 znaków)
- Użytkownik może wybrać istniejącą talię z dropdown lub utworzyć nową
- Tworzenie nowej talii z poziomu formularza jest możliwe
- Po zapisaniu fiszka pojawia się w wybranej talii
- System wyświetla komunikat potwierdzający utworzenie
- System zapisuje źródło fiszki jako "manual" i timestamp utworzenia

US-009: Edycja istniejącej fiszki
Jako użytkownik
Chcę edytować treść fiszki
Aby poprawić błędy lub zaktualizować informacje

Kryteria akceptacji:
- W widoku talii kliknięcie na tekst fiszki włącza tryb edycji (inline)
- Tryb edycji pozwala na edycję zarówno front jak i back
- Zmiany są zapisywane automatycznie po opuszczeniu pola (autosave)
- System waliduje długość (min 1, max 1000 znaków)
- System wyświetla komunikat o błędzie walidacji
- System zapisuje timestamp ostatniej edycji
- Anulowanie edycji (Esc) przywraca poprzednią treść

US-010: Usunięcie pojedynczej fiszki
Jako użytkownik
Chcę usunąć fiszkę, której już nie potrzebuję
Aby utrzymać talię aktualną i przejrzystą

Kryteria akceptacji:
- Przycisk usuń jest widoczny przy każdej fiszce w widoku talii
- System wyświetla modal potwierdzenia przed usunięciem
- Użytkownik musi potwierdzić usunięcie
- Po potwierdzeniu fiszka jest usuwana z bazy
- System wyświetla komunikat potwierdzający usunięcie
- Historia powtórek dla tej fiszki jest również usuwana
- Lista fiszek jest automatycznie odświeżana

### Generowanie fiszek przez AI

US-011: Wprowadzenie tekstu do generowania
Jako użytkownik
Chcę wkleić tekst edukacyjny
Aby wygenerować z niego fiszki przez AI

Kryteria akceptacji:
- Przycisk "Generuj fiszki z AI" jest widoczny na dashboardzie
- Po kliknięciu wyświetla się formularz z textarea
- Textarea wyświetla licznik znaków w czasie rzeczywistym (current/max)
- System waliduje minimalną długość (100 znaków) i wyświetla komunikat
- System waliduje maksymalną długość (5000 znaków) i wyświetla komunikat
- Przycisk "Generuj" jest nieaktywny gdy tekst nie spełnia wymagań
- System wyświetla szacowaną liczbę fiszek (~1 na 250 znaków)
- Po kliknięciu "Generuj" system wysyła request do backend API

US-012: Generowanie fiszek przez backend
Jako system
Chcę wygenerować fiszki z tekstu przez Google Gemini API
Aby dostarczyć użytkownikowi propozycje fiszek

Kryteria akceptacji:
- Backend endpoint przyjmuje POST request z tekstem
- Backend waliduje długość tekstu (100-5000 znaków) - reject jeśli nieprawidłowy
- Backend używa konfigurowalnego prompt systemowego
- Backend wywołuje Google Gemini API (nie frontend)
- Backend parsuje odpowiedź JSON z kluczami 'front' i 'back'
- Backend zwraca listę wygenerowanych fiszek do frontendu
- Backend obsługuje błędy API (timeout, rate limit, server error)
- Backend implementuje rate limiting (np. max 10 requestów/minutę na użytkownika)
- Backend loguje request (user_id, timestamp, text_length, generated_count)

US-013: Wyświetlenie wygenerowanych fiszek do recenzji
Jako użytkownik
Chcę zobaczyć wszystkie wygenerowane fiszki
Aby przejrzeć je przed zapisaniem

Kryteria akceptacji:
- Po otrzymaniu fiszek system wyświetla interfejs recenzji
- Wszystkie fiszki są widoczne jako lista (lub jedna po drugiej)
- Każda fiszka pokazuje front i back
- Każda fiszka ma przyciski: Akceptuj, Edytuj, Odrzuć
- System wyświetla licznik: aktualna fiszka / total fiszek
- System wyświetla licznik: zaakceptowane / odrzucone
- Draft fiszek jest przechowywany tylko w state frontendu (React)
- Nie ma automatycznego zapisu w bazie danych na tym etapie

US-014: Akceptacja fiszki bez zmian
Jako użytkownik
Chcę zaakceptować fiszkę wygenerowaną przez AI
Aby zapisać ją do mojej talii bez modyfikacji

Kryteria akceptacji:
- Przycisk "Akceptuj" jest widoczny przy każdej fiszce
- Kliknięcie przycisku lub naciśnięcie Enter akceptuje fiszkę
- System wysyła pojedynczy POST request do backendu z treścią fiszki
- Request zawiera: front, back, deck_id, source='ai'
- Po zapisie fiszka znika z interfejsu recenzji lub jest oznaczona jako zaakceptowana
- Licznik zaakceptowanych jest aktualizowany
- System wyświetla krótki komunikat potwierdzający (toast)

US-015: Edycja i akceptacja fiszki
Jako użytkownik
Chcę zmodyfikować fiszkę wygenerowaną przez AI przed zapisaniem
Aby poprawić niedokładności lub dostosować do moich potrzeb

Kryteria akceptacji:
- Przycisk "Edytuj" jest widoczny przy każdej fiszce
- Kliknięcie przycisku lub naciśnięcie E włącza tryb edycji inline
- W trybie edycji pola front i back są edytowalne
- Przycisk "Akceptuj" zmienia się w "Zapisz" w trybie edycji
- Kliknięcie "Zapisz" lub Enter zapisuje zmodyfikowaną fiszkę
- System wysyła POST request z edytowaną treścią
- System loguje akcję jako "edited" (nie "accepted")
- Po zapisie fiszka znika z interfejsu recenzji
- Licznik zaakceptowanych jest aktualizowany

US-016: Odrzucenie fiszki
Jako użytkownik
Chcę odrzucić fiszkę wygenerowaną przez AI
Aby nie zapisywać fiszek niskiej jakości

Kryteria akceptacji:
- Przycisk "Odrzuć" jest widoczny przy każdej fiszce
- Kliknięcie przycisku lub naciśnięcie Delete odrzuca fiszkę
- Fiszka znika z interfejsu recenzji natychmiast
- Nie jest wysyłany żaden request do backendu (fiszka nie jest zapisywana)
- Licznik odrzuconych jest aktualizowany
- System loguje akcję odrzucenia w analytics (lokalnie, opcjonalnie w backend)

US-017: Nawigacja między fiszkami w recenzji
Jako użytkownik
Chcę poruszać się między fiszkami w interfejsie recenzji
Aby efektywnie przejrzeć wszystkie propozycje

Kryteria akceptacji:
- Naciśnięcie Tab przenosi do następnej fiszki w kolejce
- Naciśnięcie Shift+Tab przenosi do poprzedniej fiszki
- Strzałki w górę/dół również umożliwiają nawigację
- Aktualna fiszka jest wizualnie wyróżniona (highlight, border)
- Licznik pokazuje pozycję aktualnej fiszki (np. "3 / 12")
- Nawigacja działa zarówno w trybie normalnym jak i edycji

US-018: Wybór talii docelowej podczas recenzji
Jako użytkownik
Chcę wybrać do jakiej talii trafią zaakceptowane fiszki
Aby organizować fiszki według tematów

Kryteria akceptacji:
- Dropdown wyboru talii jest widoczny na górze interfejsu recenzji
- Dropdown zawiera wszystkie istniejące talie użytkownika
- Dropdown zawiera opcję "Utwórz nową talię"
- Wybór "Utwórz nową talię" wyświetla formularz z polem nazwy
- Nowa talia jest tworzona natychmiast po podaniu nazwy
- Wszystkie zaakceptowane fiszki są dodawane do wybranej talii
- System zapamiętuje ostatnio wybraną talię w sesji

US-019: Podsumowanie recenzji
Jako użytkownik
Chcę zobaczyć podsumowanie po zakończeniu recenzji fiszek
Aby wiedzieć ile fiszek zostało zapisanych

Kryteria akceptacji:
- Podsumowanie wyświetla się automatycznie po przeglądnięciu wszystkich fiszek
- Podsumowanie zawiera: liczbę zaakceptowanych, liczbę edytowanych, liczbę odrzuconych
- Podsumowanie zawiera nazwę talii, do której dodano fiszki
- Podsumowanie zawiera przycisk "Zamknij" i "Dodaj więcej fiszek"
- Przycisk "Zamknij" przekierowuje do widoku talii z nowymi fiszkami
- Przycisk "Dodaj więcej fiszek" otwiera ponownie formularz generowania

### Algorytm powtórek i sesja nauki

US-020: Rozpoczęcie sesji nauki
Jako użytkownik
Chcę rozpocząć sesję nauki dla wybranej talii
Aby powtórzyć materiał według algorytmu spaced repetition

Kryteria akceptacji:
- Przycisk "Rozpocznij naukę" jest widoczny przy każdej talii
- Przycisk pokazuje liczbę fiszek oczekujących na powtórkę
- Kliknięcie przycisku rozpoczyna sesję nauki
- Jeśli brak fiszek do powtórki, system wyświetla komunikat i nie rozpoczyna sesji
- Sesja ładuje fiszki według algorytmu SM-2 (kolejność priorytetowa)
- System wyświetla licznik pozostałych fiszek w sesji

US-021: Wyświetlenie fiszki w sesji nauki
Jako użytkownik
Chcę zobaczyć pytanie (front) fiszki
Aby spróbować odpowiedzieć przed odkryciem odpowiedzi

Kryteria akceptacji:
- Interfejs wyświetla jedną fiszkę na raz
- Początkowo widoczny jest tylko front (pytanie)
- Back (odpowiedź) jest ukryty
- Przycisk "Pokaż odpowiedź" jest widoczny i aktywny
- Licznik pokazuje postęp (np. "5 / 23 pozostało")
- Interfejs jest prosty i minimalistyczny (brak rozpraszaczy)

US-022: Odkrycie odpowiedzi
Jako użytkownik
Chcę odkryć odpowiedź (back) po przemyśleniu pytania
Aby sprawdzić czy moja odpowiedź była poprawna

Kryteria akceptacji:
- Kliknięcie "Pokaż odpowiedź" lub naciśnięcie Spacji odkrywa back
- Back wyświetla się płynnie (animacja fade-in)
- Przycisk "Pokaż odpowiedź" znika po odkryciu
- Przyciski oceny trudności stają się widoczne i aktywne
- Front pozostaje widoczny razem z back

US-023: Ocena trudności fiszki
Jako użytkownik
Chcę ocenić jak trudna była dla mnie fiszka
Aby algorytm zaplanował odpowiedni czas następnej powtórki

Kryteria akceptacji:
- Cztery przyciski oceny są widoczne: Again (1), Hard (2), Good (3), Easy (4)
- Przyciski mają różne kolory (czerwony, pomarańczowy, zielony, niebieski)
- Każdy przycisk pokazuje przewidywany czas do następnej powtórki (np. "< 10 min", "4 dni")
- Kliknięcie przycisku lub naciśnięcie klawisza 1-4 zapisuje ocenę
- System oblicza następną datę powtórki według algorytmu SM-2
- System zapisuje ocenę i czas powtórki w bazie danych
- System przechodzi do następnej fiszki lub kończy sesję (jeśli była ostatnia)
- Licznik pozostałych fiszek jest aktualizowany

US-024: Zakończenie sesji nauki
Jako użytkownik
Chcę zobaczyć podsumowanie po zakończeniu sesji nauki
Aby wiedzieć jaki był mój postęp

Kryteria akceptacji:
- Podsumowanie wyświetla się automatycznie po ocenie ostatniej fiszki
- Podsumowanie zawiera: liczbę przejrzanych fiszek, czas trwania sesji
- Podsumowanie zawiera rozkład ocen (ile Again, Hard, Good, Easy)
- Podsumowanie zawiera przycisk "Zakończ" i opcjonalnie "Powtórz ponownie"
- Przycisk "Zakończ" przekierowuje do dashboardu lub widoku talii
- System aktualizuje statystyki talii (ostatnia sesja, total sesji)

### Skróty klawiszowe

US-025: Wyświetlenie listy skrótów klawiszowych
Jako użytkownik
Chcę zobaczyć listę wszystkich dostępnych skrótów
Aby efektywniej korzystać z aplikacji

Kryteria akceptacji:
- Naciśnięcie ? (znak zapytania) wyświetla modal ze skrótami
- Modal zawiera wszystkie skróty pogrupowane według kontekstu (nauka, recenzja)
- Każdy skrót ma opis akcji, którą wykonuje
- Modal można zamknąć przez: kliknięcie X, kliknięcie poza modal, naciśnięcie Esc
- Link lub przycisk "?" jest widoczny w interfejsie (opcjonalnie)

US-026: Obsługa skrótów w sesji nauki
Jako użytkownik
Chcę używać klawiatury podczas sesji nauki
Aby szybciej przechodzić przez fiszki

Kryteria akceptacji:
- Spacja = odkryj odpowiedź (działa tylko gdy odpowiedź ukryta)
- 1 = ocena Again (działa tylko gdy odpowiedź odkryta)
- 2 = ocena Hard (działa tylko gdy odpowiedź odkryta)
- 3 = ocena Good (działa tylko gdy odpowiedź odkryta)
- 4 = ocena Easy (działa tylko gdy odpowiedź odkryta)
- Skróty nie kolidują z domyślnymi skrótami przeglądarki
- Skróty są wyłączone gdy użytkownik pisze w polu tekstowym

US-027: Obsługa skrótów w recenzji AI
Jako użytkownik
Chcę używać klawiatury podczas recenzji fiszek AI
Aby szybciej akceptować lub odrzucać fiszki

Kryteria akceptacji:
- Enter = akceptuj aktualną fiszkę
- E = włącz tryb edycji aktualnej fiszki
- Delete = odrzuć aktualną fiszkę
- Tab = przejdź do następnej fiszki
- Shift+Tab = przejdź do poprzedniej fiszki
- Esc = anuluj edycję (jeśli w trybie edycji)
- Skróty są wyłączone w trybie edycji (poza Esc)

### Bezpieczeństwo i obsługa błędów

US-028: Walidacja danych wejściowych
Jako system
Chcę walidować wszystkie dane wejściowe użytkownika
Aby zapobiec błędom i atakom bezpieczeństwa

Kryteria akceptacji:
- Wszystkie endpointy API używają Zod schemas do walidacji
- Walidacja odbywa się zarówno na frontendzie (UX) jak i backendzie (security)
- Błędy walidacji zwracają status 400 z opisem błędu
- Komunikaty błędów są czytelne dla użytkownika (nie techniczne)
- System sanityzuje dane wejściowe przed zapisem (XSS protection)
- System używa prepared statements (SQL injection protection)

US-029: Rate limiting dla AI endpoints
Jako system
Chcę ograniczyć liczbę requestów do AI API
Aby zapobiec nadużyciom i kontrolować koszty

Kryteria akceptacji:
- Endpoint generowania AI ma limit requestów na użytkownika (np. 10/minutę)
- Przekroczenie limitu zwraca status 429 (Too Many Requests)
- Komunikat błędu informuje użytkownika o limicie i czasie do resetu
- System loguje próby przekroczenia limitu
- Limity są konfigurowalne z poziomu kodu/env variables

US-030: Obsługa błędów API
Jako użytkownik
Chcę zobaczyć czytelny komunikat gdy wystąpi błąd
Aby wiedzieć co poszło nie tak i jak to naprawić

Kryteria akceptacji:
- Błędy sieciowe wyświetlają komunikat: "Problem z połączeniem. Spróbuj ponownie."
- Timeout API wyświetla komunikat: "Generowanie trwa zbyt długo. Spróbuj z krótszym tekstem."
- Błąd 500 serwera wyświetla komunikat: "Coś poszło nie tak. Spróbuj ponownie za chwilę."
- Błąd 429 rate limit wyświetla komunikat z czasem do następnej próby
- Wszystkie komunikaty błędów mają przycisk "Spróbuj ponownie"
- Błędy nie eksponują szczegółów technicznych (stack traces, etc.)

US-031: Ochrona API keys
Jako system
Chcę chronić API key Google Gemini
Aby zapobiec nieautoryzowanemu użyciu i wyciekowi danych

Kryteria akceptacji:
- API key jest przechowywany tylko w zmiennych środowiskowych backendu
- API key nie jest nigdy wysyłany do frontendu
- API key nie jest commitowany do repozytorium (w .gitignore)
- Wszystkie wywołania AI odbywają się przez backend endpoints
- Backend waliduje autentykację użytkownika przed wywołaniem AI
- Logi nie zawierają pełnego API key (tylko ostatnie 4 znaki)

### Analytics i metryki

US-032: Logowanie źródła fiszek
Jako system
Chcę zapisywać źródło każdej fiszki
Aby mierzyć współczynnik wykorzystania AI

Kryteria akceptacji:
- Każda fiszka w bazie ma pole source: 'ai' lub 'manual'
- Przy akceptacji fiszki z AI, source = 'ai'
- Przy manualnym utworzeniu, source = 'manual'
- System umożliwia query: count fiszek per source per user
- Dane są dostępne do obliczenia metryki: (AI fiszki / total fiszki) >= 75%

US-033: Logowanie akcji w recenzji
Jako system
Chcę zapisywać akcje użytkownika podczas recenzji AI
Aby mierzyć współczynnik akceptacji

Kryteria akceptacji:
- System loguje każdą akcję: accepted, edited, rejected
- Log zawiera: user_id, action_type, timestamp
- Przy edycji system zapisuje czy była to fiszka z AI (source)
- System umożliwia query: count akcji per type per user
- Dane są dostępne do obliczenia metryki: ((accepted + edited) / total_generated) >= 75%

US-034: Timestamp utworzenia i edycji
Jako system
Chcę zapisywać kiedy fiszka została utworzona i edytowana
Aby śledzić aktywność użytkownika

Kryteria akceptacji:
- Każda fiszka ma pole created_at (timestamp)
- Każda fiszka ma pole updated_at (timestamp, nullable)
- created_at jest ustawiane automatycznie przy INSERT
- updated_at jest aktualizowane automatycznie przy UPDATE
- System umożliwia query: fiszki utworzone w danym okresie
- System umożliwia query: ostatnio edytowane fiszki

## 6. Metryki sukcesu

### 6.1 Kluczowe wskaźniki efektywności (KPI)

KPI-001: Współczynnik akceptacji fiszek AI
Cel: >= 75%
Definicja: (liczba zaakceptowanych + liczba edytowanych) / liczba wygenerowanych
Sposób mierzenia:
- Logowanie każdej akcji w recenzji (accepted, edited, rejected) w tabeli ai_review_actions
- Query: SELECT (COUNT(accepted) + COUNT(edited)) / COUNT(*) FROM ai_review_actions WHERE user_id = X
- Dashboard w panelu admina lub analytics
- Agregacja per użytkownik, per sesja, globalnie
Częstotliwość: Cotygodniowy przegląd
Odpowiedzialność: Product Manager + Data Analyst

KPI-002: Współczynnik wykorzystania AI do tworzenia fiszek
Cel: >= 75%
Definicja: liczba fiszek źródło='ai' / liczba wszystkich fiszek
Sposób mierzenia:
- Pole source w tabeli flashcards ('ai' lub 'manual')
- Query: SELECT COUNT(*) WHERE source='ai' / COUNT(*) FROM flashcards WHERE user_id = X
- Dashboard w panelu admina lub analytics
- Agregacja per użytkownik, globalnie
Częstotliwość: Cotygodniowy przegląd
Odpowiedzialność: Product Manager + Data Analyst

### 6.2 Metryki użytkownika (User Metrics)

UM-001: Retention rate (7-day retention)
Cel: >= 40% użytkowników wraca w ciągu 7 dni
Sposób mierzenia: Liczba użytkowników z sesją w dniu X i sesją w dniu X+7 / liczba użytkowników w dniu X

UM-002: Daily Active Users (DAU)
Sposób mierzenia: Liczba unikalnych user_id z aktywnością (login, created flashcard, study session) w danym dniu

UM-003: Average session duration
Sposób mierzenia: Średni czas między login a logout (lub ostatnią aktywnością)

UM-004: Session frequency
Sposób mierzenia: Średnia liczba sesji nauki per użytkownik per tydzień

### 6.3 Metryki produktowe (Product Metrics)

PM-001: Średnia liczba fiszek per talia
Sposób mierzenia: COUNT(flashcards) / COUNT(DISTINCT deck_id)

PM-002: Średnia liczba talii per użytkownik
Sposób mierzenia: COUNT(decks) / COUNT(DISTINCT user_id)

PM-003: Średnia długość tekstu wejściowego do AI
Sposób mierzenia: AVG(LENGTH(input_text)) z logów generowania AI

PM-004: Średnia liczba fiszek wygenerowanych per request
Sposób mierzenia: AVG(generated_count) z logów generowania AI

PM-005: Procent edycji vs. akceptacji bez zmian
Sposób mierzenia: COUNT(edited) / (COUNT(accepted) + COUNT(edited)) z ai_review_actions

PM-006: Średni czas recenzji per fiszka
Sposób mierzenia: Timestamp różnica między view a action dla każdej fiszki w recenzji

### 6.4 Metryki techniczne (Technical Metrics)

TM-001: Availability (uptime)
Cel: >= 99.5%
Sposób mierzenia: Monitoring serwera (zewnętrzne narzędzie)

TM-002: API response time (p95)
Cel: <= 2000ms dla AI generation, <= 500ms dla CRUD operations
Sposób mierzenia: Logging czasu wykonania w backend + monitoring APM

TM-003: Error rate
Cel: <= 1% requestów kończy się błędem 5xx
Sposób mierzenia: Liczba 5xx responses / liczba total requests

TM-004: AI API success rate
Cel: >= 95%
Sposób mierzenia: Liczba udanych wywołań Gemini / liczba wszystkich prób

### 6.5 Metryki kosztowe (Cost Metrics)

CM-001: Koszt AI per użytkownik per miesiąc
Sposób mierzenia: Total koszt Gemini API / liczba aktywnych użytkowników w miesiącu

CM-002: Liczba AI requestów per użytkownik per miesiąc
Sposób mierzenia: COUNT(ai_generations) per user_id w danym miesiącu

### 6.6 Harmonogram mierzenia i raportowania

Cotygodniowy przegląd:
- KPI-001: Współczynnik akceptacji fiszek AI
- KPI-002: Współczynnik wykorzystania AI
- UM-001: Retention rate
- UM-002: DAU

Miesięczny przegląd:
- Wszystkie metryki użytkownika (UM-*)
- Wszystkie metryki produktowe (PM-*)
- Wszystkie metryki kosztowe (CM-*)
- Analiza trendów i rekomendacje

Ciągły monitoring:
- TM-001: Availability
- TM-002: Response time
- TM-003: Error rate
- TM-004: AI API success rate

### 6.7 Kryteria sukcesu MVP

Produkt uznajemy za sukces jeśli po 4 tygodniach od uruchomienia:
1. >= 75% fiszek wygenerowanych przez AI jest akceptowanych (KPI-001)
2. >= 75% fiszek tworzonych przez użytkowników pochodzi z AI (KPI-002)
3. >= 40% użytkowników wraca w ciągu 7 dni (UM-001)
4. Średnio >= 2 sesje nauki per użytkownik per tydzień (UM-004)
5. Error rate < 1% (TM-003)

Jeśli którykolwiek z powyższych kryteriów nie jest spełniony, przeprowadzamy analizę przyczyn i iterację produktu.
