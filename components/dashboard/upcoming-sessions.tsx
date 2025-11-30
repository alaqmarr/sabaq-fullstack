import { getUpcomingSessions } from '@/actions/sessions';
import { auth } from '@/auth';
import { Calendar } from 'lucide-react';
import { SessionCard } from './session-card';

export async function UpcomingSessionsSection() {
    const session = await auth();
    const result = await getUpcomingSessions(7);
    const sessions = result.success && result.sessions ? result.sessions : [];

    if (sessions.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-lg sm:text-xl text-cred-heading mb-3 sm:mb-4 flex items-center gap-2 lowercase">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                upcoming sessions
            </h2>
            <div className="flex flex-col gap-4">
                {sessions.map((sess: any) => (
                    <SessionCard key={sess.id} session={sess} userRole={session?.user?.role || 'MUMIN'} variant="upcoming" />
                ))}
            </div>
        </div>
    );
}
