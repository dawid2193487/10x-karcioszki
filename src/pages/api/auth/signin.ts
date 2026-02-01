import type { APIRoute } from "astro";
import { signInSchema } from "@/lib/schemas/auth.schema";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * POST /api/auth/signin
 * Authenticate user with email and password
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string
 *
 * Success Response (200):
 * - access_token: JWT token for authenticated requests
 * - refresh_token: Token to refresh access token
 * - user: User data (id, email)
 *
 * Error Responses:
 * - 400: Validation error (invalid email or missing password)
 * - 401: Unauthorized (invalid credentials)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    // Validate input data
    const validationResult = signInSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new ApiError("VALIDATION_ERROR", "Validation failed", 400, errors);
    }

    const { email, password } = validationResult.data;

    // Sign in using locals.supabase so cookies are automatically set via middleware
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw new ApiError("UNAUTHORIZED", "Invalid credentials", 401);
    }

    // Return success response (cookies are automatically set via middleware)
    return new Response(
      JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email!,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
};
