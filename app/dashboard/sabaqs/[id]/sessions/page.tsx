import { getSabaqById } from '@/actions/sabaqs';
import { getSessionsBySabaq } from '@/actions/sessions';
import { notFound } from 'next/navigation';
import { SessionTable } from '@/components/sessions/session-table';
import { SessionHeader } from '@/components/sessions/session-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function SabaqSessionsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { sabaq } = await getSabaqById(id);
    const { sessions } = await getSessionsBySabaq(id);

    if (!sabaq) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href={`/dashboard/sabaqs/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {sabaq.name}
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-cred-heading lowercase">Manage Sessions</h2>
            </div>

            <div className="space-y-4">
                <SessionHeader sabaqId={sabaq.id} />
                <SessionTable sessions={sessions || []} sabaqs={[sabaq]} />
            </div>
        </div>
    );
}
