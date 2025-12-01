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
import { cookies } from 'next/headers';

export const metadata = {
  title: "Home | Sabaq Management System",
};

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section with Ilm Quote */}
      <div className="relative overflow-hidden bg-primary/5 border-b border-primary/10">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-black/10" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-arabic text-primary drop-shadow-sm" style={{ fontFamily: "'Traditional Arabic', serif", lineHeight: "1.4" }}>
              طَلَبُ العِلْمُ فَرِيضَةٌ عَلَىٰ كُلِّ مُسْلِمٍ وَمُسْلِمَةٍ
            </h1>
            <p className="text-muted-foreground text-sm md:text-base italic max-w-2xl mx-auto">
              "Seeking knowledge is an obligation upon every Muslim and Muslimah"
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* Content - Sessions First for Logged In Users */}
        {session?.user ? (
          <div className="space-y-10 animate-slide-up">
            {/* SESSION CARDS AT THE VERY TOP - Priority #1 */}
            <div className="space-y-8">
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
            <div className="pt-10 border-t border-border/40">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground lowercase tracking-tight">enroll in new sabaq</h2>
                <p className="text-muted-foreground mt-2">Browse and join available sabaqs to continue your journey of knowledge</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-sm">
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
          </div>
        ) : (
          // Guest Flow
          <div className="max-w-md mx-auto animate-slide-up">
            {guestUser ? (
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-6 shadow-lg">
                <EnrollmentInterface user={{
                  ...guestUser,
                  email: guestUser.email || undefined,
                  role: guestUser.role as string
                }} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-full bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-1 shadow-lg">
                  <LoginForm />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
