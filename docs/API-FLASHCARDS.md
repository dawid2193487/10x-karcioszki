# Flashcard Management API

Complete REST API documentation for flashcard CRUD operations.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require authentication via Supabase session. Include the session token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### List Flashcards

Retrieve a paginated, filtered list of flashcards.

**Endpoint:** `GET /api/flashcards`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `deck_id` | UUID | No | - | Filter flashcards by deck |
| `source` | Enum | No | - | Filter by source: `ai` or `manual` |
| `page` | Integer | No | 1 | Page number (min: 1) |
| `limit` | Integer | No | 20 | Items per page (min: 1, max: 100) |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "deck_name": "Deck Name",
      "front": "Question text",
      "back": "Answer text",
      "source": "ai",
      "next_review_date": "2026-02-01T12:00:00Z",
      "created_at": "2026-02-01T12:00:00Z",
      "updated_at": "2026-02-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication
- `400 Bad Request` - Invalid query parameters

---

### Get Flashcard

Retrieve detailed information about a specific flashcard, including SM-2 algorithm state.

**Endpoint:** `GET /api/flashcards/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Flashcard identifier |

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "deck_name": "Deck Name",
  "front": "Question text",
  "back": "Answer text",
  "source": "manual",
  "next_review_date": "2026-02-02T12:00:00Z",
  "easiness_factor": 2.5,
  "interval": 1,
  "repetitions": 0,
  "last_reviewed_at": null,
  "created_at": "2026-02-01T12:00:00Z",
  "updated_at": "2026-02-01T12:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Flashcard not found or doesn't belong to user

---

### Create Flashcard

Create a new flashcard manually or after reviewing AI-generated content.

**Endpoint:** `POST /api/flashcards`

**Request Body:**

```json
{
  "deck_id": "uuid",
  "front": "Question text (1-1000 characters)",
  "back": "Answer text (1-1000 characters)",
  "source": "ai" | "manual"
}
```

**Validation Rules:**
- `deck_id`: Required, valid UUID, must exist and belong to user
- `front`: Required, 1-1000 characters
- `back`: Required, 1-1000 characters
- `source`: Required, must be `ai` or `manual`

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "Question text",
  "back": "Answer text",
  "source": "ai",
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
          "message": "String must contain at least 1 character(s)"
        }
      ]
    }
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Deck not found or doesn't belong to user

---

### Update Flashcard

Update flashcard content with autosave functionality for inline editing.

**Endpoint:** `PATCH /api/flashcards/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Flashcard identifier |

**Request Body:**

```json
{
  "front": "Updated question text (optional)",
  "back": "Updated answer text (optional)"
}
```

**Validation Rules:**
- At least one field (`front` or `back`) must be provided
- `front` (optional): 1-1000 characters
- `back` (optional): 1-1000 characters

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "deck_id": "uuid",
  "front": "Updated question text",
  "back": "Answer text",
  "source": "manual",
  "next_review_date": "2026-02-01T12:00:00Z",
  "easiness_factor": 2.5,
  "interval": 0,
  "repetitions": 0,
  "last_reviewed_at": null,
  "created_at": "2026-02-01T12:00:00Z",
  "updated_at": "2026-02-01T12:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed or no fields provided
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed",
      "details": [
        {
          "field": "",
          "message": "At least one field (front or back) must be provided"
        }
      ]
    }
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Flashcard not found or doesn't belong to user

---

### Delete Flashcard

Delete a flashcard and all associated review history (CASCADE).

**Endpoint:** `DELETE /api/flashcards/:id`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Flashcard identifier |

**Response:** `204 No Content`

No response body.

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Flashcard not found or doesn't belong to user

---

## Data Models

### FlashcardListItemDTO

Used in list responses.

```typescript
{
  id: string;              // UUID
  deck_id: string;         // UUID
  deck_name: string;       // Name of the deck
  front: string;           // Question/front side
  back: string;            // Answer/back side
  source: "ai" | "manual"; // Creation source
  next_review_date: string | null; // ISO 8601 timestamp
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}
```

### FlashcardDetailDTO

Used in single flashcard responses, includes SM-2 algorithm state.

```typescript
{
  id: string;
  deck_id: string;
  deck_name: string;
  front: string;
  back: string;
  source: "ai" | "manual";
  next_review_date: string | null;
  easiness_factor: number | null;  // SM-2: 1.3 - 2.5
  interval: number | null;         // SM-2: days until next review
  repetitions: number | null;      // SM-2: consecutive correct reviews
  last_reviewed_at: string | null; // ISO 8601 timestamp
  created_at: string;
  updated_at: string;
}
```

### PaginationDTO

```typescript
{
  page: number;        // Current page number
  limit: number;       // Items per page
  total: number;       // Total number of items
  total_pages: number; // Total number of pages
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "message": "Field-specific error message"
      }
    ]
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required or invalid |
| `NOT_FOUND` | 404 | Resource not found or doesn't belong to user |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Examples

### Example 1: Create a Manual Flashcard

```bash
curl -X POST http://localhost:3000/api/flashcards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deck_id": "123e4567-e89b-12d3-a456-426614174000",
    "front": "What is TypeScript?",
    "back": "TypeScript is a typed superset of JavaScript",
    "source": "manual"
  }'
```

### Example 2: List AI Flashcards from a Deck

```bash
curl -X GET "http://localhost:3000/api/flashcards?deck_id=123e4567-e89b-12d3-a456-426614174000&source=ai&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Example 3: Update Flashcard Front

```bash
curl -X PATCH http://localhost:3000/api/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is TypeScript? (Updated)"
  }'
```

### Example 4: Delete Flashcard

```bash
curl -X DELETE http://localhost:3000/api/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <token>"
```

## Performance Considerations

### Database Indexes

The following indexes are automatically created in the database:

- `idx_flashcards_user` - For listing user's flashcards
- `idx_flashcards_deck` - For filtering by deck
- `idx_flashcards_next_review` - Composite index for due card queries

### Pagination

- Default limit: 20 items per page
- Maximum limit: 100 items per page
- Use pagination for better performance with large datasets

### Caching

- Client-side caching recommended (e.g., React Query, SWR)
- Invalidate cache on create/update/delete operations

## Security

### Authorization

- All queries automatically filter by `user_id` from authenticated session
- Row Level Security (RLS) policies enforce data isolation at database level
- Users can only access their own flashcards

### Input Validation

- All inputs validated using Zod schemas
- UUID parameters validated to prevent injection
- String length limits enforced (1-1000 characters)
- Enum values strictly validated

### Rate Limiting

Consider implementing rate limiting for production:
- Suggested limit: 100 flashcard creations per hour per user
- Use `rate-limiter.service.ts` for implementation
