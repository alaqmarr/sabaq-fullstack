import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SessionEditClient } from './session-edit-client';
import { formatShortDateTime } from '@/lib/date-utils';
import { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';

export const preferredRegion = ["sin1"];

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
    const { sessionId } = await params;
    return {
        title: `Edit Session | ${sessionId}`,
    };
}

export default async function SessionEditPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const authSession = await auth();

    if (!authSession?.user) redirect('/login');

    // STRICT PERMISSION: Only SUPERADMIN and ADMIN can access this page
    const user = await prisma.user.findUnique({
        where: { id: authSession.user.id },
        select: { role: true },
    });

    if (!user || !['SUPERADMIN', 'ADMIN'].includes(user.role)) {
        redirect('/unauthorized');
    }

    // Fetch session details
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            sabaq: {
                select: {
                    id: true,
                    name: true,
                    admins: {
                        select: { userId: true }
                    }
                }
            }
        }
    });

    if (!session) {
        notFound();
    }

    // For non-SUPERADMIN, ensure they are a sabaq admin
    if (user.role === 'ADMIN') {
        const isSabaqAdmin = session.sabaq.admins.some(a => a.userId === authSession.user.id);
        if (!isSabaqAdmin) {
            redirect('/unauthorized');
        }
    }

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href={`/dashboard/sessions/${sessionId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Session
                    </Button>
                </Link>
            </div>

            <PageHeader
                title="Edit Session"
                description={`${session.sabaq.name} - ${formatShortDateTime(session.scheduledAt)}`}
            />

            <SessionEditClient
                sessionId={sessionId}
                sabaqName={session.sabaq.name}
                sabaqId={session.sabaqId}
                currentScheduledAt={session.scheduledAt.toISOString()}
                currentCutoffTime={session.cutoffTime.toISOString()}
                isActive={session.isActive}
                isEnded={!!session.endedAt}
            />
        </div>
    );
}
