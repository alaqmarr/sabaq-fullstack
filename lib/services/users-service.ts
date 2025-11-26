import { BaseService } from './base-service';
import { prisma } from '@/lib/prisma';
import { CACHE_TTL, CACHE_TAGS, cacheKeys } from '@/lib/cache-config';

/**
 * Users service with optimized caching
 * Handles all user-related data fetching
 */
class UsersService extends BaseService {
  /**
   * Get user by ID
   * Uses request-level cache for deduplication
   */
  getById = this.cached(async (id: string) => {
    try {
      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          itsNumber: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'UsersService.getById');
    }
  });

  /**
   * Get all users with optional role filter
   * Uses cross-request cache with 5min TTL
   */
  getAll = this.cached(async (role?: string) => {
    try {
      const where = role ? { role: role as any } : { isActive: true };

      return await prisma.user.findMany({
        where,
        select: {
          id: true,
          itsNumber: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'UsersService.getAll');
    }
  });

  /**
   * Get users by role
   * Uses cross-request cache with 5min TTL for frequently accessed roles
   */
  getByRole = this.cachedWithTTL(
    async (role: string) => {
      try {
        return await prisma.user.findMany({
          where: { role: role as any, isActive: true },
          select: {
            id: true,
            itsNumber: true,
            name: true,
            email: true,
          },
          orderBy: { name: 'asc' },
        });
      } catch (error) {
        this.handleError(error, 'UsersService.getByRole');
      }
    },
    (role) => [cacheKeys.usersByRole(role)],
    {
      revalidate: CACHE_TTL.users,
      tags: CACHE_TAGS.users,
    }
  );

  /**
   * Get user count by role
   * Used for dashboard stats, cached with 5min TTL
   */
  getCountByRole = this.cachedWithTTL(
    async (role: string) => {
      try {
        return await prisma.user.count({
          where: { role: role as any, isActive: true },
        });
      } catch (error) {
        this.handleError(error, 'UsersService.getCountByRole');
      }
    },
    (role) => [cacheKeys.usersByRole(`${role}-count`)],
    {
      revalidate: CACHE_TTL.users,
      tags: CACHE_TAGS.users,
    }
  );

  /**
   * Search users by name or ITS number
   * Uses request-level cache
   */
  search = this.cached(async (query: string) => {
    try {
      return await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { itsNumber: { contains: query } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          itsNumber: true,
          name: true,
          email: true,
          role: true,
        },
        take: 10,
      });
    } catch (error) {
      this.handleError(error, 'UsersService.search');
    }
  });

  /**
   * Invalidate all user caches
   */
  invalidate(): void {
    this.invalidateCache(CACHE_TAGS.users[0]);
  }

  /**
   * Invalidate specific user cache
   */
  invalidateById(id: string): void {
    this.invalidateCacheTags([
      CACHE_TAGS.users[0],
      cacheKeys.user(id),
    ]);
  }
}

// Export singleton instance
export const usersService = new UsersService();
