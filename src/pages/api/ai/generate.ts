import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand, GenerateFlashcardsResponseDTO } from "../../../types";
import { generateFlashcardsSchema } from "../../../lib/schemas/ai-generation.schema";
import { aiFlashcardGenerator } from "../../../lib/services/ai-flashcard-generator.service";
import { AiGenerationLogService } from "../../../lib/services/ai-generation-log.service";
import { aiGenerationRateLimiter } from "../../../lib/services/rate-limiter.service";
import { ApiError, handleApiError } from "../../../lib/utils/error-handler";
import { GeminiApiError, ServiceUnavailableError } from "../../../lib/utils/gemini-client";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // 1. Authentication - get user from Supabase auth
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in. ", 401);
    }

    // 2. Rate limiting check
    const rateLimitOk = aiGenerationRateLimiter.check(user.id);
    if (!rateLimitOk) {
      const resetAt = aiGenerationRateLimiter.getResetAt(user.id);
      const resetDate = new Date(resetAt).toISOString();

      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Rate limit exceeded. Maximum 10 requests per minute allowed.",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetDate,
            "Retry-After": Math.ceil((resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 3. Parse and validate request body
    const rawBody = await context.request.json();
    const validatedData = generateFlashcardsSchema.parse(rawBody);

    const { text, language } = validatedData as GenerateFlashcardsCommand;

    // 4. Generate flashcards using AI
    let flashcards;
    try {
      flashcards = await aiFlashcardGenerator.generate(text, language);
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw new ApiError("AI_SERVICE_ERROR", "AI service is temporarily unavailable. Please try again later.", 503);
      }
      if (error instanceof GeminiApiError) {
        throw new ApiError("AI_SERVICE_ERROR", "Failed to generate flashcards. Please try again." + error, 500);
      }
      throw error;
    }

    // 5. Log the generation to database
    const aiGenerationLogService = new AiGenerationLogService(context.locals.supabase);
    const log = await aiGenerationLogService.create({
      user_id: user.id,
      input_text: text,
      input_length: text.length,
      generated_count: flashcards.length,
    });

    // 6. Prepare response
    const response: GenerateFlashcardsResponseDTO = {
      generation_log_id: log.id,
      flashcards: flashcards,
      count: flashcards.length,
      estimated_count: flashcards.length,
    };

    // 7. Return success response with rate limit headers
    const remaining = aiGenerationRateLimiter.getRemaining(user.id);
    const resetAt = aiGenerationRateLimiter.getResetAt(user.id);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(resetAt).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
