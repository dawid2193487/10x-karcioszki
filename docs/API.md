# API Documentation

## Table of Contents

1. [Flashcard Management](#flashcard-management) - CRUD operations for flashcards
2. [AI Flashcard Generation](#ai-flashcard-generation) - Generate flashcards using AI
3. [AI Review Actions](#ai-review-actions) - Log user actions on AI-generated flashcards

---

## Flashcard Management

Complete CRUD API for managing flashcards. See [API-FLASHCARDS.md](./API-FLASHCARDS.md) for full documentation.

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flashcards` | List flashcards with filtering and pagination |
| GET | `/api/flashcards/:id` | Get flashcard details with SM-2 state |
| POST | `/api/flashcards` | Create a new flashcard |
| PATCH | `/api/flashcards/:id` | Update flashcard content (autosave) |
| DELETE | `/api/flashcards/:id` | Delete flashcard and review history |

**Quick Example:**

```bash
# Create a flashcard
curl -X POST http://localhost:3000/api/flashcards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deck_id": "uuid",
    "front": "What is TypeScript?",
    "back": "TypeScript is a typed superset of JavaScript",
    "source": "manual"
  }'

# List flashcards from a specific deck
curl "http://localhost:3000/api/flashcards?deck_id=uuid&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

For detailed documentation, examples, and data models, see [API-FLASHCARDS.md](./API-FLASHCARDS.md).

---

## AI Flashcard Generation

### POST /api/ai/generate

Generate flashcards from text using Google Gemini AI.

#### Authentication
Required. Include Bearer token in Authorization header.

#### Rate Limiting
- **Limit:** 10 requests per minute per user
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: ISO 8601 timestamp when limit resets

#### Request

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "The Spanish verb 'estar' is used to describe temporary states and locations...",
  "language": "en"
}
```

**Parameters:**
- `text` (required): Source text to generate flashcards from
  - Min length: 100 characters
  - Max length: 5000 characters
- `language` (optional): ISO 639-1 language code (default: "en")
  - Format: Two lowercase letters (e.g., "en", "pl", "es")

#### Response

**Success (200 OK):**
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
    }
  ],
  "count": 2,
  "estimated_count": 2
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "text",
        "message": "Text must be at least 100 characters long"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

**429 Too Many Requests:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 10 requests per minute allowed."
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to generate flashcards. Please try again."
  }
}
```

**503 Service Unavailable:**
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

#### Example Usage

**cURL:**
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The Spanish verb estar is used to describe temporary states and locations. For example, ¿Cómo estás? means How are you?. Unlike ser, which describes permanent characteristics, estar focuses on conditions that can change.",
    "language": "en"
  }'
```

**JavaScript:**
```javascript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'The Spanish verb estar is used to describe temporary states...',
    language: 'en'
  })
});

const data = await response.json();
console.log(data.flashcards);
```

#### Notes

- Generated flashcards are returned as drafts and not automatically saved to the database
- Each generation operation is logged in `ai_generation_logs` table for analytics
- The AI generates 2-5 flashcards depending on content complexity
- Response time typically ranges from 2-10 seconds
- Maximum timeout is 30 seconds
---

## AI Review Actions

### POST /api/ai/review-actions

Log user actions during review of AI-generated flashcards (accept, edit, or reject).

#### Authentication
Required. Include Bearer token in Authorization header.

#### Request

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "generation_log_id": "550e8400-e29b-41d4-a716-446655440000",
  "flashcard_id": "789e0123-e45b-67c8-d901-234567890abc",
  "action_type": "edited",
  "original_front": "What is the Spanish verb 'estar' used for?",
  "original_back": "To describe temporary states and locations",
  "edited_front": "What is the Spanish verb 'estar' primarily used for?",
  "edited_back": "To describe temporary states, locations, and conditions"
}
```

**Parameters:**
- `generation_log_id` (required): UUID of the AI generation log
- `flashcard_id` (required): UUID of the flashcard (null for rejected cards)
- `action_type` (required): One of: "accepted", "edited", "rejected"
- `original_front` (required): Original AI-generated front text (1-1000 chars)
- `original_back` (required): Original AI-generated back text (1-1000 chars)
- `edited_front` (conditional): Required when action_type is "edited" (1-1000 chars)
- `edited_back` (conditional): Required when action_type is "edited" (1-1000 chars)

#### Response

**Success (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "generation_log_id": "550e8400-e29b-41d4-a716-446655440000",
  "flashcard_id": "789e0123-e45b-67c8-d901-234567890abc",
  "action_type": "edited",
  "created_at": "2026-02-01T12:00:00Z"
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "edited_front",
        "message": "edited_front and edited_back are required when action_type is \"edited\""
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in."
  }
}
```

**404 Not Found:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "AI generation log not found or does not belong to user"
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

#### Example Usage

**Accepted Action:**
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "flashcard_id": "789e0123-e45b-67c8-d901-234567890abc",
    "action_type": "accepted",
    "original_front": "Test front",
    "original_back": "Test back"
  }'
```

**Edited Action:**
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "flashcard_id": "789e0123-e45b-67c8-d901-234567890abc",
    "action_type": "edited",
    "original_front": "Original front",
    "original_back": "Original back",
    "edited_front": "Improved front",
    "edited_back": "Improved back"
  }'
```

**Rejected Action:**
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "550e8400-e29b-41d4-a716-446655440000",
    "flashcard_id": null,
    "action_type": "rejected",
    "original_front": "Poor quality front",
    "original_back": "Poor quality back"
  }'
```

**JavaScript:**
```javascript
const response = await fetch('/api/ai/review-actions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    generation_log_id: generationLogId,
    flashcard_id: flashcardId,
    action_type: 'accepted',
    original_front: 'Test front',
    original_back: 'Test back'
  })
});

const data = await response.json();
console.log('Review action logged:', data.id);
```

#### Notes

- This endpoint is used to track user engagement with AI-generated content
- Provides data for calculating AI acceptance rates and quality metrics
- The `generation_log_id` must belong to the authenticated user
- When `action_type` is "edited", both `edited_front` and `edited_back` are required
- When `action_type` is "rejected", `flashcard_id` should be null
- All actions are logged for analytics and AI improvement purposes
