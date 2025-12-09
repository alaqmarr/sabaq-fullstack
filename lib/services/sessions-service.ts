import { BaseService } from "./base-service";
import { prisma } from "@/lib/prisma";
import { CACHE_TTL, CACHE_TAGS, cacheKeys } from "@/lib/cache-config";
import { Session } from "@/app/prisma/client";

/**
 * Sessions service with optimized caching
 * Handles all session-related data fetching with request and cross-request caching
 */
class SessionsService extends BaseService {
  /**
   * Get session by ID
   * Uses request-level cache (React cache) for deduplication
   */
  getById = this.cached(async (id: string) => {
    try {
      return await prisma.session.findUnique({
        where: { id },
        include: {
          sabaq: {
            select: {
              id: true,
              name: true,
              kitaab: true,
              location: true,
            },
          },
          _count: {
            select: {
              attendances: true,
            },
          },
        },
      });
    } catch (error) {
      this.handleError(error, "SessionsService.getById");
    }
  });

  /**
   * Get active sessions
   * Uses cross-request cache with 30s TTL
   */
  getActiveSessions = this.cachedWithTTL(
    async () => {
      try {
        return await prisma.session.findMany({
          where: { isActive: true },
          include: {
            sabaq: {
              select: {
                id: true,
                name: true,
                kitaab: true,
                location: true, // Include location
                allowLocationAttendance: true,
              },
            },
            _count: {
              select: {
                attendances: true,
              },
            },
          },
          orderBy: { scheduledAt: "desc" },
        });
      } catch (error) {
        this.handleError(error, "SessionsService.getActiveSessions");
      }
    },
    () => [cacheKeys.activeSessions()],
    {
      revalidate: CACHE_TTL.activeSessions,
      tags: CACHE_TAGS.sessions,
    }
  );

  /**
   * Get upcoming sessions (next 7 days)
   * Uses cross-request cache with 60s TTL
   */
  getUpcomingSessions = this.cachedWithTTL(
    async () => {
      try {
        const now = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        return await prisma.session.findMany({
          where: {
            scheduledAt: {
              gte: now,
              lte: weekFromNow,
            },
            isActive: false,
          },
          include: {
            sabaq: {
              select: {
                id: true,
                name: true,
                kitaab: true,
              },
            },
          },
          orderBy: { scheduledAt: "asc" },
          take: 10,
        });
      } catch (error) {
        this.handleError(error, "SessionsService.getUpcomingSessions");
      }
    },
    () => [cacheKeys.sessions()],
    {
      revalidate: CACHE_TTL.sessions,
      tags: CACHE_TAGS.sessions,
    }
  );

  /**
   * Get sessions by Sabaq ID
   * Uses request-level cache
   */
  getBySabaqId = this.cached(async (sabaqId: string) => {
    try {
      return await prisma.session.findMany({
        where: { sabaqId },
        include: {
          _count: {
            select: {
              attendances: true,
              questions: true,
            },
          },
        },
        orderBy: { scheduledAt: "desc" },
      });
    } catch (error) {
      this.handleError(error, "SessionsService.getBySabaqId");
    }
  });

  /**
   * Get all sessions with pagination
   * Uses request-level cache
   */
  getAll = this.cached(
    async (options?: { skip?: number; take?: number; sabaqId?: string }) => {
      try {
        const where = options?.sabaqId ? { sabaqId: options.sabaqId } : {};

        const [sessions, total] = await Promise.all([
          prisma.session.findMany({
            where,
            include: {
              sabaq: {
                select: {
                  id: true,
                  name: true,
                  kitaab: true,
                },
              },
              _count: {
                select: {
                  attendances: true,
                },
              },
            },
            orderBy: { scheduledAt: "desc" },
            skip: options?.skip || 0,
            take: options?.take || 50,
          }),
          prisma.session.count({ where }),
        ]);

        return { sessions, total };
      } catch (error) {
        this.handleError(error, "SessionsService.getAll");
      }
    }
  );

  /**
   * Get session details with all related data
   * Optimized single query with all necessary includes
   */
  getDetails = this.cached(async (id: string) => {
    try {
      return await prisma.session.findUnique({
        where: { id },
        include: {
          sabaq: {
            include: {
              location: true,
              enrollments: {
                where: { status: "APPROVED" },
                select: {
                  userId: true,
                },
              },
            },
          },
          attendances: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  itsNumber: true,
                },
              },
            },
            orderBy: { markedAt: "asc" },
          },
          questions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  itsNumber: true,
                },
              },
            },
            orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    } catch (error) {
      this.handleError(error, "SessionsService.getDetails");
    }
  });

  /**
   * Invalidate all session caches
   * Call this after creating/updating/deleting sessions
   */
  invalidate(): void {
    this.invalidateCache(CACHE_TAGS.sessions[0]);
  }

  /**
   * Invalidate specific session cache
   */
  invalidateById(id: string): void {
    this.invalidateCacheTags([CACHE_TAGS.sessions[0], cacheKeys.session(id)]);
  }
}

// Export singleton instance
export const sessionsService = new SessionsService();
