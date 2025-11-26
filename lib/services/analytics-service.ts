import { BaseService } from './base-service';
import { prisma } from '@/lib/prisma';
import { CACHE_TTL, CACHE_TAGS, cacheKeys } from '@/lib/cache-config';

/**
 * Analytics service with optimized caching and queries
 * Handles all analytics-related data fetching with long cache TTL
 */
class AnalyticsService extends BaseService {
  /**
   * Get dashboard statistics
   * Uses cross-request cache with 5min TTL
   * Optimized with parallel count queries
   */
  getDashboardStats = this.cachedWithTTL(
    async () => {
      try {
        // Parallel aggregation for maximum performance
        const [totalUsers, activeSabaqs, approvedEnrollments, totalSessions, pendingQuestions] =
          await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.sabaq.count({ where: { isActive: true } }),
            prisma.enrollment.count({ where: { status: 'APPROVED' } }),
            prisma.session.count(),
            prisma.question.count({ where: { isAnswered: false } }),
          ]);

        return {
          totalUsers,
          activeSabaqs,
          totalEnrollments: approvedEnrollments,
          totalSessions,
          pendingQuestions,
        };
      } catch (error) {
        this.handleError(error, 'AnalyticsService.getDashboardStats');
      }
    },
    () => [cacheKeys.dashboardStats()],
    {
      revalidate: CACHE_TTL.dashboardStats,
      tags: CACHE_TAGS.analytics,
    }
  );

  /**
   * Get attendance trends (last 10 sessions)
   * Uses cross-request cache with 10min TTL
   * Optimized with select-only queries
   */
  getAttendanceTrends = this.cachedWithTTL(
    async () => {
      try {
        const sessions = await prisma.session.findMany({
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          select: {
            id: true,
            scheduledAt: true,
            attendances: {
              select: {
                isLate: true,
              },
            },
          },
        });

        // Process trends data
        return sessions.reverse().map((session) => {
          const present = session.attendances.filter((a) => !a.isLate).length;
          const late = session.attendances.filter((a) => a.isLate).length;

          return {
            date: session.scheduledAt.toLocaleDateString(),
            present,
            late,
          };
        });
      } catch (error) {
        this.handleError(error, 'AnalyticsService.getAttendanceTrends');
      }
    },
    () => [cacheKeys.attendanceTrends()],
    {
      revalidate: CACHE_TTL.analytics,
      tags: CACHE_TAGS.analytics,
    }
  );

  /**
   * Get enrollment distribution by sabaq
   * Uses cross-request cache with 10min TTL
   */
  getEnrollmentDistribution = this.cachedWithTTL(
    async () => {
      try {
        const sabaqs = await prisma.sabaq.findMany({
          where: { isActive: true },
          select: {
            name: true,
            _count: {
              select: {
                enrollments: {
                  where: { status: 'APPROVED' },
                },
              },
            },
          },
          orderBy: {
            enrollments: {
              _count: 'desc',
            },
          },
          take: 10,
        });

        return sabaqs.map((sabaq) => ({
          sabaq: sabaq.name,
          attendance: sabaq._count.enrollments,
        }));
      } catch (error) {
        this.handleError(error, 'AnalyticsService.getEnrollmentDistribution');
      }
    },
    () => ['enrollment-distribution'],
    {
      revalidate: CACHE_TTL.analytics,
      tags: CACHE_TAGS.analytics,
    }
  );

  /**
   * Invalidate all analytics caches
   * Call after data mutations
   */
  invalidate(): void {
    this.invalidateCache(CACHE_TAGS.analytics[0]);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
