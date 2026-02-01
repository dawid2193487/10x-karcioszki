import type { APIRoute } from "astro";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * POST /api/auth/signout
 * Sign out current user and invalidate session
 *
 * Request Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Success Response (204):
 * - No content
 *
 * Error Responses:
 * - 401: Unauthorized (missing or invalid token)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals, request, cookies }) => {
  try {
    // Verify Authorization header or cookie is present
    const authHeader = request.headers.get("Authorization");
    const cookieToken = cookies.get("sb-access-token")?.value;

    if (!authHeader?.startsWith("Bearer ") && !cookieToken) {
      throw new ApiError("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    // Sign out using locals.supabase so cookies are automatically cleared via middleware
    await locals.supabase.auth.signOut();

    // Return success response (cookies are automatically cleared via middleware)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
