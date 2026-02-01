# REST API Plan - AI Flashcards

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Auth | auth.users (Supabase) | User authentication and authorization |
| Profiles | profiles | Extended user data |
| Decks | decks | Flashcard decks owned by users |
| Flashcards | flashcards | Individual flashcards within decks |
| Study Sessions | review_sessions | Study session tracking |
| Reviews | review_history | Individual card review records |
| AI Generation | ai_generation_logs | AI generation request logs |
| AI Review Actions | ai_review_actions | User actions during AI card review |

---

## 2. Endpoints

### 2.1 Authentication

Authentication is handled by proxying Supabase Auth through our API endpoints. This prevents exposing Supabase credentials to the frontend.

#### Sign Up
- **Method:** `POST`
- **Path:** `/api/auth/signup`
- **Description:** Register a new user with email and password (proxies Supabase Auth)
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Validation:**
  - `email`: required, valid email format
  - `password`: required, minimum 8 characters
- **Success Response:** `200 OK`
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
- **Error Responses:**
  - `400 Bad Request` - Invalid email format or weak password
  - `422 Unprocessable Entity` - Email already registered
  - `500 Internal Server Error` - Supabase service error

#### Sign In
- **Method:** `POST`
- **Path:** `/api/auth/signin`
- **Description:** Authenticate existing user (proxies Supabase Auth)
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Validation:**
  - `email`: required, valid email format
  - `password`: required, string
- **Success Response:** `200 OK`
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
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Invalid credentials
  - `500 Internal Server Error` - Supabase service error

#### Sign Out
- **Method:** `POST`
- **Path:** `/api/auth/signout`
- **Description:** Invalidate user session (proxies Supabase Auth)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `500 Internal Server Error` - Supabase service error

#### Refresh Token
- **Method:** `POST`
- **Path:** `/api/auth/refresh`
- **Description:** Obtain new access token using refresh token
- **Request Body:**
```json
{
  "refresh_token": "..."
}
```
- **Validation:**
  - `refresh_token`: required, string
- **Success Response:** `200 OK`
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```
- **Error Responses:**
  - `400 Bad Request` - Missing refresh token
  - `401 Unauthorized` - Invalid or expired refresh token
  - `500 Internal Server Error` - Supabase service error

---

### 2.2 Decks

#### List Decks
- **Method:** `GET`
- **Path:** `/api/decks`
- **Description:** Retrieve all decks for authenticated user with flashcard counts
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (optional, default: 1) - Page number for pagination
  - `limit` (optional, default: 20, max: 100) - Items per page
- **Success Response:** `200 OK`
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
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token

#### Get Deck
- **Method:** `GET`
- **Path:** `/api/decks/:id`
- **Description:** Retrieve a specific deck with detailed statistics
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `200 OK`
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
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Deck does not exist or does not belong to user

#### Create Deck
- **Method:** `POST`
- **Path:** `/api/decks`
- **Description:** Create a new deck
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "name": "Spanish Vocabulary"
}
```
- **Validation:**
  - `name`: required, string, 1-100 characters
- **Success Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Spanish Vocabulary",
  "flashcard_count": 0,
  "due_count": 0,
  "created_at": "2026-02-01T12:00:00Z",
  "updated_at": "2026-02-01T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Missing or invalid token

