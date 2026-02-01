import type { APIRoute } from "astro";
import { authService } from "@/lib/services/auth.service";
import { signUpSchema } from "@/lib/schemas/auth.schema";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string (minimum 8 characters)
 *
 * Success Response (200):
 * - access_token: JWT token for authenticated requests
 * - refresh_token: Token to refresh access token
 * - user: User data (id, email, created_at)
 *
 * Error Responses:
 * - 400: Validation error (invalid email or weak password)
 * - 422: Conflict (email already registered)
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
    const validationResult = signUpSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const { email, password } = validationResult.data;

    // Call auth service to register user
    const authResponse = await authService.signUp(email, password);

    // Return success response
    return new Response(JSON.stringify(authResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
