import { getSessionsBySabaq } from '@/actions/sessions';
import { getSabaqById } from '@/actions/sabaqs';
import { SessionTable } from '@/components/sessions/session-table';
import { SessionHeader } from '@/components/sessions/session-header';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { requireSabaqAccess } from '@/lib/rbac';

import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const { id } = await params;
        const { sabaq } = await getSabaqById(id);

        if (!sabaq) {
            return {
                title: "Sabaq Not Found",
            };
        }

        return {
            title: `${sabaq.name} | Sessions`,
        };
    } catch (error) {
        console.error("Metadata generation failed:", error);
        return {
            title: "Login",
        };
    }
}

export default async function SabaqSessionsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Enforce Granular Access
    await requireSabaqAccess(id);

    const { sabaq } = await getSabaqById(id);
    const { sessions } = await getSessionsBySabaq(id);

    if (!sabaq) notFound();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Link href={`/dashboard/sabaqs/${sabaq.id}`} className="flex items-center text-muted-foreground hover:text-foreground mb-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to {sabaq.name}
            </Link>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Sessions
                    </h2>
                    <p className="text-muted-foreground">
                        Manage sessions for {sabaq.name}
                    </p>
                </div>
            </div>
            <SessionHeader sabaqId={sabaq.id} />
            <SessionTable sessions={sessions || []} sabaqs={[sabaq]} />
        </div>
    );
}
