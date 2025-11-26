import { getSabaqById } from '@/actions/sabaqs';
import { getSessionsBySabaq } from '@/actions/sessions';
import { getEnrollmentsBySabaq } from '@/actions/enrollments';
import { SessionTable } from '@/components/sessions/session-table';
import { SessionHeader } from '@/components/sessions/session-header';
import { EnrollmentButton } from '@/components/enrollments/enrollment-button';
import { ExportButton } from '@/components/exports/export-button';
import { EnrollmentsTab } from '@/components/enrollments/enrollments-tab';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export default async function SabaqDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const { sabaq } = await getSabaqById(id);
    const { sessions } = await getSessionsBySabaq(id);
    const { enrollments } = await getEnrollmentsBySabaq(id);

    if (!sabaq) {
        notFound();
    }

    const isAdmin = session?.user?.role && ([Role.SUPERADMIN, Role.ADMIN] as Role[]).includes(session.user.role);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{sabaq.name}</h2>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <ExportButton type="sabaq" id={sabaq.id} label="Export Master List" />
                    )}
                    <EnrollmentButton
                        sabaqId={sabaq.id}
                        enrollmentStartsAt={sabaq.enrollmentStartsAt}
                        enrollmentEndsAt={sabaq.enrollmentEndsAt}
                    />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Kitaab</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sabaq.kitaab}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground font-medium">Nisaab</div>
                        <div className="text-2xl font-bold">{sabaq.level}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enrollment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {format(new Date(sabaq.enrollmentStartsAt), 'dd/MM/yy')} -{' '}
                            {format(new Date(sabaq.enrollmentEndsAt), 'dd/MM/yy')}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{enrollments?.length || 0}</div>
                        <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                                {enrollments?.filter(e => e.status === 'APPROVED').length || 0} Approved
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="sessions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="enrollments">
                            Enrollments
                            {enrollments && enrollments.filter(e => e.status === 'PENDING').length > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {enrollments.filter(e => e.status === 'PENDING').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="sessions" className="space-y-4">
                    <SessionHeader sabaqId={sabaq.id} />
                    <SessionTable sessions={sessions || []} sabaqs={[sabaq]} />
                </TabsContent>
                {isAdmin && (
                    <TabsContent value="enrollments">
                        <EnrollmentsTab enrollments={enrollments || []} sabaqId={sabaq.id} sabaqName={sabaq.name} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
