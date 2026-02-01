# API Endpoint Implementation Plan: Flashcard Management

## 1. Endpoint Overview

This implementation plan covers five REST API endpoints for managing flashcards in the spaced repetition system:

- **GET /api/flashcards** - List flashcards with filtering and pagination
- **GET /api/flashcards/:id** - Retrieve detailed information about a specific flashcard
- **POST /api/flashcards** - Create a new flashcard (manual or from AI review)
- **PATCH /api/flashcards/:id** - Update flashcard content (autosave for inline editing)
- **DELETE /api/flashcards/:id** - Delete a flashcard and its associated review history

All endpoints require authentication and enforce user ownership of flashcards. The implementation follows Astro 5 server-side rendering patterns with Supabase backend integration.

## 2. Request Details

### 2.1 GET /api/flashcards

**Purpose:** Retrieve a paginated, filtered list of flashcards for the authenticated user.

**HTTP Method:** GET

**URL Structure:** `/api/flashcards`

**Authentication:** Required (Bearer token via Astro session)

**Query Parameters:**
- `deck_id` (optional) - UUID string, filter flashcards by specific deck
- `source` (optional) - Enum: 'ai' | 'manual', filter by creation source
- `page` (optional, default: 1) - Integer >= 1, page number for pagination
- `limit` (optional, default: 20, max: 100) - Integer 1-100, items per page

**Request Body:** None

**Example Request:**
```
GET /api/flashcards?deck_id=123e4567-e89b-12d3-a456-426614174000&source=ai&page=1&limit=20
Authorization: Bearer <session-token>
```

### 2.2 GET /api/flashcards/:id

**Purpose:** Retrieve detailed information about a specific flashcard including SM-2 algorithm state.

**HTTP Method:** GET

**URL Structure:** `/api/flashcards/:id`

**Authentication:** Required

**Path Parameters:**
- `id` (required) - UUID string, flashcard identifier

**Query Parameters:** None

**Request Body:** None

**Example Request:**
```
GET /api/flashcards/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <session-token>
```

### 2.3 POST /api/flashcards

**Purpose:** Create a new flashcard manually or after reviewing AI-generated content.

**HTTP Method:** POST

**URL Structure:** `/api/flashcards`

**Authentication:** Required

**Path Parameters:** None

**Query Parameters:** None

**Request Body:**
```json
{
  "deck_id": "uuid",
  "front": "Question text",
  "back": "Answer text",
  "source": "manual" | "ai"
}
```

**Validation Rules:**
- `deck_id`: Required, valid UUID, must exist and belong to authenticated user
- `front`: Required, string, length 1-1000 characters
- `back`: Required, string, length 1-1000 characters
- `source`: Required, enum value ('ai' or 'manual')

**Example Request:**
```json
POST /api/flashcards
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "deck_id": "123e4567-e89b-12d3-a456-426614174000",
  "front": "¿Cómo estás?",
  "back": "How are you?",
  "source": "ai"
}
```

### 2.4 PATCH /api/flashcards/:id

**Purpose:** Update flashcard content with autosave functionality for inline editing.

**HTTP Method:** PATCH

**URL Structure:** `/api/flashcards/:id`

**Authentication:** Required

**Path Parameters:**
- `id` (required) - UUID string, flashcard identifier

**Query Parameters:** None

**Request Body:**
```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```

**Validation Rules:**
- At least one field (`front` or `back`) must be provided
- `front` (optional): String, length 1-1000 characters
- `back` (optional): String, length 1-1000 characters
- Flashcard must exist and belong to authenticated user

**Example Request:**
```json
PATCH /api/flashcards/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "front": "Updated question text"
}
```

### 2.5 DELETE /api/flashcards/:id

**Purpose:** Delete a flashcard and all associated review history (CASCADE).

**HTTP Method:** DELETE

**URL Structure:** `/api/flashcards/:id`

**Authentication:** Required

**Path Parameters:**
- `id` (required) - UUID string, flashcard identifier

**Query Parameters:** None

**Request Body:** None

**Example Request:**
```
DELETE /api/flashcards/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <session-token>
```

