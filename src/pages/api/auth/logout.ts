import type { APIRoute } from "astro";
import { handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * POST /api/auth/signout
 * Sign out current user and invalidate session
 *
 * Success Response (204):
 * - No content
 *
 * Error Responses:
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out using locals.supabase so cookies are automatically cleared via middleware
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
    }

    // Return success response (cookies are automatically cleared via middleware)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return handleApiError(error);
  }
};
