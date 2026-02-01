import { z } from "zod";

/**
 * Schema for user sign up validation
 * Validates email format and password strength
 */
export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Schema for user sign in validation
 * Validates email format and password presence
 */
export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for refresh token validation
 * Ensures refresh token is provided
 */
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});
