import { auth } from '@/auth';
import { Suspense } from 'react';
import { ActiveSessionsSection } from '@/components/dashboard/active-sessions';
import { UpcomingSessionsSection } from '@/components/dashboard/upcoming-sessions';
import { ActiveSessionsSkeleton, UpcomingSessionsSkeleton } from '@/components/dashboard/skeletons';
import { UserDashboard } from '@/components/dashboard/user-dashboard';
import { EnrollmentInterface } from '@/components/enrollment/enrollment-interface';
import { PublicEnrollmentWrapper } from '@/components/enrollment/public-enrollment-wrapper';

export const metadata = {
  title: "Home",
};

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
          Asbaaq Management
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Comprehensive sabaq session management with real-time tracking
        </p>
      </div>

      {/* Content - Sessions First for Logged In Users */}
      {session?.user ? (
        <div className="space-y-8">
          {/* SESSION CARDS AT THE VERY TOP - Priority #1 */}
          <div className="space-y-6">
            <Suspense fallback={<ActiveSessionsSkeleton />}>
              <ActiveSessionsSection />
            </Suspense>

            <Suspense fallback={<UpcomingSessionsSkeleton />}>
              <UpcomingSessionsSection />
            </Suspense>
          </div>

          {/* User Dashboard - Enrollment Status */}
          <UserDashboard user={session.user} />

          {/* Enroll in New Sabaq */}
          <div className="pt-8 border-t border-border/40">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Enroll in New Sabaq</h2>
            <div className="max-w-2xl mx-auto">
              <EnrollmentInterface
                user={{
                  id: session.user.id,
                  itsNumber: session.user.itsNumber,
                  name: session.user.name || 'User',
                  email: session.user.email || undefined,
                  role: session.user.role,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto">
          <PublicEnrollmentWrapper />
        </div>
      )}
    </div>
  );
}
