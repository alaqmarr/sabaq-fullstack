import { BaseService } from './base-service';
import { prisma } from '@/lib/prisma';
import { CACHE_TTL, CACHE_TAGS, cacheKeys } from '@/lib/cache-config';

/**
 * Sabaqs service with optimized caching
 * Handles all sabaq-related data fetching
 */
class SabaqsService extends BaseService {
  /**
   * Get sabaq by ID
   * Uses request-level cache
   */
  getById = this.cached(async (id: string) => {
    try {
      return await prisma.sabaq.findUnique({
        where: { id },
        include: {
          location: true,
          _count: {
            select: {
              enrollments: true,
              sessions: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'SabaqsService.getById');
    }
  });

  /**
   * Get all active sabaqs
   * Uses cross-request cache with 5min TTL
   */
  getAll = this.cachedWithTTL(
    async () => {
      try {
        return await prisma.sabaq.findMany({
          where: { isActive: true },
          include: {
            location: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            _count: {
              select: {
                enrollments: {
                  where: { status: 'APPROVED' },
                },
                sessions: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });
      } catch (error) {
        this.handleError(error, 'SabaqsService.getAll');
      }
    },
    () => [cacheKeys.sabaqs()],
    {
      revalidate: CACHE_TTL.sabaqs,
      tags: CACHE_TAGS.sabaqs,
    }
  );

  /**
   * Get sabaq details with enrollments
   * Used for sabaq detail page
   */
  getDetails = this.cached(async (id: string) => {
    try {
      return await prisma.sabaq.findUnique({
        where: { id },
        include: {
          location: true,
          enrollments: {
            where: { status: 'APPROVED' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  itsNumber: true,
                },
              },
            },
          },
          sessions: {
            orderBy: { scheduledAt: 'desc' },
            take: 10,
            include: {
              _count: {
                select: {
                  attendances: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'SabaqsService.getDetails');
    }
  });

  /**
   * Get active sabaqs count
   * Used for dashboard stats
   */
  getCount = this.cachedWithTTL(
    async () => {
      try {
        return await prisma.sabaq.count({
          where: { isActive: true },
        });
      } catch (error) {
        this.handleError(error, 'SabaqsService.getCount');
      }
    },
    () => ['sabaqs-count'],
    {
      revalidate: CACHE_TTL.sabaqs,
      tags: CACHE_TAGS.sabaqs,
    }
  );

  /**
   * Invalidate all sabaq caches
   */
  invalidate(): void {
    this.invalidateCache(CACHE_TAGS.sabaqs[0]);
  }

  /**
   * Invalidate specific sabaq cache
   */
  invalidateById(id: string): void {
    this.invalidateCacheTags([
      CACHE_TAGS.sabaqs[0],
      cacheKeys.sabaq(id),
    ]);
  }
}

// Export singleton instance
export const sabaqsService = new SabaqsService();