## 3. Types Used

### 3.1 DTOs (Data Transfer Objects)

**FlashcardListItemDTO** - Used in GET /api/flashcards response
```typescript
interface FlashcardListItemDTO {
  id: string;
  deck_id: string;
  deck_name: string;
  front: string;
  back: string;
  source: FlashcardSource;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}
```

**FlashcardDetailDTO** - Used in GET /api/flashcards/:id response
```typescript
interface FlashcardDetailDTO extends Omit<FlashcardListItemDTO, "deck_name"> {
  deck_name: string;
  easiness_factor: number | null;
  interval: number | null;
  repetitions: number | null;
  last_reviewed_at: string | null;
}
```

**FlashcardDTO** - Used in POST and PATCH responses
```typescript
interface FlashcardDTO {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source: FlashcardSource;
  next_review_date: string | null;
  easiness_factor: number | null;
  interval: number | null;
  repetitions: number | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**FlashcardListResponseDTO** - Paginated list response
```typescript
interface FlashcardListResponseDTO {
  data: FlashcardListItemDTO[];
  pagination: PaginationDTO;
}
```

**PaginationDTO** - Pagination metadata
```typescript
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

**ErrorResponseDTO** - Error response structure
```typescript
interface ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
}
```

### 3.2 Command Models

**CreateFlashcardCommand** - Used in POST /api/flashcards request
```typescript
interface CreateFlashcardCommand {
  deck_id: string;
  front: string;
  back: string;
  source: FlashcardSource;
}
```

**UpdateFlashcardCommand** - Used in PATCH /api/flashcards/:id request
```typescript
interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
}
```

### 3.3 Query Parameters

**FlashcardQueryParams** - Query parameters for listing
```typescript
interface FlashcardQueryParams extends PaginationQueryParams {
  deck_id?: string;
  source?: FlashcardSource;
}
```

### 3.4 Enums and Types

**FlashcardSource** - Source of flashcard creation
```typescript
type FlashcardSource = "ai" | "manual";
```

All types are already defined in `src/types.ts`.

## 4. Response Details

### 4.1 GET /api/flashcards

**Success Response: 200 OK**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "deck_id": "123e4567-e89b-12d3-a456-426614174001",
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

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token

### 4.2 GET /api/flashcards/:id

**Success Response: 200 OK**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "deck_id": "123e4567-e89b-12d3-a456-426614174001",
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

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard does not exist or does not belong to user

### 4.3 POST /api/flashcards

**Success Response: 201 Created**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "deck_id": "123e4567-e89b-12d3-a456-426614174001",
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

**Error Responses:**
- `400 Bad Request` - Validation failed
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed",
      "details": [
        {
          "field": "front",
          "message": "Front text must be between 1 and 1000 characters"
        }
      ]
    }
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Deck does not exist or does not belong to user
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Deck not found or does not belong to user"
    }
  }
  ```

### 4.4 PATCH /api/flashcards/:id

**Success Response: 200 OK**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "deck_id": "123e4567-e89b-12d3-a456-426614174001",
  "front": "Updated question",
  "back": "Updated answer",
  "source": "manual",
  "next_review_date": "2026-02-02T10:00:00Z",
  "easiness_factor": 2.5,
  "interval": 1,
  "repetitions": 2,
  "last_reviewed_at": "2026-02-01T10:00:00Z",
  "created_at": "2026-01-20T15:30:00Z",
  "updated_at": "2026-02-01T12:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed or no fields provided
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "At least one field (front or back) must be provided"
    }
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard does not exist or does not belong to user

### 4.5 DELETE /api/flashcards/:id

**Success Response: 204 No Content**

No response body.

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard does not exist or does not belong to user

## 5. Data Flow

### 5.1 GET /api/flashcards - List Flashcards

```
1. Client Request
   ↓
2. Astro API Route Handler (src/pages/api/flashcards/index.ts)
   - Extract query parameters
   - Get authenticated user from context.locals.supabase
   ↓
