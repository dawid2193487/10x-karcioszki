# API Endpoint Implementation Plan: Generate Flashcards from Text

## 1. Przegląd punktu końcowego

Endpoint `POST /api/ai/generate` umożliwia użytkownikom generowanie fiszek z dowolnego tekstu przy użyciu Google Gemini API. Jest to kluczowa funkcjonalność aplikacji, która pozwala na automatyczne tworzenie materiałów do nauki z artykułów, notatek czy innych źródeł tekstowych.

**Główne cele:**
- Akceptowanie tekstu źródłowego od użytkownika
- Wysyłanie zapytania do Google Gemini API z odpowiednim promptem
- Parsowanie odpowiedzi AI i zwracanie listy wygenerowanych fiszek (jako draft)
- Rejestrowanie operacji generowania w bazie danych dla celów analitycznych
- Ochrona przed nadużyciami poprzez rate limiting (10 req/min)

**Kluczowe założenia:**
- Endpoint zwraca fiszki jako draft - nie zapisuje ich automatycznie do bazy
- Użytkownik może zaakceptować, edytować lub odrzucić wygenerowane fiszki w UI
- Każda operacja generowania jest logowana dla metryk KPI

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
```
/api/ai/generate
```

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Parametry

#### Request Body (JSON)
**Wymagane:**
- `text` (string): Tekst źródłowy do generowania fiszek
  - Minimum: 100 znaków
  - Maximum: 5000 znaków
  - Format: dowolny tekst (artykuł, notatki, definicje, itp.)

**Opcjonalne:**
- `language` (string): Kod języka ISO 639-1
  - Format: dwuliterowy kod (np. 'en', 'pl', 'es')
  - Domyślnie: 'en'
  - Walidacja: regex `/^[a-z]{2}$/`

#### Przykład Request Body
```json
{
  "text": "The Spanish verb 'estar' is used to describe temporary states and locations. For example, '¿Cómo estás?' means 'How are you?'. Unlike 'ser', which describes permanent characteristics, 'estar' focuses on conditions that can change.",
  "language": "en"
}
```

## 3. Wykorzystywane typy

### DTOs i Command Models (z types.ts)

#### Request
```typescript
GenerateFlashcardsCommand {
  text: string;
  language?: string;
}
```

#### Response
```typescript
GenerateFlashcardsResponseDTO {
  generation_log_id: string;
  flashcards: GeneratedFlashcardDTO[];
  count: number;
  estimated_count: number;
}

GeneratedFlashcardDTO {
  front: string;
  back: string;
}
```

#### Database
```typescript
AiGenerationLogInsert {
  user_id: string;
  input_text: string;
  input_length: number;
  generated_count: number;
  created_at?: string; // auto-generated
}
```

#### Error Handling
```typescript
ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  }
}

type ErrorCode = 
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "AI_SERVICE_ERROR"
  | "INTERNAL_ERROR";
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)
```json
{
  "generation_log_id": "550e8400-e29b-41d4-a716-446655440000",
  "flashcards": [
    {
      "front": "What is the Spanish verb 'estar' used for?",
      "back": "To describe temporary states and locations"
    },
    {
      "front": "What does '¿Cómo estás?' mean in English?",
      "back": "How are you?"
    },
    {
      "front": "What is the main difference between 'estar' and 'ser'?",
      "back": "'Estar' describes temporary conditions that can change, while 'ser' describes permanent characteristics"
    }
  ],
  "count": 3,
  "estimated_count": 3
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "text",
        "message": "Text must be between 100 and 5000 characters"
      }
    ]
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

#### 429 Too Many Requests
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 10 requests per minute allowed."
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to generate flashcards. Please try again."
  }
}
```

#### 503 Service Unavailable
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

## 5. Przepływ danych

### Diagram przepływu
```
1. Client Request
   ↓
2. Astro Middleware (Authentication)
   ↓
3. Route Handler (POST /api/ai/generate)
   ↓
4. Rate Limiter Check
   ↓
5. Zod Validation (Request Body)
   ↓
