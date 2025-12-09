import { getSabaqById } from '@/actions/sabaqs';
import { ExportButton } from '@/components/exports/export-button';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { Role } from '@/app/prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function SabaqExportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const { sabaq } = await getSabaqById(id);

    if (!sabaq) notFound();

    const isAdmin = session?.user?.role && ([Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.JANAB, Role.ATTENDANCE_INCHARGE] as Role[]).includes(session.user.role);

    if (!isAdmin) {
        return (
            <div className="flex-1 p-8 pt-6">
                <div className="glass p-8 rounded-lg text-center">
                    <p className="text-red-500">Unauthorized: You do not have permission to export data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Link href={`/dashboard/sabaqs/${sabaq.id}`} className="flex items-center text-muted-foreground hover:text-foreground mb-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to {sabaq.name}
            </Link>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-cred-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Export Data
                    </h2>
                    <p className="text-muted-foreground">
                        Export reports for {sabaq.name}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Master List</CardTitle>
                        <CardDescription>
                            Export all enrollments, attendance summaries, and user details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ExportButton type="sabaq" id={sabaq.id} label="Download Excel Report" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