#### Update Deck
- **Method:** `PATCH`
- **Path:** `/api/decks/:id`
- **Description:** Update deck name
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "name": "Updated Deck Name"
}
```
- **Validation:**
  - `name`: required, string, 1-100 characters
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Updated Deck Name",
  "flashcard_count": 45,
  "due_count": 12,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-01T12:30:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Deck does not exist or does not belong to user

#### Delete Deck
- **Method:** `DELETE`
- **Path:** `/api/decks/:id`
- **Description:** Delete deck and all associated flashcards (CASCADE)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Deck does not exist or does not belong to user

#### Get Due Cards for Deck
- **Method:** `GET`
- **Path:** `/api/decks/:id/due`
- **Description:** Retrieve flashcards due for review in a specific deck
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `limit` (optional, default: 20, max: 100) - Maximum cards to return
- **Success Response:** `200 OK`
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
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Deck does not exist or does not belong to user

---

### 2.3 Flashcards

#### List Flashcards
- **Method:** `GET`
- **Path:** `/api/flashcards`
- **Description:** Retrieve flashcards for authenticated user
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `deck_id` (optional) - Filter by deck ID
  - `source` (optional: 'ai' | 'manual') - Filter by source
  - `page` (optional, default: 1) - Page number
  - `limit` (optional, default: 20, max: 100) - Items per page
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "deck_name": "Spanish Vocabulary",
      "front": "¿Cómo estás?",
      "back": "How are you?",
      "source": "ai",
      "next_review_date": "2026-02-02T10:00:00Z",
      "created_at": "2026-01-20T15:30:00Z",
      "updated_at": "2026-01-20T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token

#### Get Flashcard
- **Method:** `GET`
- **Path:** `/api/flashcards/:id`
- **Description:** Retrieve a specific flashcard
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "deck_name": "Spanish Vocabulary",
  "front": "¿Cómo estás?",
  "back": "How are you?",
  "source": "ai",
  "next_review_date": "2026-02-02T10:00:00Z",
  "easiness_factor": 2.5,
  "interval": 1,
  "repetitions": 2,
  "last_reviewed_at": "2026-02-01T10:00:00Z",
  "created_at": "2026-01-20T15:30:00Z",
  "updated_at": "2026-01-20T15:30:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Flashcard does not exist or does not belong to user

#### Create Flashcard
- **Method:** `POST`
- **Path:** `/api/flashcards`
- **Description:** Create a new flashcard (manual or from AI review)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "deck_id": "uuid",
  "front": "¿Cómo estás?",
  "back": "How are you?",
  "source": "manual"
}
```
- **Validation:**
  - `deck_id`: required, UUID, must exist and belong to user
  - `front`: required, string, 1-1000 characters
  - `back`: required, string, 1-1000 characters
  - `source`: required, enum ('ai', 'manual')
- **Success Response:** `201 Created`
```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "¿Cómo estás?",
  "back": "How are you?",
  "source": "manual",
  "next_review_date": "2026-02-01T12:00:00Z",
  "easiness_factor": 2.5,
  "interval": 0,
  "repetitions": 0,
  "last_reviewed_at": null,
  "created_at": "2026-02-01T12:00:00Z",
  "updated_at": "2026-02-01T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Deck does not exist or does not belong to user

#### Update Flashcard
- **Method:** `PATCH`
- **Path:** `/api/flashcards/:id`
- **Description:** Update flashcard content (autosave for inline editing)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```
- **Validation:**
  - `front` (optional): string, 1-1000 characters
  - `back` (optional): string, 1-1000 characters
  - At least one field must be provided
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "Updated question",
  "back": "Updated answer",
  "source": "manual",
  "next_review_date": "2026-02-02T10:00:00Z",
  "created_at": "2026-01-20T15:30:00Z",
  "updated_at": "2026-02-01T12:30:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed or no fields provided
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Flashcard does not exist or does not belong to user

#### Delete Flashcard
- **Method:** `DELETE`
- **Path:** `/api/flashcards/:id`
- **Description:** Delete a flashcard and its review history (CASCADE)
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Flashcard does not exist or does not belong to user

---

### 2.4 AI Generation

#### Generate Flashcards
- **Method:** `POST`
- **Path:** `/api/ai/generate`
- **Description:** Generate flashcards from text using Google Gemini API
- **Headers:** `Authorization: Bearer <token>`
- **Rate Limit:** 10 requests per minute per user
- **Request Body:**
```json
{
  "text": "The Spanish verb 'estar' is used to describe temporary states and locations. For example, '¿Cómo estás?' means 'How are you?'",
  "language": "en"
}
```
- **Validation:**
  - `text`: required, string, 100-5000 characters
  - `language` (optional): string, ISO 639-1 code (default: 'en')
