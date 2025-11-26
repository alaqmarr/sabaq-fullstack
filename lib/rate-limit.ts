import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiters: Record<string, RateLimiterMemory> = {
  login: new RateLimiterMemory({
    points: 5, // 5 attempts
    duration: 15 * 60, // per 15 minutes
  }),
  attendance: new RateLimiterMemory({
    points: 10, // 10 attempts
    duration: 60, // per minute
  }),
  api: new RateLimiterMemory({
    points: 100, // 100 requests
    duration: 60, // per minute
  }),
  email: new RateLimiterMemory({
    points: 50, // 50 emails
    duration: 60 * 60, // per hour
  }),
};

export async function checkRateLimit(key: string, type: keyof typeof rateLimiters = 'api') {
  try {
    const limiter = rateLimiters[type];
    if (!limiter) {
      throw new Error(`Rate limiter type '${type}' not found`);
    }
    await limiter.consume(key);
  } catch (error) {
    throw new Error('Too many requests. Please try again later.');
  }
}
