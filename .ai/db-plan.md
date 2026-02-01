# AI Flashcards - Database Schema

## 1. Tables

### 1.1 profiles

Rozszerzone dane użytkownika powiązane z Supabase auth.users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | References auth.users(id) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last profile update timestamp |

**Constraints:**
- `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`

---

### 1.2 decks

Talie fiszek należące do użytkowników.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique deck identifier |
| user_id | UUID | NOT NULL | Owner of the deck |
| name | VARCHAR(100) | NOT NULL | Deck name |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Deck creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last deck update timestamp |

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `CHECK (LENGTH(name) BETWEEN 1 AND 100)`

---

### 1.3 flashcards

Fiszki należące do talii i użytkowników, z polami algorytmu SM-2.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique flashcard identifier |
| user_id | UUID | NOT NULL | Owner of the flashcard |
| deck_id | UUID | NOT NULL | Parent deck |
| front | TEXT | NOT NULL | Question/front side |
| back | TEXT | NOT NULL | Answer/back side |
| source | VARCHAR(20) | NOT NULL | Creation source: 'ai' or 'manual' |
| next_review_date | TIMESTAMPTZ | DEFAULT NOW() | Next scheduled review date |
| easiness_factor | DECIMAL(3,2) | DEFAULT 2.5 | SM-2 easiness factor (1.3-2.5) |
| interval | INTEGER | DEFAULT 0 | Days until next review |
| repetitions | INTEGER | DEFAULT 0 | Number of consecutive correct reviews |
| last_reviewed_at | TIMESTAMPTZ | NULL | Last review timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Flashcard creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last flashcard update timestamp |

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE`
- `CHECK (LENGTH(front) BETWEEN 1 AND 1000)`
- `CHECK (LENGTH(back) BETWEEN 1 AND 1000)`
- `CHECK (source IN ('ai', 'manual'))`
- `CHECK (easiness_factor BETWEEN 1.3 AND 2.5)`
- `CHECK (interval >= 0)`
- `CHECK (repetitions >= 0)`

---

### 1.4 review_sessions

Sesje nauki użytkownika dla konkretnej talii.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique session identifier |
| user_id | UUID | NOT NULL | User who performed the session |
| deck_id | UUID | NOT NULL | Deck being studied |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Session start time |
| ended_at | TIMESTAMPTZ | NULL | Session end time |
| cards_reviewed | INTEGER | DEFAULT 0 | Number of cards reviewed in session |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE`
- `CHECK (cards_reviewed >= 0)`
- `CHECK (ended_at IS NULL OR ended_at >= started_at)`

---

### 1.5 review_history

