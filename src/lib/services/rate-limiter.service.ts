interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

export class RateLimiterService {
  private cache = new Map<string, RateLimitInfo>();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if user has exceeded rate limit
   * @param userId - The user's ID
   * @returns true if request is allowed, false if rate limit exceeded
   */
  check(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.cache.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
      // First request or window expired - reset
      this.cache.set(userId, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return true;
    }

    if (userLimit.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    userLimit.count++;
    return true;
  }

  /**
   * Get remaining requests for user
   * @param userId - The user's ID
   * @returns number of remaining requests
   */
  getRemaining(userId: string): number {
    const now = Date.now();
    const userLimit = this.cache.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - userLimit.count);
  }

  /**
   * Get timestamp when rate limit resets
   * @param userId - The user's ID
   * @returns Unix timestamp in milliseconds
   */
  getResetAt(userId: string): number {
    const userLimit = this.cache.get(userId);
    return userLimit?.resetAt || Date.now() + this.config.windowMs;
  }

  /**
   * Clean up expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, info] of this.cache.entries()) {
      if (now > info.resetAt) {
        this.cache.delete(userId);
      }
    }
  }
}

export const aiGenerationRateLimiter = new RateLimiterService({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
});

// Cleanup expired entries every 5 minutes
setInterval(() => aiGenerationRateLimiter.cleanup(), 300000);