3. Input Validation
   - Validate query parameters using Zod schema
   - Check pagination bounds (page >= 1, limit 1-100)
   - Validate UUIDs if deck_id provided
   - Validate source enum if provided
   ↓
4. FlashcardService.listFlashcards()
   ↓
5. Supabase Query
   - SELECT flashcards with JOIN to decks for deck_name
   - WHERE user_id = authenticated user
   - Apply filters (deck_id, source)
   - Apply pagination (LIMIT, OFFSET)
   - ORDER BY created_at DESC
   ↓
6. Count Query (for pagination)
   - SELECT COUNT(*) with same filters
   ↓
7. Transform to DTOs
   - Map database rows to FlashcardListItemDTO[]
   - Calculate pagination metadata
   ↓
8. Return Response
   - 200 OK with FlashcardListResponseDTO
```

### 5.2 GET /api/flashcards/:id - Get Flashcard

```
1. Client Request
   ↓
2. Astro API Route Handler (src/pages/api/flashcards/[id].ts)
   - Extract flashcard ID from path params
   - Get authenticated user from context.locals.supabase
   ↓
3. Input Validation
   - Validate UUID format
   ↓
4. FlashcardService.getFlashcardById()
   ↓
5. Supabase Query
   - SELECT flashcard with JOIN to decks
   - WHERE id = flashcard_id AND user_id = authenticated user
   ↓
6. Authorization Check
   - If not found → 404 Not Found
   ↓
7. Transform to DTO
   - Map to FlashcardDetailDTO with SM-2 fields
   ↓
8. Return Response
   - 200 OK with FlashcardDetailDTO
```

### 5.3 POST /api/flashcards - Create Flashcard

```
1. Client Request
   ↓
2. Astro API Route Handler (src/pages/api/flashcards/index.ts)
   - Parse JSON request body
   - Get authenticated user from context.locals.supabase
   ↓
3. Input Validation
   - Validate using Zod schema (CreateFlashcardCommand)
   - Check deck_id UUID format
   - Validate front/back length (1-1000 chars)
   - Validate source enum ('ai' | 'manual')
   ↓
4. Deck Ownership Verification
   - Query decks table: WHERE id = deck_id AND user_id = user_id
   - If not found → 404 Not Found (deck doesn't exist or doesn't belong to user)
   ↓
5. Rate Limiting (Optional)
   - Check rate limit for flashcard creation
   - If exceeded → 429 Rate Limit Exceeded
   ↓
6. FlashcardService.createFlashcard()
   ↓
7. Supabase INSERT
   - INSERT INTO flashcards (user_id, deck_id, front, back, source)
   - Default SM-2 values: easiness_factor=2.5, interval=0, repetitions=0
   - next_review_date = NOW() (available immediately for first review)
   - RETURNING *
   ↓
8. Transform to DTO
   - Map to FlashcardDTO
   ↓
9. Return Response
   - 201 Created with FlashcardDTO
```

### 5.4 PATCH /api/flashcards/:id - Update Flashcard

```
1. Client Request
   ↓
2. Astro API Route Handler (src/pages/api/flashcards/[id].ts)
   - Extract flashcard ID from path params
   - Parse JSON request body
   - Get authenticated user from context.locals.supabase
   ↓
3. Input Validation
   - Validate UUID format
   - Validate using Zod schema (UpdateFlashcardCommand)
   - Check at least one field provided
   - Validate front/back length if provided (1-1000 chars)
   ↓
4. FlashcardService.updateFlashcard()
   ↓
5. Supabase UPDATE
   - UPDATE flashcards SET front=?, back=?, updated_at=NOW()
   - WHERE id = flashcard_id AND user_id = authenticated user
   - RETURNING *
   ↓
6. Authorization Check
   - If no rows updated → 404 Not Found
   ↓
7. Transform to DTO
   - Map to FlashcardDTO
   ↓
8. Return Response
   - 200 OK with FlashcardDTO
```

### 5.5 DELETE /api/flashcards/:id - Delete Flashcard

```
1. Client Request
   ↓
