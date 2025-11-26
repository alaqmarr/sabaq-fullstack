import { BaseService } from './base-service';
import { prisma } from '@/lib/prisma';
import { CACHE_TTL, CACHE_TAGS, cacheKeys } from '@/lib/cache-config';

/**
 * Attendance service with optimized caching
 * Handles all attendance-related data fetching
 */
class AttendanceService extends BaseService {
  /**
   * Get attendance by session ID
   * Uses request-level cache with short TTL (30s) for real-time data
   */
  getBySessionId = this.cached(async (sessionId: string) => {
    try {
      return await prisma.attendance.findMany({
        where: { sessionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              itsNumber: true,
            },
          },
        },
        orderBy: { markedAt: 'asc' },
      });
    } catch (error) {
      this.handleError(error, 'AttendanceService.getBySessionId');
    }
  });

  /**
   * Get attendance statistics for a session
   * Uses cross-request cache with 60s TTL
   */
  getStats = this.cachedWithTTL(
    async (sessionId: string) => {
      try {
        const sessionData = await prisma.session.findUnique({
          where: { id: sessionId },
          include: {
            sabaq: {
              include: {
                enrollments: {
                  where: { status: 'APPROVED' },
                },
              },
            },
            attendances: true,
          },
        });

        if (!sessionData) {
          throw new Error('Session not found');
        }

        const totalEnrolled = sessionData.sabaq.enrollments.length;
        const totalPresent = sessionData.attendances.length;
        const onTimeCount = sessionData.attendances.filter((a) => !a.isLate).length;
        const lateCount = sessionData.attendances.filter((a) => a.isLate).length;
        const attendancePercentage = totalEnrolled > 0 
          ? Math.round((totalPresent / totalEnrolled) * 100) 
          : 0;

        return {
          totalEnrolled,
          totalPresent,
          onTimeCount,
          lateCount,
          attendancePercentage,
          absent: totalEnrolled - totalPresent,
        };
      } catch (error) {
        this.handleError(error, 'AttendanceService.getStats');
      }
    },
    (sessionId) => [cacheKeys.attendanceStats(sessionId)],
    {
      revalidate: CACHE_TTL.attendanceStats,
      tags: CACHE_TAGS.attendance,
    }
  );

  /**
   * Get user's attendance history
   * Uses request-level cache
   */
  getUserHistory = this.cached(async (userId: string, limit = 10) => {
    try {
      return await prisma.attendance.findMany({
        where: { userId },
        include: {
          session: {
            include: {
              sabaq: {
                select: {
                  id: true,
                  name: true,
                  kitaab: true,
                },
              },
            },
          },
        },
        orderBy: { markedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.handleError(error, 'AttendanceService.getUserHistory');
    }
  });

  /**
   * Get attendance trends (last 10 sessions)
   * Used for analytics dashboard
   */
  getTrends = this.cachedWithTTL(
    async () => {
      try {
        const sessions = await prisma.session.findMany({
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            attendances: {
              select: { isLate: true },
            },
          },
        });

        return sessions.reverse().map((s) => {
          const present = s.attendances.filter(a => !a.isLate).length;
          const late = s.attendances.filter(a => a.isLate).length;
          
          return {
            date: s.scheduledAt.toLocaleDateString(),
            present,
            late,
          };
        });
      } catch (error) {
        this.handleError(error, 'AttendanceService.getTrends');
      }
    },
    () => [cacheKeys.attendanceTrends()],
    {
      revalidate: CACHE_TTL.analytics,
      tags: CACHE_TAGS.attendance,
    }
  );

  /**
   * Invalidate all attendance caches
   */
  invalidate(): void {
    this.invalidateCache(CACHE_TAGS.attendance[0]);
  }

  /**
   * Invalidate session-specific attendance cache
   */
  invalidateBySessionId(sessionId: string): void {
    this.invalidateCacheTags([
      CACHE_TAGS.attendance[0],
      cacheKeys.attendance(sessionId),
    ]);
  }
}

// Export singleton instance
export const attendanceService = new AttendanceService();