6. AI Flashcard Generator Service
   ├─→ 6a. Format Prompt for Gemini
   ├─→ 6b. Call Gemini API
   ├─→ 6c. Parse AI Response
   └─→ 6d. Extract Flashcards
   ↓
7. AI Generation Log Service
   └─→ Save to ai_generation_logs table
   ↓
8. Format Response DTO
   ↓
9. Return 200 OK with flashcards
```

### Szczegółowy opis kroków

#### 1. Autoryzacja (Middleware)
- Weryfikacja tokenu Bearer w header Authorization
- Pobranie user_id z Supabase auth
- Odrzucenie żądania jeśli brak/nieprawidłowy token (401)

#### 2. Rate Limiting
- Sprawdzenie liczby żądań dla user_id w ostatniej minucie
- Implementacja: in-memory cache z TTL 60s lub Redis
- Odrzucenie żądania jeśli limit przekroczony (429)

#### 3. Walidacja danych wejściowych (Zod)
```typescript
const schema = z.object({
  text: z.string()
    .min(100, "Text must be at least 100 characters")
    .max(5000, "Text must not exceed 5000 characters"),
  language: z.string()
    .regex(/^[a-z]{2}$/, "Invalid language code")
    .optional()
    .default('en')
});
```

#### 4. Generowanie fiszek (AI Service)
- Przygotowanie prompta dla Gemini API:
  ```
  You are an expert flashcard creator. Generate educational flashcards from the following text.
  
  Instructions:
  - Create clear, concise question-answer pairs
  - Focus on key concepts and facts
  - Front: Ask a specific question
  - Back: Provide a clear, complete answer
  - Generate 2-5 flashcards depending on content complexity
  
  Input language: {language}
  Text: {text}
  
  Return ONLY a JSON array of objects with "front" and "back" properties.
  ```

- Wywołanie Gemini API:
  ```typescript
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': import.meta.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  });
  ```

- Parsowanie odpowiedzi:
  - Wyciągnięcie tekstu z response.candidates[0].content.parts[0].text
  - Parse JSON do GeneratedFlashcardDTO[]
  - Walidacja struktury (każdy obiekt musi mieć front i back)
  - Fallback jeśli parsowanie się nie uda

#### 5. Logowanie do bazy danych
```typescript
const logData: AiGenerationLogInsert = {
  user_id: userId,
  input_text: validatedInput.text,
  input_length: validatedInput.text.length,
  generated_count: flashcards.length
};

const { data, error } = await supabase
  .from('ai_generation_logs')
  .insert(logData)
  .select('id')
  .single();
