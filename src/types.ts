import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Database Entity Types (Base Models)
// ============================================================================

export type Deck = Tables<"decks">;
export type Flashcard = Tables<"flashcards">;
export type ReviewSession = Tables<"review_sessions">;
export type ReviewHistory = Tables<"review_history">;
export type AiGenerationLog = Tables<"ai_generation_logs">;
export type AiReviewAction = Tables<"ai_review_actions">;
export type Profile = Tables<"profiles">;

export type DeckInsert = TablesInsert<"decks">;
export type FlashcardInsert = TablesInsert<"flashcards">;
export type ReviewSessionInsert = TablesInsert<"review_sessions">;
export type ReviewHistoryInsert = TablesInsert<"review_history">;
export type AiGenerationLogInsert = TablesInsert<"ai_generation_logs">;
export type AiReviewActionInsert = TablesInsert<"ai_review_actions">;
export type ProfileInsert = TablesInsert<"profiles">;

export type DeckUpdate = TablesUpdate<"decks">;
export type FlashcardUpdate = TablesUpdate<"flashcards">;
export type ReviewSessionUpdate = TablesUpdate<"review_sessions">;
export type ReviewHistoryUpdate = TablesUpdate<"review_history">;
export type AiGenerationLogUpdate = TablesUpdate<"ai_generation_logs">;
export type AiReviewActionUpdate = TablesUpdate<"ai_review_actions">;
export type ProfileUpdate = TablesUpdate<"profiles">;

// ============================================================================
// Deck DTOs
// ============================================================================

/**
 * DTO for deck list items with computed statistics
 * Used in GET /api/decks response
 */