2. Astro API Route Handler (src/pages/api/flashcards/[id].ts)
   - Extract flashcard ID from path params
   - Get authenticated user from context.locals.supabase
   ↓
3. Input Validation
   - Validate UUID format
   ↓
4. FlashcardService.deleteFlashcard()
   ↓
5. Supabase DELETE
   - DELETE FROM flashcards
   - WHERE id = flashcard_id AND user_id = authenticated user
   - CASCADE deletes review_history automatically
   ↓
6. Authorization Check
   - If no rows deleted → 404 Not Found
   ↓
7. Return Response
   - 204 No Content
```

## 6. Security Considerations

### 6.1 Authentication

- **Method:** Session-based authentication via Supabase
- **Implementation:** Use `context.locals.supabase.auth.getUser()` in Astro middleware
- **Token Source:** Bearer token from Authorization header or session cookie
- **Validation:** All endpoints must verify authenticated user exists
- **Error Handling:** Return 401 Unauthorized if authentication fails

### 6.2 Authorization

- **Ownership Verification:** All queries must include `WHERE user_id = authenticated_user_id`
- **Deck Access:** Before creating flashcard, verify deck belongs to user
- **RLS Policies:** Rely on Supabase Row Level Security as secondary defense
- **Cascading Deletes:** Database handles CASCADE on DELETE to prevent orphaned records

### 6.3 Input Validation

- **Zod Schemas:** Use strict validation for all inputs
- **UUID Validation:** Validate all UUID parameters to prevent injection
- **String Length:** Enforce 1-1000 character limits on front/back
- **Enum Validation:** Strictly validate source field ('ai' | 'manual')
- **Pagination Bounds:** Enforce page >= 1, limit 1-100
- **XSS Prevention:** Sanitization handled by React/Astro when rendering
- **SQL Injection:** Use Supabase parameterized queries (automatic)

### 6.4 Rate Limiting

- **Creation Endpoint:** Consider using `rate-limiter.service.ts` for POST /api/flashcards
- **Limits:** Define reasonable limits (e.g., 100 flashcards per hour per user)
- **Response:** Return 429 Rate Limit Exceeded with Retry-After header

### 6.5 Data Privacy

- **User Isolation:** Enforce user_id filtering on all queries
- **No Cross-User Access:** Never expose flashcards from other users
- **Sensitive Data:** No sensitive data in flashcards, but enforce ownership

### 6.6 CORS

- **Configuration:** Configure CORS in Astro middleware if needed
- **Origin Validation:** Validate request origins in production

## 7. Error Handling

### 7.1 Error Types and Status Codes

| Error Scenario | Status Code | Error Code | Example Message |
|----------------|-------------|------------|-----------------|
| Missing authentication | 401 | UNAUTHORIZED | "Authentication required. Please log in." |
| Invalid authentication | 401 | UNAUTHORIZED | "Invalid or expired session." |
| Validation failed | 400 | VALIDATION_ERROR | "Validation failed" (with details array) |
| No fields in PATCH | 400 | VALIDATION_ERROR | "At least one field must be provided" |
| Flashcard not found | 404 | NOT_FOUND | "Flashcard not found or does not belong to user" |
| Deck not found | 404 | NOT_FOUND | "Deck not found or does not belong to user" |
| Rate limit exceeded | 429 | RATE_LIMIT_EXCEEDED | "Too many requests. Please try again later." |
| Database error | 500 | INTERNAL_ERROR | "An unexpected error occurred" |

### 7.2 Error Response Format

All errors follow the `ErrorResponseDTO` structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front text must be between 1 and 1000 characters"
      }
    ]
  }
}
```

### 7.3 Error Handling Strategy

1. **Use Error Handler Utility**
   - Leverage `src/lib/utils/error-handler.ts`
   - Use `ApiError` class for consistent error throwing
   - Use `handleApiError()` to format error responses

2. **Validation Errors**
   - Catch Zod validation errors
   - Transform to ErrorResponseDTO with details array
   - Return 400 Bad Request

3. **Authentication Errors**
   - Check for missing or invalid session early
   - Return 401 Unauthorized immediately
   - Log authentication failures