```

#### 6. Formatowanie odpowiedzi
```typescript
const response: GenerateFlashcardsResponseDTO = {
  generation_log_id: logData.id,
  flashcards: flashcards,
  count: flashcards.length,
  estimated_count: flashcards.length
};
```

## 6. Względy bezpieczeństwa

### 1. Autoryzacja
- **Implementacja:** Middleware Astro weryfikuje token Bearer
- **Źródło user_id:** `context.locals.supabase.auth.getUser()`
- **Ochrona:** Każde żądanie wymaga poprawnego tokenu sesji
- **Błąd:** 401 Unauthorized jeśli brak/nieprawidłowy token

### 2. Rate Limiting
- **Limit:** 10 żądań na minutę na użytkownika
- **Identyfikacja:** Na podstawie user_id z tokenu
- **Implementacja:** 
  ```typescript
  // In-memory cache with TTL
  const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
  
  function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitCache.get(userId);
    
    if (!userLimit || now > userLimit.resetAt) {
      rateLimitCache.set(userId, { count: 1, resetAt: now + 60000 });
      return true;
    }
    
    if (userLimit.count >= 10) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }
  ```
- **Błąd:** 429 Too Many Requests
- **Headers w odpowiedzi:**
  ```
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 7
  X-RateLimit-Reset: 1643725200
  ```

### 3. Walidacja danych wejściowych
- **Biblioteka:** Zod
- **Walidacje:**
  - `text`: długość 100-5000 znaków (zapobiega spamowi i nadużyciom)
  - `language`: format ISO 639-1 (tylko małe litery, dokładnie 2 znaki)
- **Sanityzacja:** Trim whitespace, escape HTML jeśli potrzebne
- **Błąd:** 400 Bad Request z szczegółami walidacji

### 4. API Key Security
- **Przechowywanie:** Gemini API key w zmiennej środowiskowej
- **Dostęp:** `import.meta.env.GEMINI_API_KEY`
- **Nigdy:** Nie wysyłać API key do klienta
- **Walidacja:** Sprawdzenie czy klucz istnieje przy starcie aplikacji

### 5. Prompt Injection Protection
- **Zagrożenie:** Użytkownik może próbować manipulować promptem AI
- **Ochrona:**
  - Jasne oddzielenie instrukcji systemowych od input użytkownika
  - Użycie structured output (JSON) zamiast free-form text
  - Walidacja formatu odpowiedzi AI
  - Filtrowanie potencjalnie niebezpiecznych znaków

### 6. SQL Injection Prevention
- **Ochrona:** Używanie Supabase client z parametryzowanymi zapytaniami
- **Praktyka:** Nigdy nie konstruować SQL string ręcznie

### 7. Data Privacy
- **RODO:** Tekst wejściowy jest zapisywany w bazie (ai_generation_logs)
- **Retencja:** Rozważyć automatyczne usuwanie starych logów (np. po 90 dniach)
- **Zgodność:** Informować użytkowników o przetwarzaniu danych

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi

#### 1. Błędy walidacji (400 Bad Request)

**Przypadek: Tekst zbyt krótki**
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "text",
        "message": "Text must be at least 100 characters"
      }
    ]
  }
}
```

**Przypadek: Tekst zbyt długi**
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "text",
        "message": "Text must not exceed 5000 characters"
      }
    ]
  }
}
```

**Przypadek: Nieprawidłowy kod języka**
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "language",
        "message": "Invalid language code. Use ISO 639-1 format (e.g., 'en', 'pl')"
      }
    ]
  }
}
```

**Implementacja:**
```typescript
try {
  const validatedData = schema.parse(await request.json());
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    }), { status: 400 });
  }
}
```

#### 2. Błędy autoryzacji (401 Unauthorized)

**Przypadek: Brak tokenu**
```typescript
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authentication token"
  }
}
```

**Przypadek: Nieprawidłowy token**
```typescript
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

**Implementacja:**
```typescript
const { data: { user }, error } = await context.locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(JSON.stringify({
    error: {
      code: "UNAUTHORIZED",
      message: "Missing or invalid authentication token"
    }
  }), { status: 401 });
}
```

#### 3. Błędy rate limiting (429 Too Many Requests)

```typescript
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 10 requests per minute allowed. Please try again in 45 seconds."
  }
}
```

**Implementacja:**
```typescript
const rateLimitOk = checkRateLimit(user.id);

if (!rateLimitOk) {
  const resetAt = getRateLimitReset(user.id);
  const waitSeconds = Math.ceil((resetAt - Date.now()) / 1000);
  
  return new Response(JSON.stringify({
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: `Rate limit exceeded. Maximum 10 requests per minute allowed. Please try again in ${waitSeconds} seconds.`
    }
  }), { 
    status: 429,
    headers: {
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetAt.toString(),
      'Retry-After': waitSeconds.toString()
    }
  });
}
```

#### 4. Błędy AI Service (500/503)

**Przypadek: Timeout Gemini API**
```typescript
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service request timed out. Please try again with shorter text."
  }
}
```

**Przypadek: Błąd parsowania odpowiedzi AI**
```typescript
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to parse AI response. Please try again."
  }
}
```

**Przypadek: API niedostępne**
```typescript
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