export interface DeckListItemDTO {
  id: string;
  name: string;
  flashcard_count: number;
  due_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * DTO for detailed deck information with extended statistics
 * Used in GET /api/decks/:id response
 */
export interface DeckDetailDTO extends DeckListItemDTO {
  new_count: number;
}

/**
 * Command for creating a new deck
 * Used in POST /api/decks request
 */
export interface CreateDeckCommand {
  name: string;
}

/**
 * Command for updating a deck
 * Used in PATCH /api/decks/:id request
 */
export interface UpdateDeckCommand {
  name: string;
}

/**
 * DTO for deck creation/update response
 * Includes computed statistics
 */
export type DeckDTO = DeckDetailDTO;

/**
 * Paginated response for deck list
 * Used in GET /api/decks
 */
export interface DeckListResponseDTO {
  data: DeckListItemDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Source of flashcard creation
 */
export type FlashcardSource = "ai" | "manual";

/**
 * DTO for flashcard list items with deck information
 * Used in GET /api/flashcards response
 */
export interface FlashcardListItemDTO {
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

/**
 * DTO for detailed flashcard information including SM-2 algorithm state
 * Used in GET /api/flashcards/:id response
 */
export interface FlashcardDetailDTO extends Omit<FlashcardListItemDTO, "deck_name"> {
  deck_name: string;
  easiness_factor: number | null;
  interval: number | null;
  repetitions: number | null;
  last_reviewed_at: string | null;
}

/**
 * Command for creating a new flashcard
 * Used in POST /api/flashcards request
 */
export interface CreateFlashcardCommand {
  deck_id: string;
  front: string;
  back: string;
  source: FlashcardSource;
}

/**
 * Command for updating flashcard content (autosave)
 * Used in PATCH /api/flashcards/:id request
 */
export interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
}

/**
 * DTO for flashcard creation/update response
 * Includes full SM-2 algorithm state
 */
export interface FlashcardDTO {
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

/**
 * Paginated response for flashcard list
 * Used in GET /api/flashcards
 */
export interface FlashcardListResponseDTO {
  data: FlashcardListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * DTO for due flashcards in a deck
 * Used in GET /api/decks/:id/due response
 */
export interface DueFlashcardDTO {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  next_review_date: string | null;
  easiness_factor: number | null;
  interval: number | null;
  repetitions: number | null;
}

/**
 * Response for due cards endpoint
 * Used in GET /api/decks/:id/due
 */
export interface DueCardsResponseDTO {
  data: DueFlashcardDTO[];
  total: number;
}

// ============================================================================
// AI Generation DTOs
// ============================================================================

/**
 * Command for generating flashcards from text using AI
 * Used in POST /api/ai/generate request
 */
export interface GenerateFlashcardsCommand {
  text: string;
  language?: string;
}

/**
 * Structure of a single AI-generated flashcard (draft)
 */
export interface GeneratedFlashcardDTO {
  front: string;
  back: string;
}

/**
 * Response for AI flashcard generation
 * Returns draft flashcards that need review before saving
 * Used in POST /api/ai/generate response
 */
export interface GenerateFlashcardsResponseDTO {
  generation_log_id: string;
  flashcards: GeneratedFlashcardDTO[];
  count: number;
  estimated_count: number;
}

// ============================================================================
// AI Review Action DTOs
// ============================================================================

/**
 * Type of action taken during AI flashcard review
 */
export type AiReviewActionType = "accepted" | "edited" | "rejected";

/**
 * Command for logging AI review action
 * Used in POST /api/ai/review-actions request
 */
export interface LogAiReviewActionCommand {
  generation_log_id: string;
  flashcard_id: string | null;
  action_type: AiReviewActionType;
  original_front: string;
  original_back: string;
  edited_front?: string;
  edited_back?: string;
}

/**
 * Response for AI review action logging
 * Used in POST /api/ai/review-actions response
 */
export interface AiReviewActionDTO {
  id: string;
  generation_log_id: string;
  flashcard_id: string | null;
  action_type: AiReviewActionType;
  created_at: string;
}

// ============================================================================
// Study Session DTOs
// ============================================================================

/**
 * Command for creating a study session
 * Used in POST /api/study-sessions request
 */
export interface CreateStudySessionCommand {
  deck_id: string;
}

/**
 * DTO for study session information
 * Used in POST /api/study-sessions and GET /api/study-sessions/:id response
 */
export interface StudySessionDTO {
  id: string;
  deck_id: string;
  started_at: string;
  ended_at: string | null;
  cards_reviewed: number;
}

/**
 * DTO for study session with deck name
 * Used in GET /api/study-sessions/:id response
 */
export interface StudySessionDetailDTO extends StudySessionDTO {
  deck_name: string;
}

/**
 * Rating scale for flashcard review (SM-2 algorithm)
 * 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
 */
export type ReviewRating = 1 | 2 | 3 | 4;

/**
 * Command for submitting a flashcard review
 * Used in POST /api/study-sessions/:sessionId/reviews request
 */
export interface SubmitReviewCommand {
  flashcard_id: string;
  rating: ReviewRating;
  response_time_ms?: number;
}

/**
 * Response for review submission
 * Includes updated flashcard SM-2 state and session progress
 * Used in POST /api/study-sessions/:sessionId/reviews response
 */
export interface SubmitReviewResponseDTO {
  review_id: string;
  flashcard: {
    id: string;
    next_review_date: string | null;
    easiness_factor: number | null;
    interval: number | null;
    repetitions: number | null;
  };
  session: {
    cards_reviewed: number;
  };
}

/**
 * Response for completed study session
 * Includes duration calculation
 * Used in PATCH /api/study-sessions/:id/complete response
 */
export interface CompleteStudySessionResponseDTO extends StudySessionDTO {
  duration_seconds: number;
}

// ============================================================================
// Analytics DTOs
// ============================================================================

/**
 * Flashcard count breakdown by source
 */
export interface FlashcardsBySourceDTO {
  ai: number;
  manual: number;
}

/**
 * User-level statistics and KPIs
 * Used in GET /api/analytics/stats response
 */
export interface UserStatsDTO {
  total_decks: number;
  total_flashcards: number;
  flashcards_by_source: FlashcardsBySourceDTO;
  ai_acceptance_rate: number;
  total_reviews: number;
  study_streak_days: number;
}

// ============================================================================
// Common/Shared DTOs
// ============================================================================

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Query parameters for paginated list endpoints
 */
export interface PaginationQueryParams {
  page?: number;
  limit?: number;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
}

/**
 * Error codes used across the API
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "AI_SERVICE_ERROR"
  | "INTERNAL_ERROR";

/**
 * Detailed error information for validation failures
 */
export interface ErrorDetail {
  field: string;
  message: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for flashcard list endpoint
 * Used in GET /api/flashcards
 */
export interface FlashcardQueryParams extends PaginationQueryParams {
  deck_id?: string;
  source?: FlashcardSource;
}

/**
 * Query parameters for due cards endpoint
 * Used in GET /api/decks/:id/due
 */
export interface DueCardsQueryParams {
  limit?: number;
}
