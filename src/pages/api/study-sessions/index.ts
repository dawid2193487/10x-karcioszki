import type { APIRoute } from "astro";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";
import { createStudySessionSchema } from "@/lib/schemas/study-session.schema";
import { StudySessionService } from "@/lib/services/study-session.service";

export const prerender = false;

/**
 * POST /api/study-sessions
 * Utworzenie nowej sesji nauki dla wybranej talii
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
    const validatedData = createStudySessionSchema.parse(body);

    // 3. Utworzenie sesji przez serwis
    const service = new StudySessionService(locals.supabase);
    const session = await service.createSession(user.id, validatedData);

    // 4. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
