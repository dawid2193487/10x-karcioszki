import type { APIRoute } from "astro";
import { authService } from "@/lib/services/auth.service";
import { refreshTokenSchema } from "@/lib/schemas/auth.schema";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 *
 * Request Body:
 * - refresh_token: string (valid refresh token)
 *
 * Success Response (200):
 * - access_token: New JWT token for authenticated requests
 * - refresh_token: New refresh token
 * - expires_in: Token expiration time in seconds
 *
 * Error Responses:
 * - 400: Validation error (missing refresh token)
 * - 401: Unauthorized (invalid or expired refresh token)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    // Validate input data
    const validationResult = refreshTokenSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const { refresh_token } = validationResult.data;

    // Call auth service to refresh token
    const authResponse = await authService.refreshToken(refresh_token);

    // Return success response with cookies set
    return new Response(JSON.stringify(authResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": [
          `sb-access-token=${authResponse.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${authResponse.expires_in || 3600}`,
          `sb-refresh-token=${authResponse.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
        ].join(", "),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
