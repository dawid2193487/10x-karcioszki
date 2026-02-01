import { supabaseClient } from "../../db/supabase.client";
import type { SupabaseClient } from "../../db/supabase.client";
import type { AuthResponseDTO } from "../../types";
import { ApiError } from "../utils/error-handler";
import { AuthError } from "@supabase/supabase-js";

/**
 * Auth Service - handles authentication operations through Supabase Auth
 * Acts as a thin wrapper around Supabase Auth API
 */
export class AuthService {
  /**
   * Register a new user with email and password
   * @param email - User's email address
   * @param password - User's password (minimum 8 characters)
   * @returns Authentication response with tokens and user data
   * @throws ApiError with CONFLICT code if email already registered
   * @throws ApiError with VALIDATION_ERROR code if password is weak
   * @throws ApiError with INTERNAL_ERROR code for unexpected errors
   */
  async signUp(email: string, password: string): Promise<AuthResponseDTO> {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        return this.handleAuthError(error);
      }

      if (!data.user || !data.session) {
        throw new ApiError("INTERNAL_ERROR", "Failed to create user session", 500);
      }

      return this.mapAuthResponse({
        user: data.user,
        session: data.session,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("INTERNAL_ERROR", "An unexpected error occurred during sign up", 500);
    }
  }

  /**
   * Sign in user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Authentication response with tokens and user data
   * @throws ApiError with UNAUTHORIZED code if credentials are invalid
   * @throws ApiError with INTERNAL_ERROR code for unexpected errors
   */
  async signIn(email: string, password: string): Promise<AuthResponseDTO> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return this.handleAuthError(error);
      }

      if (!data.user || !data.session) {
        throw new ApiError("UNAUTHORIZED", "Invalid credentials", 401);
      }

      return this.mapAuthResponse({
        user: data.user,
        session: data.session,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("INTERNAL_ERROR", "An unexpected error occurred during sign in", 500);
    }
  }

  /**
   * Sign out current user
   * @param supabase - Supabase client instance with user's token from context
   * @throws ApiError with UNAUTHORIZED code if token is invalid
   * @throws ApiError with INTERNAL_ERROR code for unexpected errors
   */
  async signOut(supabase: SupabaseClient): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return this.handleAuthError(error);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("INTERNAL_ERROR", "An unexpected error occurred during sign out", 500);
    }
  }

  /**
   * Refresh user's access token using refresh token
   * @param refreshToken - Valid refresh token
   * @returns Authentication response with new tokens
   * @throws ApiError with UNAUTHORIZED code if refresh token is invalid or expired
   * @throws ApiError with INTERNAL_ERROR code for unexpected errors
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDTO> {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return this.handleAuthError(error);
      }

      if (!data.session) {
        throw new ApiError("UNAUTHORIZED", "Invalid or expired refresh token", 401);
      }

      if (!data.user) {
        throw new ApiError("INTERNAL_ERROR", "User data missing in refresh response", 500);
      }

      return this.mapAuthResponse({
        user: data.user,
        session: data.session,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("INTERNAL_ERROR", "An unexpected error occurred during token refresh", 500);
    }
  }

  /**
   * Map Supabase auth response to our AuthResponseDTO format
   * @private
   */
  private mapAuthResponse(data: {
    user: { id: string; email?: string; created_at?: string };
    session: { access_token: string; expires_in: number; refresh_token: string };
  }): AuthResponseDTO {
    return {
      access_token: data.session.access_token,
      token_type: "bearer",
      expires_in: data.session.expires_in,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email || "",
        created_at: data.user.created_at,
      },
    };
  }

  /**
   * Handle Supabase Auth errors and map to ApiError
   * @private
   */
  private handleAuthError(error: AuthError): never {
    // User already exists
    if (error.message.includes("User already registered") || error.message.includes("already registered")) {
      throw new ApiError("CONFLICT", "Email already registered", 422);
    }

    // Invalid credentials
    if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid credentials")) {
      throw new ApiError("UNAUTHORIZED", "Invalid credentials", 401);
    }

    // Weak password
    if (error.message.includes("Password") && error.message.includes("weak")) {
      throw new ApiError("VALIDATION_ERROR", "Password is too weak", 400, [
        { field: "password", message: "Password is too weak" },
      ]);
    }

    // Invalid refresh token
    if (error.message.includes("refresh") || error.message.includes("Invalid Refresh Token")) {
      throw new ApiError("UNAUTHORIZED", "Invalid or expired refresh token", 401);
    }

    // Generic auth error
    if (error.status === 401 || error.status === 403) {
      throw new ApiError("UNAUTHORIZED", "Authentication failed", 401);
    }

    // Fallback to internal error
    throw new ApiError("INTERNAL_ERROR", "An authentication error occurred", 500);
  }
}

// Export singleton instance
export const authService = new AuthService();