**Implementacja:**
```typescript
try {
  const flashcards = await aiFlashcardGenerator.generate(text, language);
} catch (error) {
  console.error('AI generation error:', error);
  
  if (error instanceof TimeoutError) {
    return new Response(JSON.stringify({
      error: {
        code: "AI_SERVICE_ERROR",
        message: "AI service request timed out. Please try again with shorter text."
      }
    }), { status: 500 });
  }
  
  if (error instanceof NetworkError) {
    return new Response(JSON.stringify({
      error: {
        code: "AI_SERVICE_ERROR",
        message: "AI service is temporarily unavailable. Please try again later."
      }
    }), { status: 503 });
  }
  
  // Generic error
  return new Response(JSON.stringify({
    error: {
      code: "AI_SERVICE_ERROR",
      message: "Failed to generate flashcards. Please try again."
    }
  }), { status: 500 });
}
```

#### 5. Błędy bazy danych (500)

**Przypadek: Błąd zapisu logu**
```typescript
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to save generation log. Please try again."
  }
}
```

**Implementacja:**
```typescript
const { data: log, error: logError } = await supabase
  .from('ai_generation_logs')
  .insert(logData)
  .select('id')
  .single();

if (logError) {
  console.error('Database error:', logError);
  return new Response(JSON.stringify({
    error: {
      code: "INTERNAL_ERROR",
      message: "Failed to save generation log. Please try again."
    }
  }), { status: 500 });
}
```

### Error Logging Strategy

Wszystkie błędy powinny być logowane z odpowiednim poziomem szczegółowości:

