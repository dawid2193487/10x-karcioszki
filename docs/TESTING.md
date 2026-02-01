# Testing Plan for AI Flashcard Generation Endpoint

## Prerequisites

1. Start the development server: `npm run dev`
2. Ensure Supabase is running and configured
3. Set `GEMINI_API_KEY` in `.env` file
4. Have a valid authentication token ready

## Test Scenarios

### 1. Authentication Tests

#### Test 1.1: Request without Authorization header
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."}'
```

**Expected Result:**
- Status: 401
- Error code: `UNAUTHORIZED`
- Message: "Authentication required. Please log in."

#### Test 1.2: Request with invalid token
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer invalid_token_here" \
  -H "Content-Type: application/json" \
  -d '{"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."}'
```

**Expected Result:**
- Status: 401
- Error code: `UNAUTHORIZED`

### 2. Validation Tests

#### Test 2.1: Text too short (< 100 characters)
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Too short text"}'
```

**Expected Result:**
- Status: 400
- Error code: `VALIDATION_ERROR`
- Details: field="text", message="Text must be at least 100 characters long"

#### Test 2.2: Text too long (> 5000 characters)
```bash
# Create a file with 5001 characters
python3 -c "print('a' * 5001)" > long_text.txt

curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$(cat long_text.txt)\"}"
```

**Expected Result:**
- Status: 400
- Error code: `VALIDATION_ERROR`
- Details: field="text", message="Text must not exceed 5000 characters"

#### Test 2.3: Invalid language code
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.", "language": "english"}'
```

**Expected Result:**
- Status: 400
- Error code: `VALIDATION_ERROR`
- Details: field="language", message="Language must be a valid ISO 639-1 two-letter code"

### 3. Rate Limiting Tests

#### Test 3.1: Exceed rate limit (11 requests in 1 minute)
```bash
# Run this script to test rate limiting
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/ai/generate \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."}'
  echo ""
  echo "---"
done
```

**Expected Result:**
- First 10 requests: Status 200
- 11th request: Status 429
- Error code: `RATE_LIMIT_EXCEEDED`
- Headers: `X-RateLimit-Remaining: 0`, `Retry-After` present

### 4. Successful Generation Tests

#### Test 4.1: Valid request with English content
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The Spanish verb estar is used to describe temporary states and locations. For example, ¿Cómo estás? means How are you?. Unlike ser, which describes permanent characteristics, estar focuses on conditions that can change.",
    "language": "en"
  }'
```

**Expected Result:**
- Status: 200
- Response contains: `generation_log_id`, `flashcards` array, `count`, `estimated_count`
- Flashcards have `front` and `back` properties
- Count matches number of flashcards
- Headers: `X-RateLimit-Limit: 10`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### Test 4.2: Valid request with Polish content
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Czasownik być w języku polskim ma nieregularne odmiany. W czasie teraźniejszym używamy form: jestem, jesteś, jest, jesteśmy, jesteście, są. Forma przeszła również jest nieregularna: byłem, byłeś, był, byliśmy, byliście, byli.",
    "language": "pl"
  }'
```

**Expected Result:**
- Status: 200
- Flashcards in Polish language
- Same structure as 4.1

#### Test 4.3: Default language (no language specified)
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of squares of the other two sides. This can be written as a² + b² = c², where c is the hypotenuse."
  }'
```

**Expected Result:**
- Status: 200
- English flashcards (default language)

### 5. Content Quality Tests

Test with different types of content:

#### Test 5.1: Definitions
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water. It generally involves the green pigment chlorophyll and generates oxygen as a byproduct."
  }'
```

#### Test 5.2: Historical facts
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The French Revolution began in 1789 and lasted until 1799. It was a period of radical social and political upheaval in France. Key events include the storming of the Bastille on July 14, 1789, and the execution of King Louis XVI in 1793."
  }'
```

#### Test 5.3: Technical concepts
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "REST (Representational State Transfer) is an architectural style for designing networked applications. It relies on stateless, client-server communication using HTTP methods like GET, POST, PUT, and DELETE to perform operations on resources identified by URLs."
  }'
```

### 6. Database Verification

After successful generation, verify in Supabase:

```sql
-- Check if generation was logged
SELECT * FROM ai_generation_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify user_id, input_text, input_length, generated_count
```

### 7. Response Time Tests

Monitor response times for different text lengths:

```bash
# Short text (~100 chars)
time curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Short text with exactly one hundred characters needed for this test to work properly and pass validation."}'

# Medium text (~500 chars)
time curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "...(500 chars)..."}'

# Long text (~5000 chars)
time curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "...(5000 chars)..."}'
```

**Expected Result:**
- All responses < 30 seconds
- Typical range: 2-10 seconds

### 8. Error Recovery Tests

#### Test 8.1: Malformed JSON
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{text: invalid json}'
```

**Expected Result:**
- Status: 400 or 500
- Proper error handling

#### Test 8.2: Missing GEMINI_API_KEY
1. Remove `GEMINI_API_KEY` from `.env`
2. Restart server
3. Make a valid request

**Expected Result:**
- Status: 500
- Error code: `AI_SERVICE_ERROR` or `INTERNAL_ERROR`

## Automated Test Script

Create a file `test-generate-endpoint.sh`:

```bash
#!/bin/bash

