import { getUpcomingSessions } from '@/actions/sessions';
import { auth } from '@/auth';
import { Calendar } from 'lucide-react';
import { UpcomingSessionCard } from './upcoming-session-card';

export async function UpcomingSessionsSection() {
    const session = await auth();
    const result = await getUpcomingSessions(7);
    const sessions = result.success && result.sessions ? result.sessions : [];

    return (
        <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Upcoming Sessions
            </h2>
            {sessions.length === 0 ? (
                <p className="text-sm sm:text-base text-muted-foreground">No upcoming sessions scheduled.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {sessions.map((sess: any) => (
                        <UpcomingSessionCard key={sess.id} session={sess} userRole={session?.user?.role || 'MUMIN'} />
                    ))}
                </div>
            )}
        </div>
    );
}