4. **Authorization Errors**
   - Return 404 Not Found for owned resources (don't leak existence)
   - Avoid 403 Forbidden to prevent information disclosure

5. **Database Errors**
   - Catch Supabase errors
   - Log full error details server-side
   - Return generic 500 Internal Error to client
   - Do not expose database schema or query details

6. **Rate Limiting Errors**
   - Return 429 with Retry-After header
   - Include clear message about retry timing

### 7.4 Logging

- **Error Logging:** Log all errors server-side with full stack traces
- **Request Logging:** Log failed requests with user ID, endpoint, timestamp
- **Sensitive Data:** Never log passwords, tokens, or sensitive user data
- **Log Levels:** Use appropriate levels (ERROR for failures, WARN for rate limits)

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes:**
- Ensure index on `flashcards(user_id)` for user filtering
- Ensure index on `flashcards(deck_id)` for deck filtering
- Ensure index on `flashcards(user_id, deck_id)` composite index
- Ensure index on `flashcards(source)` for source filtering
- Ensure index on `flashcards(created_at)` for sorting

**Query Optimization:**
- Use `SELECT` with specific columns instead of `SELECT *` where possible
- Use JOIN instead of multiple queries for deck_name
- Use pagination to limit result sets
- Consider using Supabase `.maybeSingle()` for single row queries

**Connection Pooling:**
- Use Supabase connection pooling (already configured)
- Avoid creating multiple Supabase clients

### 8.2 Caching Strategy

**Client-Side:**
- Use React Query or SWR for client-side caching
- Cache flashcard lists with stale-while-revalidate
- Invalidate cache on create/update/delete

**Server-Side:**
- Consider Redis for high-traffic scenarios (future optimization)
- Cache deck ownership verification (short TTL)

**HTTP Caching:**
- Use `Cache-Control: no-cache` for authenticated endpoints
- Use ETags for conditional requests (GET endpoints)

### 8.3 Pagination

- **Default Limit:** 20 items per page
- **Max Limit:** 100 items per page to prevent large payloads
- **Offset-Based:** Use LIMIT/OFFSET for simplicity
- **Cursor-Based:** Consider cursor-based pagination for large datasets (future)
- **Total Count:** Include total count for UI pagination controls

### 8.4 Response Size

- **Minimize Payload:** Return only necessary fields in list endpoints
- **Compression:** Enable gzip/brotli compression in Astro config
- **Partial Responses:** Consider field selection query params (future)

### 8.5 Rate Limiting

- **Implementation:** Use `rate-limiter.service.ts`
- **Limits:** Configure per-user limits for creation
- **Storage:** Use in-memory store or Redis for distributed systems
- **Bypass:** Consider bypassing for premium users

### 8.6 Monitoring

- **Metrics:** Track response times, error rates, throughput
- **Alerts:** Set up alerts for high error rates or slow queries
- **APM:** Consider Application Performance Monitoring tools
- **Database:** Monitor Supabase query performance

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/schemas/flashcard.schema.ts`

```typescript
import { z } from "zod";

// Query parameters validation
export const flashcardQueryParamsSchema = z.object({
  deck_id: z.string().uuid().optional(),
  source: z.enum(["ai", "manual"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Create flashcard validation
export const createFlashcardSchema = z.object({
  deck_id: z.string().uuid(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
  source: z.enum(["ai", "manual"]),
});

// Update flashcard validation
export const updateFlashcardSchema = z.object({
  front: z.string().min(1).max(1000).optional(),
  back: z.string().min(1).max(1000).optional(),
}).refine((data) => data.front !== undefined || data.back !== undefined, {
  message: "At least one field (front or back) must be provided",
});

// UUID path parameter validation
export const uuidParamSchema = z.string().uuid();
```

### Step 2: Create Flashcard Service

**File:** `src/lib/services/flashcard.service.ts`

Implement the following methods:

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  FlashcardListItemDTO,
  FlashcardDetailDTO,
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  FlashcardQueryParams,
  PaginationDTO,
} from "@/types";

export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List flashcards with filtering and pagination
   */
  async listFlashcards(
    userId: string,
    filters: FlashcardQueryParams
  ): Promise<{
    data: FlashcardListItemDTO[];
    pagination: PaginationDTO;
  }> {
    // Build query with filters
    // JOIN decks for deck_name
    // Apply pagination
    // Execute count query
    // Return data and pagination
  }

  /**
   * Get single flashcard by ID
   */
  async getFlashcardById(
    flashcardId: string,
    userId: string
  ): Promise<FlashcardDetailDTO | null> {
    // SELECT with JOIN to decks
    // WHERE id AND user_id
    // Return FlashcardDetailDTO or null
  }

  /**
   * Create new flashcard
   */
  async createFlashcard(
    userId: string,
    command: CreateFlashcardCommand
  ): Promise<FlashcardDTO> {
    // INSERT with default SM-2 values
    // RETURNING *
    // Return FlashcardDTO
  }

  /**
   * Update flashcard content
   */
  async updateFlashcard(
    flashcardId: string,
    userId: string,
    command: UpdateFlashcardCommand
  ): Promise<FlashcardDTO | null> {
    // UPDATE with partial data
    // WHERE id AND user_id
    // RETURNING *
    // Return FlashcardDTO or null
  }

  /**
   * Delete flashcard
   */
  async deleteFlashcard(
    flashcardId: string,
    userId: string
  ): Promise<boolean> {
    // DELETE WHERE id AND user_id
    // Return true if deleted, false if not found
  }

  /**
   * Verify deck ownership (helper for create)
   */
  async verifyDeckOwnership(
    deckId: string,
    userId: string
  ): Promise<boolean> {
    // SELECT from decks WHERE id AND user_id
    // Return boolean
  }
}
```

### Step 3: Create API Route for List and Create

**File:** `src/pages/api/flashcards/index.ts`

```typescript
import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { flashcardQueryParamsSchema, createFlashcardSchema } from "@/lib/schemas/flashcard.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

// GET /api/flashcards - List flashcards
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authentication
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Authentication required. Please log in.", "UNAUTHORIZED", 401);
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      deck_id: url.searchParams.get("deck_id") || undefined,
      source: url.searchParams.get("source") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validatedParams = flashcardQueryParamsSchema.parse(queryParams);

    // 3. Service call
    const flashcardService = new FlashcardService(locals.supabase);
    const result = await flashcardService.listFlashcards(user.id, validatedParams);

    // 4. Return response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/flashcards - Create flashcard
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authentication
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Authentication required. Please log in.", "UNAUTHORIZED", 401);
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedCommand = createFlashcardSchema.parse(body);

    // 3. Verify deck ownership
    const flashcardService = new FlashcardService(locals.supabase);
    const deckExists = await flashcardService.verifyDeckOwnership(
      validatedCommand.deck_id,
      user.id
    );

    if (!deckExists) {
      throw new ApiError(
        "Deck not found or does not belong to user",
        "NOT_FOUND",
        404
      );
    }

    // 4. Create flashcard
    const flashcard = await flashcardService.createFlashcard(user.id, validatedCommand);

    // 5. Return response
    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Step 4: Create API Route for Get, Update, Delete

**File:** `src/pages/api/flashcards/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { FlashcardService } from "@/lib/services/flashcard.service";
import { updateFlashcardSchema, uuidParamSchema } from "@/lib/schemas/flashcard.schema";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

// GET /api/flashcards/:id - Get flashcard
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Authentication required. Please log in.", "UNAUTHORIZED", 401);
    }

    // 2. Validate UUID
    const flashcardId = uuidParamSchema.parse(params.id);

    // 3. Service call
    const flashcardService = new FlashcardService(locals.supabase);
    const flashcard = await flashcardService.getFlashcardById(flashcardId, user.id);

    if (!flashcard) {
      throw new ApiError(
        "Flashcard not found or does not belong to user",
        "NOT_FOUND",
        404
      );
    }

    // 4. Return response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// PATCH /api/flashcards/:id - Update flashcard
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Authentication
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Authentication required. Please log in.", "UNAUTHORIZED", 401);
    }

    // 2. Validate UUID
    const flashcardId = uuidParamSchema.parse(params.id);

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedCommand = updateFlashcardSchema.parse(body);

    // 4. Service call
    const flashcardService = new FlashcardService(locals.supabase);
    const flashcard = await flashcardService.updateFlashcard(
      flashcardId,
      user.id,
      validatedCommand
    );

    if (!flashcard) {
      throw new ApiError(
        "Flashcard not found or does not belong to user",
        "NOT_FOUND",
        404
      );
    }

    // 5. Return response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/flashcards/:id - Delete flashcard
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authentication
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Authentication required. Please log in.", "UNAUTHORIZED", 401);
    }

    // 2. Validate UUID
    const flashcardId = uuidParamSchema.parse(params.id);

    // 3. Service call
    const flashcardService = new FlashcardService(locals.supabase);
    const deleted = await flashcardService.deleteFlashcard(flashcardId, user.id);

    if (!deleted) {
      throw new ApiError(
        "Flashcard not found or does not belong to user",
        "NOT_FOUND",
        404
      );
    }

    // 4. Return response
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
```

### Step 5: Implement Service Methods

Complete the implementation of `FlashcardService` with actual Supabase queries:

- Implement JOIN queries for deck_name
- Implement pagination with LIMIT/OFFSET
- Implement count queries for total
- Handle Supabase errors properly
- Map database rows to DTOs

### Step 6: Add Tests

Create test files:
- `tests/flashcard-api.test.ts` - Integration tests for API endpoints
- `tests/flashcard-service.test.ts` - Unit tests for service layer

Test scenarios:
- List flashcards with filters
- List flashcards with pagination
- Get flashcard by ID
- Create flashcard (manual and AI)
- Update flashcard
- Delete flashcard
- Error cases (401, 404, 400)
- Validation errors
- Deck ownership verification

### Step 7: Update Documentation

Update the following files:
- `docs/API.md` - Add flashcard endpoints documentation
- `README.md` - Update API overview if needed
- Add JSDoc comments to service methods

### Step 8: Database Verification

Verify database setup:
- Check indexes on flashcards table
- Verify RLS policies
- Test CASCADE delete behavior
- Verify constraints (front/back length, source enum)

### Step 9: Manual Testing

Test manually using:
- Postman or similar API client
- Create test script (similar to `scripts/test-review-actions.sh`)
- Test all endpoints with valid and invalid data
- Test pagination edge cases
- Test concurrent requests

### Step 10: Performance Testing

- Load test with multiple users
- Monitor query performance
- Check response times
- Verify pagination performance with large datasets
- Optimize queries if needed

### Step 11: Security Audit

- Verify authentication on all endpoints
- Test authorization (user isolation)
- Test input validation edge cases
- Check for SQL injection vulnerabilities
- Verify error messages don't leak sensitive info

### Step 12: Deployment

- Review code with team
- Merge to development branch
- Deploy to staging environment
- Run full test suite
- Monitor for errors
- Deploy to production
- Monitor performance metrics

---

## 10. Additional Notes

### 10.1 Future Enhancements

- Add full-text search on flashcard content
- Implement bulk operations (create/update/delete multiple)
- Add flashcard tags and filtering by tags
- Implement flashcard import/export
- Add flashcard statistics (success rate, review count)
- Implement soft delete for flashcard recovery

### 10.2 Dependencies

This implementation depends on:
- Existing error handler utility (`src/lib/utils/error-handler.ts`)
- Existing Supabase client setup (`src/db/supabase.client.ts`)
- Existing type definitions (`src/types.ts`)
- Existing middleware for session handling (`src/middleware/index.ts`)

### 10.3 Breaking Changes

None - this is a new implementation.

### 10.4 Migration Notes

If migrating from existing flashcard implementation:
- Ensure database schema matches specification
- Migrate existing data to new structure
- Update client code to use new DTOs
- Deprecate old endpoints gracefully

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-01  
**Author:** AI Architecture Team  
**Status:** Ready for Implementation