Historia pojedynczych recenzji fiszek w ramach sesji nauki.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique review identifier |
| user_id | UUID | NOT NULL | User who performed the review |
| flashcard_id | UUID | NOT NULL | Flashcard being reviewed |
| session_id | UUID | NULL | Associated study session |
| rating | INTEGER | NOT NULL | Difficulty rating (1-4): 1=Again, 2=Hard, 3=Good, 4=Easy |
| response_time_ms | INTEGER | NULL | Time taken to review (milliseconds) |
| reviewed_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Review timestamp |

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE`
- `FOREIGN KEY (session_id) REFERENCES review_sessions(id) ON DELETE SET NULL`
- `CHECK (rating BETWEEN 1 AND 4)`
- `CHECK (response_time_ms IS NULL OR response_time_ms >= 0)`

---

### 1.6 ai_generation_logs

Logi generowania fiszek przez AI dla analytics i metryki KPI.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique log identifier |
| user_id | UUID | NOT NULL | User who requested generation |
| input_text | TEXT | NOT NULL | Source text provided to AI |
| input_length | INTEGER | NOT NULL | Length of input text in characters |
| generated_count | INTEGER | NOT NULL | Number of flashcards generated |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Generation request timestamp |

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `CHECK (input_length BETWEEN 100 AND 5000)`
- `CHECK (generated_count >= 0)`

---

### 1.7 ai_review_actions

Akcje użytkownika podczas recenzji fiszek wygenerowanych przez AI.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique action identifier |
| user_id | UUID | NOT NULL | User performing the action |
| generation_log_id | UUID | NOT NULL | Associated AI generation log |
| flashcard_id | UUID | NULL | Created flashcard (if accepted/edited) |
| action_type | VARCHAR(20) | NOT NULL | Action: 'accepted', 'edited', 'rejected' |
| original_front | TEXT | NOT NULL | Original AI-generated front |
| original_back | TEXT | NOT NULL | Original AI-generated back |
| edited_front | TEXT | NULL | Edited front (if action_type='edited') |
| edited_back | TEXT | NULL | Edited back (if action_type='edited') |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Action timestamp |

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `FOREIGN KEY (generation_log_id) REFERENCES ai_generation_logs(id) ON DELETE CASCADE`
- `FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE SET NULL`
- `CHECK (action_type IN ('accepted', 'edited', 'rejected'))`
- `CHECK ((action_type = 'edited' AND edited_front IS NOT NULL AND edited_back IS NOT NULL) OR (action_type != 'edited' AND edited_front IS NULL AND edited_back IS NULL))`

---

## 2. Relationships

### 2.1 One-to-One
- **auth.users → profiles**: Każdy użytkownik ma jeden profil
  - `profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`

### 2.2 One-to-Many
- **auth.users → decks**: Użytkownik może mieć wiele talii
  - `decks.user_id REFERENCES auth.users(id) ON DELETE CASCADE`

- **auth.users → flashcards**: Użytkownik może mieć wiele fiszek
  - `flashcards.user_id REFERENCES auth.users(id) ON DELETE CASCADE`

- **decks → flashcards**: Talia może zawierać wiele fiszek
  - `flashcards.deck_id REFERENCES decks(id) ON DELETE CASCADE`

- **auth.users → review_sessions**: Użytkownik może mieć wiele sesji nauki
  - `review_sessions.user_id REFERENCES auth.users(id) ON DELETE CASCADE`

- **decks → review_sessions**: Talia może być przedmiotem wielu sesji nauki
  - `review_sessions.deck_id REFERENCES decks(id) ON DELETE CASCADE`

- **auth.users → review_history**: Użytkownik może mieć wiele recenzji
  - `review_history.user_id REFERENCES auth.users(id) ON DELETE CASCADE`

- **flashcards → review_history**: Fiszka może mieć wiele recenzji
  - `review_history.flashcard_id REFERENCES flashcards(id) ON DELETE CASCADE`

- **review_sessions → review_history**: Sesja może zawierać wiele recenzji
  - `review_history.session_id REFERENCES review_sessions(id) ON DELETE SET NULL`

- **auth.users → ai_generation_logs**: Użytkownik może mieć wiele logów generowania AI
  - `ai_generation_logs.user_id REFERENCES auth.users(id) ON DELETE CASCADE`

- **ai_generation_logs → ai_review_actions**: Log generowania może mieć wiele akcji recenzji
  - `ai_review_actions.generation_log_id REFERENCES ai_generation_logs(id) ON DELETE CASCADE`

- **auth.users → ai_review_actions**: Użytkownik może mieć wiele akcji recenzji
  - `ai_review_actions.user_id REFERENCES auth.users(id) ON DELETE CASCADE`

- **flashcards → ai_review_actions**: Fiszka może być powiązana z akcją recenzji
  - `ai_review_actions.flashcard_id REFERENCES flashcards(id) ON DELETE SET NULL`

---

## 3. Indexes

### 3.1 Performance Indexes

```sql
-- Flashcards due for review (partial index for efficiency)
CREATE INDEX idx_flashcards_next_review 
ON flashcards(user_id, deck_id, next_review_date) 
WHERE next_review_date <= NOW();

-- Flashcards by deck (for listing cards in a deck)
CREATE INDEX idx_flashcards_deck 
ON flashcards(deck_id);

