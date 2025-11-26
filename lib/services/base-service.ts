import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Base service class providing caching utilities
 * All domain services should extend this class
 */
export class BaseService {
  /**
   * Wrap a function with React cache for request-level deduplication
   * Use this for data that can be shared within a single request
   */
  protected cached<T extends (...args: any[]) => any>(fn: T): T {
    return cache(fn) as T;
  }

  /**
   * Wrap a function with Next.js unstable_cache for cross-request caching
   * Use this for data that can be shared across multiple requests
   * 
   * For functions without parameters, pass the function directly
   * For functions with parameters, use a factory pattern
   */
  protected cachedWithTTL<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyGenerator: (...args: TArgs) => string[],
    options: {
      revalidate?: number;
      tags?: readonly string[];
    }
  ): (...args: TArgs) => Promise<TResult> {
    return (...args: TArgs) => {
      const cacheKey = keyGenerator(...args);
      return unstable_cache(
        () => fn(...args),
        cacheKey,
        {
          ...options,
          // Cast readonly tags to mutable for Next.js unstable_cache
          tags: options.tags ? [...options.tags] : undefined,
        }
      )();
    };
  }

  /**
   * Invalidate cache by tag
   * Call this after mutations to ensure fresh data
   */
  protected invalidateCache(tag: string): void {
    // Note: Next.js 16 revalidateTag requires a profile parameter
    // Using empty object as default for now
    revalidateTag(tag, {});
  }

  /**
   * Invalidate multiple cache tags
   */
  protected invalidateCacheTags(tags: string[]): void {
    tags.forEach(tag => revalidateTag(tag, {}));
  }

  /**
   * Helper to handle errors consistently across services
   */
  protected handleError(error: unknown, context: string): never {
    console.error(`[${context}] Error:`, error);
    throw error instanceof Error 
      ? error 
      : new Error(`Unknown error in ${context}`);
  }

  /**
   * Helper to extract safe error message for client
   */
  protected getSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

/**
 * Type-safe cache wrapper for standalone functions
 */
export function withCache<T extends (...args: any[]) => any>(fn: T): T {
  return cache(fn) as T;
}

/**
 * Type-safe unstable_cache wrapper
 */
export function withTTLCache<T>(
  fn: () => Promise<T>,
  keys: string[],
  options: {
    revalidate?: number;
    tags?: string[];
  }
): () => Promise<T> {
  return unstable_cache(fn, keys, options);
}
