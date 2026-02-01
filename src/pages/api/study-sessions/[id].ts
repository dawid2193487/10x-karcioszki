import type { APIRoute } from "astro";
import { ApiError, handleApiError } from "@/lib/utils/error-handler";
import { sessionIdParamSchema } from "@/lib/schemas/study-session.schema";
import { StudySessionService } from "@/lib/services/study-session.service";

export const prerender = false;

/**
 * GET /api/study-sessions/:id
 * Pobranie szczegółów sesji nauki wraz z nazwą talii
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Uwierzytelnianie
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // 2. Walidacja parametru ID
    const sessionId = sessionIdParamSchema.parse(params.id);

    // 3. Pobranie sesji przez serwis
    const service = new StudySessionService(locals.supabase);
    const session = await service.getSession(user.id, sessionId);

    // 4. Zwrócenie odpowiedzi
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
