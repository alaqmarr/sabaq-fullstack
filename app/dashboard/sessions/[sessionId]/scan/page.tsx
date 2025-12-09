import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect } from 'next/navigation';
import { requirePermission, requireSessionAccess, checkPermission } from '@/lib/rbac';
import { getSessionById } from '@/actions/sessions';
import { notFound } from 'next/navigation';
import { isRedirectError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SessionScanClient } from './session-scan-client';
import { formatShortDate } from '@/lib/date-utils';

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
    try {
        const { sessionId } = await params;
        const result = await getSessionById(sessionId);

        if (!result.success || !result.session) {
            return {
                title: "Session Not Found",
            };
        }

        const date = formatShortDate(result.session.scheduledAt);
        return {
            title: `Scan | ${result.session.sabaq.name} | ${date}`,
        };
    } catch (error) {
        console.error("Metadata generation failed:", error);
        return {
            title: "Login",
        };
    }
}

export default async function SessionScanPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();

    if (!session?.user) redirect('/login');

    try {
        await requirePermission('scan', 'read');
        await requireSessionAccess(sessionId);
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const sessionResult = await getSessionById(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;
    const canStartSession = await checkPermission(session.user.id, 'sessions', 'start');

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href={`/dashboard/sessions/${sessionId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Session
                    </Button>
                </Link>
            </div>

            <SessionScanClient
                sessionId={sessionId}
                sessionName={sessionData.sabaq.name}
                isActive={sessionData.isActive}
                isAdmin={canStartSession}
            />
        </div>
    );
}