```typescript
// Error logger helper
function logError(context: string, error: unknown, metadata?: object) {
  console.error(`[${context}]`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

// Przykład użycia
logError('AI_GENERATION', error, {
  userId: user.id,
  textLength: text.length,
  language: language
});
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Gemini API Response Time
- **Problem:** Generowanie fiszek przez AI może trwać 2-10 sekund
- **Wpływ:** Długi czas odpowiedzi dla użytkownika
- **Rozwiązanie:**
  - Timeout 30 sekund dla API call
  - Loading state w UI z informacją o procesie
  - Optymalizacja prompta dla szybszych odpowiedzi
  - Rozważyć async processing dla bardzo długich tekstów

#### 2. Rate Limiting Implementation
- **Problem:** In-memory cache nie skaluje się w środowisku multi-instance
- **Rozwiązanie krótkoterminowe:** In-memory Map z TTL
- **Rozwiązanie długoterminowe:** Redis dla distributed rate limiting
  ```typescript
  // Redis implementation
  async function checkRateLimitRedis(userId: string): Promise<boolean> {
    const key = `ratelimit:ai-generate:${userId}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, 60);
    }
    
    return current <= 10;
  }
  ```

#### 3. Database Writes
- **Problem:** Każde żądanie zapisuje do ai_generation_logs
- **Wpływ:** Potencjalnie wolne zapisy przy dużym ruchu
- **Rozwiązanie:**
  - Indeksowanie na user_id i created_at dla analytics queries
  - Archiwizacja starych logów (np. po 90 dniach)
  - Monitoring database performance

#### 4. Prompt Size vs Quality
- **Balans:** Dłuższy prompt = lepsza jakość fiszek, ale wolniejsza odpowiedź
- **Optymalizacja:**
  - Testowanie różnych długości promptów
  - A/B testing na jakości output
  - Monitorowanie średniego czasu odpowiedzi

### Strategie optymalizacji

#### 1. Caching
```typescript
// Cache dla często używanych tekstów (opcjonalne)
const generationCache = new LRU<string, GenerateFlashcardsResponseDTO>({
  max: 100,
  ttl: 1000 * 60 * 60 // 1 godzina
});

// Użycie hash tekstu jako klucz
const cacheKey = createHash('sha256').update(text).digest('hex');
const cached = generationCache.get(cacheKey);

if (cached) {
  return new Response(JSON.stringify(cached), { status: 200 });
}
```

#### 2. Streaming Response (przyszła optymalizacja)
```typescript
// Przyszła wersja: streaming fiszek po kolei
async function* streamFlashcards(text: string, language: string) {
  // Generate i yield fiszki jedna po drugiej
  // Pozwala na szybszy first paint w UI
}
```

#### 3. Monitoring i Metryki
```typescript
// Zbieranie metryk wydajności
const metrics = {
  aiResponseTime: 0,
  dbWriteTime: 0,
  totalTime: 0,
  flashcardsCount: 0
};

// Użycie dla alertów jeśli czas przekroczy próg
if (metrics.aiResponseTime > 10000) {
  console.warn('Slow AI response detected', metrics);
}
```

#### 4. Graceful Degradation
```typescript
// Fallback jeśli AI nie odpowiada
const TIMEOUT = 30000;

const flashcardsPromise = aiFlashcardGenerator.generate(text, language);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new TimeoutError()), TIMEOUT)
);

try {
  const flashcards = await Promise.race([flashcardsPromise, timeoutPromise]);
} catch (error) {
  // Return user-friendly error
}
```

## 9. Kroki implementacji

### Faza 1: Setup i infrastruktura (45 min)

#### 1.1 Utworzenie struktury plików
```bash
src/
├── pages/
│   └── api/
│       └── ai/
│           └── generate.ts          # API endpoint
├── lib/
│   ├── services/
│   │   ├── ai-flashcard-generator.service.ts
│   │   ├── ai-generation-log.service.ts
│   │   └── rate-limiter.service.ts
│   ├── schemas/
│   │   └── ai-generation.schema.ts  # Zod schemas
│   └── utils/
│       ├── error-handler.ts
│       └── gemini-client.ts
```

#### 1.2 Konfiguracja zmiennych środowiskowych
```env
# .env
GEMINI_API_KEY=your_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
```

#### 1.3 Instalacja zależności (jeśli potrzebne)
```bash
npm install zod
# Rate limiting: opcjonalnie redis
```

### Faza 2: Implementacja serwisów (90 min)

#### 2.1 Rate Limiter Service
```typescript
// src/lib/services/rate-limiter.service.ts

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

class RateLimiterService {
  private cache = new Map<string, RateLimitInfo>();
  
  constructor(private config: RateLimitConfig) {}
  
  check(userId: string): { 
    allowed: boolean; 
    remaining: number; 
    resetAt: number 
  } {
    const now = Date.now();
    const userLimit = this.cache.get(userId);
    
    // Reset if window expired
    if (!userLimit || now > userLimit.resetAt) {
      const resetAt = now + this.config.windowMs;
      this.cache.set(userId, { count: 1, resetAt });
      return { 
        allowed: true, 
        remaining: this.config.maxRequests - 1, 
        resetAt 
      };
    }
    
    // Check limit
    const allowed = userLimit.count < this.config.maxRequests;
    
    if (allowed) {
      userLimit.count++;
    }
    
    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - userLimit.count),
      resetAt: userLimit.resetAt
    };
  }
  
  cleanup() {
    const now = Date.now();
    for (const [userId, limit] of this.cache.entries()) {
      if (now > limit.resetAt) {
        this.cache.delete(userId);
      }
    }
  }
}

export const aiGenerationRateLimiter = new RateLimiterService({
  maxRequests: 10,
  windowMs: 60000 // 1 minute
});

// Cleanup expired entries every 5 minutes
setInterval(() => aiGenerationRateLimiter.cleanup(), 300000);
```

#### 2.2 Gemini Client Utility
```typescript
// src/lib/utils/gemini-client.ts

interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = import.meta.env.GEMINI_API_KEY;
    this.baseUrl = import.meta.env.GEMINI_API_URL || 
                   'https://generativelanguage.googleapis.com/v1beta';
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
  }
  
  async generateContent(request: GeminiRequest): Promise<string> {
    const url = `${this.baseUrl}/models/gemini-pro:generateContent`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: request.prompt }]
        }],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxOutputTokens ?? 2048
        }
      }),
      signal: AbortSignal.timeout(30000) // 30s timeout
    });
    
    if (!response.ok) {
      if (response.status === 503) {
        throw new ServiceUnavailableError('Gemini API is temporarily unavailable');
      }
      throw new GeminiApiError(`Gemini API error: ${response.statusText}`);
    }
    
    const data: GeminiResponse = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new GeminiApiError('Invalid response format from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  }
}

export class GeminiApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
```

#### 2.3 AI Flashcard Generator Service
```typescript
// src/lib/services/ai-flashcard-generator.service.ts

import type { GeneratedFlashcardDTO } from '@/types';
import { GeminiClient } from '@/lib/utils/gemini-client';

export class AiFlashcardGeneratorService {
  private geminiClient: GeminiClient;
  
  constructor() {
    this.geminiClient = new GeminiClient();
  }
  
  async generate(text: string, language: string = 'en'): Promise<GeneratedFlashcardDTO[]> {
    const prompt = this.buildPrompt(text, language);
    
    try {
      const responseText = await this.geminiClient.generateContent({
        prompt,
        temperature: 0.7,
        maxOutputTokens: 2048
      });
      
      return this.parseResponse(responseText);
    } catch (error) {
      console.error('AI generation failed:', error);
      throw error;
    }
  }
  
  private buildPrompt(text: string, language: string): string {
    return `You are an expert flashcard creator. Generate educational flashcards from the following text.

Instructions:
- Create clear, concise question-answer pairs
- Focus on key concepts, facts, and important details
- Front: Ask a specific, focused question
- Back: Provide a clear, complete answer
- Generate 2-5 flashcards depending on content complexity
- Questions should test understanding, not just memory

Input language: ${language}
Text to analyze:
"""
${text}
"""

Return ONLY a valid JSON array of objects with "front" and "back" properties.
Example format:
[
  {"front": "Question here?", "back": "Answer here"},
  {"front": "Another question?", "back": "Another answer"}
]`;
  }
  
  private parseResponse(responseText: string): GeneratedFlashcardDTO[] {
    // Extract JSON from response (AI might add markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    
    const flashcards = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!Array.isArray(flashcards)) {
      throw new Error('AI response is not an array');
    }
    
    const validated: GeneratedFlashcardDTO[] = flashcards
      .filter(card => 
        typeof card === 'object' &&
        typeof card.front === 'string' &&
        typeof card.back === 'string' &&
        card.front.trim().length > 0 &&
        card.back.trim().length > 0
      )
      .map(card => ({
        front: card.front.trim(),
        back: card.back.trim()
      }));
    
    if (validated.length === 0) {
      throw new Error('No valid flashcards in AI response');
    }
    
    return validated;
  }
}

export const aiFlashcardGenerator = new AiFlashcardGeneratorService();
```

#### 2.4 AI Generation Log Service
```typescript
// src/lib/services/ai-generation-log.service.ts

import type { SupabaseClient } from '@/db/supabase.client';
import type { AiGenerationLogInsert } from '@/types';

export class AiGenerationLogService {
  constructor(private supabase: SupabaseClient) {}
  
  async create(data: AiGenerationLogInsert): Promise<string> {
    const { data: log, error } = await this.supabase
      .from('ai_generation_logs')
      .insert({
        user_id: data.user_id,
        input_text: data.input_text,
        input_length: data.input_length,
        generated_count: data.generated_count
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create AI generation log:', error);
      throw new Error('Database error: Failed to save generation log');
    }
    
    return log.id;
  }
}
```

### Faza 3: Zod validation schema (15 min)

```typescript
// src/lib/schemas/ai-generation.schema.ts

import { z } from 'zod';

export const generateFlashcardsSchema = z.object({
  text: z.string()
    .min(100, 'Text must be at least 100 characters long')
    .max(5000, 'Text must not exceed 5000 characters'),
  language: z.string()
    .regex(/^[a-z]{2}$/, 'Language must be a valid ISO 639-1 code (e.g., "en", "pl")')
    .optional()
    .default('en')
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

### Faza 4: Error handling utilities (15 min)

```typescript
// src/lib/utils/error-handler.ts

import type { ErrorResponseDTO, ErrorCode } from '@/types';

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
  
  toResponse(): Response {
    const body: ErrorResponseDTO = {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    };
    
    return new Response(JSON.stringify(body), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return error.toResponse();
  }
  
  // Generic error
  return new ApiError(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    500
  ).toResponse();
}
```

### Faza 5: Implementacja API endpoint (60 min)

```typescript
// src/pages/api/ai/generate.ts

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { 
  GenerateFlashcardsCommand, 
  GenerateFlashcardsResponseDTO 
} from '@/types';
import { generateFlashcardsSchema } from '@/lib/schemas/ai-generation.schema';
import { aiFlashcardGenerator } from '@/lib/services/ai-flashcard-generator.service';
import { AiGenerationLogService } from '@/lib/services/ai-generation-log.service';
import { aiGenerationRateLimiter } from '@/lib/services/rate-limiter.service';
import { ApiError, handleApiError } from '@/lib/utils/error-handler';
import { GeminiApiError, ServiceUnavailableError } from '@/lib/utils/gemini-client';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // 1. Authentication
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    
    if (authError || !user) {
      throw new ApiError(
        'UNAUTHORIZED',
        'Missing or invalid authentication token',
        401
      );
    }
    
    // 2. Rate limiting
    const rateLimit = aiGenerationRateLimiter.check(user.id);
    
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      
      return new Response(JSON.stringify({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Maximum 10 requests per minute allowed. Please try again in ${waitSeconds} seconds.`
        }
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          'Retry-After': waitSeconds.toString()
        }
      });
    }
    
    // 3. Parse and validate request body
    let requestBody: GenerateFlashcardsCommand;
    
    try {
      const rawBody = await context.request.json();
      requestBody = generateFlashcardsSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(
          'VALIDATION_ERROR',
          'Invalid input data',
          400,
          error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        );
      }
      throw error;
    }
    
    // 4. Generate flashcards using AI
    let flashcards;
    
    try {
      flashcards = await aiFlashcardGenerator.generate(
        requestBody.text,
        requestBody.language
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw new ApiError(
          'AI_SERVICE_ERROR',
          'AI service is temporarily unavailable. Please try again later.',
          503
        );
      }
      
      if (error instanceof GeminiApiError) {
        throw new ApiError(
          'AI_SERVICE_ERROR',
          'Failed to generate flashcards. Please try again.',
          500
        );
      }
      
      // Timeout or network error
      throw new ApiError(
        'AI_SERVICE_ERROR',
        'AI service request timed out. Please try again with shorter text.',
        500
      );
    }
    
    // 5. Save generation log
    const logService = new AiGenerationLogService(context.locals.supabase);
    
    let generationLogId: string;
    
    try {
      generationLogId = await logService.create({
        user_id: user.id,
        input_text: requestBody.text,
        input_length: requestBody.text.length,
        generated_count: flashcards.length
      });
    } catch (error) {
      console.error('Failed to save generation log:', error);
      throw new ApiError(
        'INTERNAL_ERROR',
        'Failed to save generation log. Please try again.',
        500
      );
    }
    
    // 6. Format and return response
    const response: GenerateFlashcardsResponseDTO = {
      generation_log_id: generationLogId,
      flashcards: flashcards,
      count: flashcards.length,
      estimated_count: flashcards.length
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetAt.toString()
      }
    });
    
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Faza 6: Testing (45 min)

#### 6.1 Unit tests dla serwisów
```typescript
// tests/services/ai-flashcard-generator.test.ts

import { describe, it, expect, vi } from 'vitest';
import { AiFlashcardGeneratorService } from '@/lib/services/ai-flashcard-generator.service';

describe('AiFlashcardGeneratorService', () => {
  it('should generate flashcards from text', async () => {
    const service = new AiFlashcardGeneratorService();
    
    const result = await service.generate(
      'The Spanish verb "estar" is used for temporary states.',
      'en'
    );
    
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('front');
    expect(result[0]).toHaveProperty('back');
  });
  
  it('should handle AI errors gracefully', async () => {
    const service = new AiFlashcardGeneratorService();
    
    // Mock Gemini client to throw error
    vi.spyOn(service['geminiClient'], 'generateContent')
      .mockRejectedValue(new Error('API Error'));
    
    await expect(service.generate('test text', 'en'))
      .rejects.toThrow();
  });
});
```

#### 6.2 Integration tests
```typescript
// tests/api/ai/generate.test.ts

import { describe, it, expect } from 'vitest';

describe('POST /api/ai/generate', () => {
  it('should return 401 without auth token', async () => {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test text with more than 100 characters...',
        language: 'en'
      })
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should return 400 for invalid input', async () => {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        text: 'Too short',
        language: 'en'
      })
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
  
  // Więcej testów...
});
```

#### 6.3 Manual testing checklist
- [ ] Test z prawidłowymi danymi (200 OK)
- [ ] Test bez tokenu autoryzacji (401)
- [ ] Test z nieprawidłowym tokenem (401)
- [ ] Test z tekstem < 100 znaków (400)
- [ ] Test z tekstem > 5000 znaków (400)
- [ ] Test z nieprawidłowym kodem języka (400)
- [ ] Test rate limiting - 11 żądań w ciągu minuty (429)
- [ ] Test z różnymi językami (en, pl, es)
- [ ] Test z różnymi typami treści (definicje, fakty, przykłady)
- [ ] Test odpowiedzi AI - czy fiszki mają sens
- [ ] Test zapisu do ai_generation_logs
- [ ] Test performance - czas odpowiedzi < 10s

### Faza 7: Documentation i cleanup (30 min)

#### 7.1 API documentation update
Dodać endpoint do dokumentacji API w `README.md` lub `/docs/api.md`

#### 7.2 Code review checklist
- [ ] Wszystkie typy z types.ts są używane
- [ ] Walidacja zgodna ze specyfikacją
- [ ] Error handling dla wszystkich przypadków
- [ ] Rate limiting działa poprawnie
- [ ] Logging errors do console
- [ ] Security best practices (API key w env, no injection)
- [ ] Performance considerations (timeout, caching)
- [ ] Code follows project guidelines (copilot-instructions.md)

#### 7.3 Deployment considerations
```bash
# Przed deploymentem upewnić się:
# 1. GEMINI_API_KEY jest ustawiony w production env
# 2. Supabase RLS policies pozwalają na insert do ai_generation_logs
# 3. Rate limiter jest skonfigurowany (Redis w production?)
# 4. Monitoring i error tracking (Sentry?)
```

## 10. Podsumowanie

### Wymagane pliki do utworzenia/modyfikacji:

**Nowe pliki:**
1. `src/pages/api/ai/generate.ts` - główny endpoint
2. `src/lib/services/ai-flashcard-generator.service.ts` - AI generation logic
3. `src/lib/services/ai-generation-log.service.ts` - database logging
4. `src/lib/services/rate-limiter.service.ts` - rate limiting
5. `src/lib/utils/gemini-client.ts` - Gemini API wrapper
6. `src/lib/schemas/ai-generation.schema.ts` - Zod validation
7. `src/lib/utils/error-handler.ts` - error utilities

**Istniejące pliki:**
- `src/types.ts` - typy już zdefiniowane ✅
- `.env` - dodać GEMINI_API_KEY

### Szacowany czas implementacji:
- **Faza 1:** Setup - 45 min
- **Faza 2:** Services - 90 min
- **Faza 3:** Validation - 15 min
- **Faza 4:** Error handling - 15 min
- **Faza 5:** API endpoint - 60 min
- **Faza 6:** Testing - 45 min
- **Faza 7:** Documentation - 30 min

**Total: ~5 godzin**

### Kluczowe punkty uwagi:
1. ✅ Wszystkie typy są już zdefiniowane w types.ts
2. ✅ Walidacja zgodna ze specyfikacją (100-5000 znaków)
3. ✅ Rate limiting 10 req/min per user
4. ✅ Proper error handling dla wszystkich przypadków
5. ✅ Security: API key w env, auth middleware, input validation
6. ⚠️ Rate limiter: in-memory dla start, rozważyć Redis w przyszłości
7. ⚠️ Monitoring: dodać metryki wydajności w przyszłości
