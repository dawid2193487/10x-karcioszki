# API Documentation

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