- **Success Response:** `200 OK`
```json
{
  "generation_log_id": "uuid",
  "flashcards": [
    {
      "front": "What is the Spanish verb 'estar' used for?",
      "back": "To describe temporary states and locations"
    },
    {
      "front": "What does '¿Cómo estás?' mean in English?",
      "back": "How are you?"
    }
  ],
  "count": 2,
  "estimated_count": 2
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed (text too short/long)
  - `401 Unauthorized` - Missing or invalid token
  - `429 Too Many Requests` - Rate limit exceeded
  - `500 Internal Server Error` - AI API error (timeout, unavailable)
  - `503 Service Unavailable` - AI service temporarily unavailable

---

### 2.5 AI Review Actions

#### Log Review Action
- **Method:** `POST`
- **Path:** `/api/ai/review-actions`
- **Description:** Log user action during AI-generated flashcard review
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "generation_log_id": "uuid",
  "flashcard_id": "uuid",
  "action_type": "edited",
  "original_front": "What is estar used for?",
  "original_back": "Temporary states",
  "edited_front": "What is the Spanish verb 'estar' used for?",
  "edited_back": "To describe temporary states and locations"
}
```
- **Validation:**
  - `generation_log_id`: required, UUID, must exist and belong to user
  - `flashcard_id`: optional (null for rejected), UUID
  - `action_type`: required, enum ('accepted', 'edited', 'rejected')
  - `original_front`: required, string, 1-1000 characters
  - `original_back`: required, string, 1-1000 characters
  - `edited_front`: required if action_type='edited', string, 1-1000 characters
  - `edited_back`: required if action_type='edited', string, 1-1000 characters
- **Success Response:** `201 Created`
```json
{
  "id": "uuid",
  "generation_log_id": "uuid",
  "flashcard_id": "uuid",
  "action_type": "edited",
  "created_at": "2026-02-01T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - generation_log_id does not exist or does not belong to user

---

### 2.6 Study Sessions

#### Create Study Session
- **Method:** `POST`
- **Path:** `/api/study-sessions`
- **Description:** Start a new study session for a deck
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "deck_id": "uuid"
}
```
- **Validation:**
  - `deck_id`: required, UUID, must exist and belong to user
- **Success Response:** `201 Created`
```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "started_at": "2026-02-01T12:00:00Z",
  "ended_at": null,
  "cards_reviewed": 0
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Deck does not exist or does not belong to user

#### Get Study Session
- **Method:** `GET`
- **Path:** `/api/study-sessions/:id`
- **Description:** Retrieve study session details
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "deck_name": "Spanish Vocabulary",
  "started_at": "2026-02-01T12:00:00Z",
  "ended_at": null,
  "cards_reviewed": 5
}
```
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Session does not exist or does not belong to user

