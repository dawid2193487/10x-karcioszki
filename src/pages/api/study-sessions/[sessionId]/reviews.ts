import type { APIRoute } from "astro";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";
import { submitReviewSchema } from "@/lib/schemas/study-session.schema";
import { StudySessionService } from "@/lib/services/study-session.service";

export const prerender = false;

/**
 * POST /api/study-sessions/:sessionId/reviews
 * Przesłanie oceny fiszki z automatyczną aktualizacją algorytmu SM-2
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Uwierzytelnianie
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // 2. Walidacja danych wejściowych
    const body = await request.json();
    const validatedData = submitReviewSchema.parse(body);

    // 3. Przesłanie recenzji przez serwis
    const service = new StudySessionService(locals.supabase);
    const result = await service.submitReview(
      user.id,
      params.sessionId!,
      validatedData
    );

    // 4. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