-- Flashcards by user (for user's all flashcards queries)
CREATE INDEX idx_flashcards_user 
ON flashcards(user_id);

-- Review history for analytics and user progress
CREATE INDEX idx_review_history_user_card 
ON review_history(user_id, flashcard_id, reviewed_at DESC);

-- Review history by session
CREATE INDEX idx_review_history_session 
ON review_history(session_id);

-- Decks by user (for dashboard listing)
CREATE INDEX idx_decks_user 
ON decks(user_id);

-- AI generation logs by user (for analytics)
CREATE INDEX idx_ai_generation_logs_user 
ON ai_generation_logs(user_id, created_at DESC);

-- AI review actions by generation log (for KPI calculations)
CREATE INDEX idx_ai_review_actions_log 
ON ai_review_actions(generation_log_id);

-- Review sessions by user and deck
CREATE INDEX idx_review_sessions_user_deck 
ON review_sessions(user_id, deck_id, started_at DESC);
```

---

## 4. Row Level Security (RLS) Policies

### 4.1 profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_profile 
ON profiles 
FOR ALL 
USING (id = auth.uid());
```

### 4.2 decks

```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_decks 
ON decks 
FOR ALL 
USING (user_id = auth.uid());
```

### 4.3 flashcards

```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_flashcards 
ON flashcards 
FOR ALL 
USING (user_id = auth.uid());
```

### 4.4 review_sessions

```sql
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_review_sessions 
ON review_sessions 
FOR ALL 
USING (user_id = auth.uid());
```

### 4.5 review_history

```sql
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_review_history 
ON review_history 
FOR ALL 
USING (user_id = auth.uid());
```

### 4.6 ai_generation_logs

```sql
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_ai_generation_logs 
ON ai_generation_logs 
FOR ALL 
USING (user_id = auth.uid());
```

### 4.7 ai_review_actions

```sql
ALTER TABLE ai_review_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_ai_review_actions 
ON ai_review_actions 
FOR ALL 
USING (user_id = auth.uid());
```

---

## 5. Triggers and Functions

### 5.1 Automatic updated_at Timestamp

```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON profiles
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for decks
CREATE TRIGGER update_decks_updated_at 
BEFORE UPDATE ON decks
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for flashcards
CREATE TRIGGER update_flashcards_updated_at 
BEFORE UPDATE ON flashcards
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Automatic Profile Creation

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
```

---

## 6. Additional Notes

### 6.1 Design Decisions

**Normalization:** Schema is normalized to 3NF to eliminate data redundancy while maintaining query performance through strategic indexing.

**CASCADE Deletes:** ON DELETE CASCADE is used for parent-child relationships (users→decks→flashcards) to ensure referential integrity and automatic cleanup.

**Partial Indexes:** The `idx_flashcards_next_review` index uses a WHERE clause to index only cards due for review, significantly reducing index size and improving query performance.

**TIMESTAMPTZ:** All timestamps use TIMESTAMPTZ for proper timezone handling, supporting international users.

**VARCHAR vs ENUM:** VARCHAR with CHECK constraints is used instead of PostgreSQL ENUM for categorical values, allowing easier schema evolution without migrations.

**Nullable Fields:** Some fields are nullable by design:
- `review_sessions.ended_at` - NULL until session completes
- `review_history.session_id` - Can be SET NULL if session is deleted
- `ai_review_actions.flashcard_id` - NULL for rejected cards
- `ai_review_actions.edited_front/back` - NULL unless action_type='edited'

### 6.2 SM-2 Algorithm Support

The `flashcards` table includes all fields required for the SM-2 spaced repetition algorithm:
- `easiness_factor`: Quality of retention (1.3-2.5)
- `interval`: Days between reviews
- `repetitions`: Consecutive correct answers
- `next_review_date`: Calculated next review date
- `last_reviewed_at`: Last review timestamp

### 6.3 Analytics and KPI Support

The schema directly supports PRD-defined KPIs:

**KPI-001 (AI Acceptance Rate ≥75%):**
```sql
SELECT 
    (COUNT(*) FILTER (WHERE action_type IN ('accepted', 'edited'))::FLOAT / 
     COUNT(*)::FLOAT) * 100 AS acceptance_rate
FROM ai_review_actions
WHERE user_id = auth.uid();
```

**KPI-002 (AI Usage Rate ≥75%):**
```sql
SELECT 
    (COUNT(*) FILTER (WHERE source = 'ai')::FLOAT / 
     COUNT(*)::FLOAT) * 100 AS ai_usage_rate
FROM flashcards
WHERE user_id = auth.uid();
```

### 6.4 Security Considerations

- **RLS Enabled:** All user data tables have Row Level Security enabled with policies restricting access to `user_id = auth.uid()`
- **API Keys:** Google Gemini API keys are never stored in the database, only in backend environment variables
- **Input Validation:** CHECK constraints enforce data integrity at the database level (lengths, value ranges)
- **Prepared Statements:** Schema design assumes use of parameterized queries to prevent SQL injection

### 6.5 Future Considerations

**Not Implemented in MVP (per PRD scope):**
- Tags/categorization (beyond decks)
- Nested decks/folders
- Media attachments (images, audio)
- Rich text formatting
- Collaborative features
- Public deck sharing

**Potential Optimizations:**
- Partitioning `review_history` by date range for large datasets
- Materialized views for complex analytics queries
- Full-text search indexes (tsvector) if text search is added
- Archival strategy for old `ai_generation_logs` (retention policy TBD)

### 6.6 Migration Strategy

Schema will be implemented using Supabase CLI migrations:
1. Initial migration creates all tables, indexes, and constraints
2. RLS policies applied in separate migration
3. Triggers and functions in dedicated migration
4. Seed data (if needed) in final migration

All migrations are version-controlled and reversible.
