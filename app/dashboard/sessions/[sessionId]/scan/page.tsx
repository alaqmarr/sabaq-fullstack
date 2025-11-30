import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { getSessionById } from '@/actions/sessions';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SessionScanClient } from './session-scan-client';

export default async function SessionScanPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();

    if (!session?.user) redirect('/login');

    try {
        await requirePermission('scan', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    const sessionResult = await getSessionById(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 max-w-4xl mx-auto">
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
            />
        </div>
    );
}