#### Submit Review
- **Method:** `POST`
- **Path:** `/api/study-sessions/:sessionId/reviews`
- **Description:** Submit a flashcard review and update SM-2 algorithm state
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "flashcard_id": "uuid",
  "rating": 3,
  "response_time_ms": 4500
}
```
- **Validation:**
  - `flashcard_id`: required, UUID, must exist and belong to user
  - `rating`: required, integer, 1-4 (1=Again, 2=Hard, 3=Good, 4=Easy)
  - `response_time_ms` (optional): integer, >= 0
- **Success Response:** `200 OK`
```json
{
  "review_id": "uuid",
  "flashcard": {
    "id": "uuid",
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
- **Business Logic:**
  - Updates flashcard SM-2 algorithm fields based on rating
  - Creates review_history record
  - Increments session.cards_reviewed counter
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Session or flashcard does not exist or does not belong to user

#### Complete Study Session
- **Method:** `PATCH`
- **Path:** `/api/study-sessions/:id/complete`
- **Description:** Mark study session as completed
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "started_at": "2026-02-01T12:00:00Z",
  "ended_at": "2026-02-01T12:15:00Z",
  "cards_reviewed": 12,
  "duration_seconds": 900
}
```
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token
  - `404 Not Found` - Session does not exist or does not belong to user
  - `409 Conflict` - Session already completed

---

### 2.7 Analytics (Optional for MVP)

#### Get User Statistics
- **Method:** `GET`
- **Path:** `/api/analytics/stats`
- **Description:** Retrieve user-level statistics and KPIs
- **Headers:** `Authorization: Bearer <token>`
- **Success Response:** `200 OK`
```json
{
  "total_decks": 5,
  "total_flashcards": 247,
  "flashcards_by_source": {
    "ai": 185,
    "manual": 62
  },
  "ai_acceptance_rate": 0.78,
  "total_reviews": 1543,
  "study_streak_days": 12
}
```
- **Error Responses:**
  - `401 Unauthorized` - Missing or invalid token

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The application uses **Supabase Authentication** with JWT tokens.

**Flow:**
1. User signs up or signs in via Supabase Auth endpoints
2. Supabase returns an access token (JWT) and refresh token
3. Client stores tokens (localStorage or httpOnly cookie)
4. Client includes access token in `Authorization: Bearer <token>` header for all API requests
5. Backend middleware validates JWT and extracts `user_id` from `auth.uid()`
6. Token expires after 1 hour; client uses refresh token to obtain new access token

### 3.2 Authorization

**Row Level Security (RLS):**
- All database tables have RLS policies enabled
- Policies restrict access to rows where `user_id = auth.uid()`
- Backend uses authenticated Supabase client (with user JWT) for all operations
- No user can access another user's data

**Middleware:**
- All `/api/*` endpoints require valid JWT in Authorization header
- Middleware extracts and validates token before processing request
- Returns `401 Unauthorized` for missing/invalid tokens

### 3.3 Rate Limiting

- **AI Generation Endpoint:** 10 requests per minute per user_id
- Implemented using in-memory store (node-cache) or Redis
- Returns `429 Too Many Requests` when limit exceeded
- Response includes `Retry-After` header with seconds until limit resets

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

All request payloads are validated using **Zod schemas** before processing.

#### Deck Validation
```typescript
{
  name: z.string().min(1).max(100)
}
```

#### Flashcard Validation
```typescript
{
  deck_id: z.string().uuid(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
  source: z.enum(['ai', 'manual'])
}
```

#### AI Generation Validation
```typescript
{
  text: z.string().min(100).max(5000),
  language: z.string().regex(/^[a-z]{2}$/).optional()
}
```

#### Review Validation
```typescript
{
  flashcard_id: z.string().uuid(),
  rating: z.number().int().min(1).max(4),
  response_time_ms: z.number().int().min(0).optional()
}
```

#### AI Review Action Validation
```typescript
{
  generation_log_id: z.string().uuid(),
  flashcard_id: z.string().uuid().nullable(),
  action_type: z.enum(['accepted', 'edited', 'rejected']),
  original_front: z.string().min(1).max(1000),
  original_back: z.string().min(1).max(1000),
  edited_front: z.string().min(1).max(1000).optional(),
  edited_back: z.string().min(1).max(1000).optional()
}
// Custom validation: if action_type === 'edited', edited_front and edited_back are required
```

### 4.2 Business Logic

#### SM-2 Algorithm (Spaced Repetition)

Implemented in `POST /api/study-sessions/:id/reviews` endpoint:

```
Rating mappings:
- 1 (Again): q=0
- 2 (Hard): q=3
- 3 (Good): q=4
- 4 (Easy): q=5

For rating < 3 (Again/Hard):
  repetitions = 0
  interval = 1
  
For rating >= 3 (Good/Easy):
  if repetitions === 0:
    interval = 1
  else if repetitions === 1:
    interval = 6
  else:
    interval = interval * easiness_factor
  repetitions += 1

easiness_factor = max(1.3, easiness_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
next_review_date = now + interval days
```

#### AI Flashcard Generation

Implemented in `POST /api/ai/generate` endpoint:

**Process:**
1. Validate input text (100-5000 characters)
2. Check rate limit (10 requests/minute per user)
3. Call Google Gemini API with configured system prompt
4. Parse JSON response with structure: `[{ front: string, back: string }]`
5. Create `ai_generation_logs` record
6. Return draft flashcards (not saved to database yet)
7. Client handles review process (accept/edit/reject)
8. Accepted cards are saved via `POST /api/flashcards` with `source='ai'`
9. All actions logged via `POST /api/ai/review-actions`

**Expected Output:**
- ~1 flashcard per 250 characters of input
- Minimum 1 flashcard, maximum 20 flashcards per generation

#### Deck Statistics

Calculated in `GET /api/decks` and `GET /api/decks/:id`:

```sql
flashcard_count: COUNT(flashcards WHERE deck_id = ?)
due_count: COUNT(flashcards WHERE deck_id = ? AND next_review_date <= NOW())
new_count: COUNT(flashcards WHERE deck_id = ? AND repetitions = 0)
```

#### KPI Calculations

**AI Acceptance Rate:**
```sql
(COUNT(ai_review_actions WHERE action_type IN ('accepted', 'edited')) / 
 COUNT(ai_review_actions)) * 100
```

**AI Usage Rate:**
```sql
(COUNT(flashcards WHERE source = 'ai') / 
 COUNT(flashcards)) * 100
```

### 4.3 Error Handling

**Standard Error Response Format:**
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

**Error Codes:**
- `VALIDATION_ERROR` - Request validation failed (400)
- `UNAUTHORIZED` - Missing or invalid authentication (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource does not exist (404)
- `CONFLICT` - Resource conflict (409)
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `AI_SERVICE_ERROR` - External AI service error (500)
- `INTERNAL_ERROR` - Unexpected server error (500)

### 4.4 Pagination

List endpoints (`GET /api/decks`, `GET /api/flashcards`) support pagination:

**Query Parameters:**
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 20, min: 1, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 247,
    "total_pages": 13
  }
}
```

---

## 5. Additional Considerations

### 5.1 CORS

- Backend allows requests from frontend domain (e.g., `https://app.aiflashcards.com`)
- Preflight requests (`OPTIONS`) return appropriate headers
- Credentials (cookies) are allowed if needed for session management

### 5.2 Content-Type

- All endpoints accept `Content-Type: application/json`
- All endpoints return `Content-Type: application/json` (except 204 No Content)

### 5.3 Idempotency

- `POST` endpoints are not idempotent (create new resources)
- `PUT/PATCH` endpoints are idempotent (same request produces same result)
- `DELETE` endpoints are idempotent (deleting non-existent resource returns 404, but multiple deletes of same ID produce same state)
- `GET` endpoints are safe and idempotent

### 5.4 Versioning

- MVP uses unversioned endpoints (`/api/...`)
- Future versions can introduce `/api/v2/...` while maintaining `/api/...` (v1) for backward compatibility

### 5.5 Logging

All endpoints log:
- Request method, path, user_id
- Response status code
- Response time (ms)
- Errors with stack traces (server-side only)

Sensitive data (passwords, tokens) is never logged.

---

## 6. Implementation Notes

### 6.1 Tech Stack Integration

**Astro:**
- API endpoints defined in `src/pages/api/` directory
- Each endpoint is a `.ts` file exporting HTTP method handlers (GET, POST, PATCH, DELETE)
- Use `export const prerender = false` for all API routes

**Supabase:**
- Import Supabase client from `src/db/supabase.client.ts`
- Use `context.locals.supabase` in Astro routes (authenticated client)
- RLS policies enforce data isolation automatically

**Zod:**
- Define validation schemas in `src/types.ts` or co-located with endpoints
- Use `.safeParse()` to validate request bodies
- Return 400 with formatted Zod errors on validation failure

**Google Gemini API:**
- API key stored in `.env` as `GOOGLE_GEMINI_API_KEY`
- Service module in `src/lib/services/ai.service.ts`
- Handles retries, timeouts, and error mapping

### 6.2 Example Endpoint Structure

```typescript
// src/pages/api/decks/index.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const createDeckSchema = z.object({
  name: z.string().min(1).max(100),
});

export const GET: APIRoute = async ({ locals }) => {
  const { data, error } = await locals.supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ data }), { status: 200 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const validation = createDeckSchema.safeParse(body);

  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: { code: 'VALIDATION_ERROR', details: validation.error.issues } }),
      { status: 400 }
    );
  }

  const { data, error } = await locals.supabase
    .from('decks')
    .insert({ name: validation.data.name })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

- Test validation schemas with valid/invalid inputs
- Test SM-2 algorithm calculations
- Test utility functions in services

### 7.2 Integration Tests

- Test each API endpoint with authenticated requests
- Verify RLS policies prevent cross-user data access
- Test rate limiting behavior
- Test AI generation with mocked Gemini API

### 7.3 E2E Tests

- Full user flows (signup → create deck → generate flashcards → study session)
- Test frontend-backend integration
- Test error scenarios (network failures, invalid tokens)

---

## 8. Future Enhancements (Post-MVP)

- **Batch Operations:** `POST /api/flashcards/batch` to create multiple cards at once
- **Search:** `GET /api/flashcards/search?q=query` for full-text search
- **Exports:** `GET /api/decks/:id/export?format=json|csv|anki`
- **Webhooks:** Notify external services of events (deck created, study session completed)
- **GraphQL:** Alternative to REST for complex queries with nested data
- **WebSocket:** Real-time updates for collaborative features (future scope)
