import type { ErrorResponseDTO, ErrorCode, ErrorDetail } from "../../types";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number,
    public details?: ErrorDetail[]
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON(): ErrorResponseDTO {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }

  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

/**
 * Handle any error and convert it to a standardized API response
 * @param error - The error to handle
 * @returns Response with appropriate status code and error details
 */
export function handleApiError(error: unknown): Response {
  // eslint-disable-next-line no-console
  console.error("API Error:", error);

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    return new ApiError(
      "VALIDATION_ERROR",
      "Validation failed",
      400,
      error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }))
    ).toResponse();
  }

  // Known API errors
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  // Unknown errors - don't leak internal details
  return new ApiError("INTERNAL_ERROR", "An unexpected error occurred. Please try again later.", 500).toResponse();
}
