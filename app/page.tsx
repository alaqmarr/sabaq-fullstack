import { auth } from '@/auth';
import { Suspense } from 'react';
import { ActiveSessionsSection } from '@/components/dashboard/active-sessions';
import { UpcomingSessionsSection } from '@/components/dashboard/upcoming-sessions';
import { ActiveSessionsSkeleton, UpcomingSessionsSkeleton } from '@/components/dashboard/skeletons';
import { UserDashboard } from '@/components/dashboard/user-dashboard';
import { EnrollmentInterface } from '@/components/enrollment/enrollment-interface';
import { ITSValidation } from '@/components/enrollment/its-validation';
import { validateITSNumber } from '@/actions/public-enrollment';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: "Home",
};

import { cookies } from 'next/headers';

export default async function HomePage() {
  const session = await auth();
  const cookieStore = await cookies();
  const guestIts = cookieStore.get('guest_its')?.value;

  let guestUser = null;
  let validationError = '';

  // Server-side validation for guest flow
  if (!session?.user && guestIts) {
    const result = await validateITSNumber(guestIts);
    if (result.success && result.user) {
      guestUser = result.user;
    } else {
      validationError = result.error || 'Validation failed';
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

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
            <h2 className="text-2xl sm:text-3xl text-cred-heading mb-6 text-center lowercase">enroll in new sabaq</h2>
            <EnrollmentInterface
              user={{
                id: session.user.id || '',
                itsNumber: session.user.itsNumber || '',
                name: session.user.name || 'User',
                email: session.user.email || undefined,
                role: session.user.role as string,
              }}
            />
          </div>
        </div>
      ) : (
        // Guest Flow
        guestUser ? (
          <EnrollmentInterface user={{
            ...guestUser,
            email: guestUser.email || undefined,
            role: guestUser.role as string
          }} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
            <LoginForm />
          </div>
        )
      )}
    </div>
  );
}