TOKEN="YOUR_TOKEN_HERE"
BASE_URL="http://localhost:3000"

echo "=== AI Flashcard Generation Endpoint Tests ==="
echo ""

# Test 1: No auth
echo "Test 1: No authentication"
curl -s -X POST "$BASE_URL/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."}' \
  | jq '.'
echo ""

# Test 2: Text too short
echo "Test 2: Text too short"
curl -s -X POST "$BASE_URL/api/ai/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Too short"}' \
  | jq '.'
echo ""

# Test 3: Invalid language
echo "Test 3: Invalid language code"
curl -s -X POST "$BASE_URL/api/ai/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.", "language": "english"}' \
  | jq '.'
echo ""

# Test 4: Valid request
echo "Test 4: Valid request"
curl -s -X POST "$BASE_URL/api/ai/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "The Spanish verb estar is used to describe temporary states and locations. For example, ¿Cómo estás? means How are you?. Unlike ser, which describes permanent characteristics, estar focuses on conditions that can change.", "language": "en"}' \
  | jq '.'
echo ""

echo "=== Tests completed ==="
```

Make executable and run:
```bash
chmod +x test-generate-endpoint.sh
./test-generate-endpoint.sh
```

---

## AI Review Actions Endpoint Tests

### Test Scenarios

#### Test 1: Accepted Action
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "YOUR_GENERATION_LOG_ID",
    "flashcard_id": "YOUR_FLASHCARD_ID",
    "action_type": "accepted",
    "original_front": "What is the Spanish verb estar used for?",
    "original_back": "To describe temporary states and locations"
  }'
```

**Expected Result:**
- Status: 201 Created
- Response contains: `id`, `generation_log_id`, `flashcard_id`, `action_type`, `created_at`

#### Test 2: Edited Action
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "YOUR_GENERATION_LOG_ID",
    "flashcard_id": "YOUR_FLASHCARD_ID",
    "action_type": "edited",
    "original_front": "Original front",
    "original_back": "Original back",
    "edited_front": "Improved front",
    "edited_back": "Improved back"
  }'
```

**Expected Result:**
- Status: 201 Created
- Both `edited_front` and `edited_back` must be provided

#### Test 3: Rejected Action
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "YOUR_GENERATION_LOG_ID",
    "flashcard_id": null,
    "action_type": "rejected",
    "original_front": "Poor quality front",
    "original_back": "Poor quality back"
  }'
```

**Expected Result:**
- Status: 201 Created
- `flashcard_id` can be null for rejected cards

#### Test 4: Validation Error - Missing Edited Fields
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "YOUR_GENERATION_LOG_ID",
    "flashcard_id": "YOUR_FLASHCARD_ID",
    "action_type": "edited",
    "original_front": "Front",
    "original_back": "Back"
  }'
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: `VALIDATION_ERROR`
- Error message about missing `edited_front` and `edited_back`

#### Test 5: Validation Error - Invalid UUID
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "invalid-uuid",
    "flashcard_id": null,
    "action_type": "rejected",
    "original_front": "Front",
    "original_back": "Back"
  }'
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: `VALIDATION_ERROR`
- Error message: "Invalid generation log ID"

#### Test 6: Not Found - Non-existent Generation Log
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "00000000-0000-0000-0000-000000000000",
    "flashcard_id": null,
    "action_type": "rejected",
    "original_front": "Front",
    "original_back": "Back"
  }'
```

**Expected Result:**
- Status: 404 Not Found
- Error code: `NOT_FOUND`
- Error message: "AI generation log not found or does not belong to user"

#### Test 7: Unauthorized - No Token
```bash
curl -X POST http://localhost:3000/api/ai/review-actions \
  -H "Content-Type: application/json" \
  -d '{
    "generation_log_id": "YOUR_GENERATION_LOG_ID",
    "flashcard_id": null,
    "action_type": "rejected",
    "original_front": "Front",
    "original_back": "Back"
  }'
```

**Expected Result:**
- Status: 401 Unauthorized
- Error code: `UNAUTHORIZED`
- Error message: "Authentication required. Please log in."

### Automated Test Script

Located at: `scripts/test-review-actions.sh`

Run tests:
```bash
chmod +x scripts/test-review-actions.sh
./scripts/test-review-actions.sh
```

The script will:
1. Create a test user and get auth token
2. Create test data (generation log, flashcard)
3. Run all test scenarios automatically
4. Display color-coded results

## Success Criteria

✅ All authentication tests pass  
✅ All validation tests return proper error codes  
✅ Successful generations return proper structure  
✅ Different languages work  
✅ Database logging works  
✅ Response times are acceptable  
✅ Error handling is comprehensive  
✅ No console errors in server logs  
✅ **AI review actions logged correctly**  
✅ **Conditional validation works (edited fields)**  
✅ **Ownership verification works**  

## Notes

- Replace `YOUR_TOKEN` with actual authentication token
- Use `jq` for JSON formatting (install: `sudo dnf install jq`)
- Monitor server logs for any errors
- Check Supabase dashboard for database entries
- For review actions, you need a valid `generation_log_id` from a previous generation
