import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { getSessionById } from '@/actions/sessions';
import { getSessionAttendance, getAttendanceStats } from '@/actions/attendance';
import { getSessionQuestions, getUserVotes, getQuestionStats } from '@/actions/questions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { LocationAttendance } from '@/components/attendance/location-attendance';
import { AttendanceList } from '@/components/attendance/attendance-list';
import { AttendanceStats } from '@/components/attendance/attendance-stats';
import { QuestionForm } from '@/components/questions/question-form';
import { QuestionList } from '@/components/questions/question-list';
import { QuestionStats } from '@/components/questions/question-stats';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { ExportButton } from '@/components/exports/export-button';
import { SessionControls } from '@/components/sessions/session-controls';

export default async function SessionDetailPage({ params, searchParams }: { params: Promise<{ sessionId: string }>, searchParams: Promise<{ tab?: string }> }) {
    const { sessionId } = await params;
    const { tab } = await searchParams;
    const session = await auth();

    if (!session?.user) redirect('/login');

    try {
        await requirePermission('sessions', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    const sessionResult = await getSessionById(sessionId);
    const attendanceResult = await getSessionAttendance(sessionId);
    const statsResult = await getAttendanceStats(sessionId);
    const questionsResult = await getSessionQuestions(sessionId);
    const userVotesResult = await getUserVotes(sessionId);
    const questionStatsResult = await getQuestionStats(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;
    const attendances = attendanceResult.success ? attendanceResult.attendances : [];
    const stats = statsResult.success ? statsResult.stats : null;
    const questions = (questionsResult.success ? questionsResult.questions : []) || [];
    const userVotedIds = (userVotesResult.success ? userVotesResult.votedQuestionIds : []) || [];
    const questionStats = questionStatsResult.success ? questionStatsResult.stats : null;

    const isAdmin = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(session.user.role);
    const isActive = sessionData.isActive;
    const allowLocationAttendance = sessionData.sabaq.allowLocationAttendance;

    // Check if user has already marked attendance
    const userAttendance = attendances?.find((a) => a.userId === session.user.id);
    const canAskQuestions = !!userAttendance; // Can only ask questions if attended

    const getStatusBadge = () => {
        if (sessionData.isActive) {
            return <Badge className="bg-green-500">Active</Badge>;
        } else if (sessionData.endedAt) {
            return <Badge variant="secondary">Ended</Badge>;
        } else {
            return <Badge variant="outline">Scheduled</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/sessions">
                            <Button variant="frosted-blue" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{sessionData.sabaq.name}</h2>
                            <p className="text-muted-foreground">
                                {sessionData.sabaq.kitaab} • Nisaab {sessionData.sabaq.level}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <>
                            <SessionControls
                                sessionId={sessionId}
                                isActive={sessionData.isActive}
                                isEnded={!!sessionData.endedAt}
                                hasStarted={!!sessionData.startedAt}
                            />
                            <ExportButton type="session" id={sessionId} />
                        </>
                    )}
                    {getStatusBadge()}
                </div>
            </div>

            {/* Session Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Scheduled Time</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {format(new Date(sessionData.scheduledAt), 'PPP')}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(sessionData.scheduledAt), 'p')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cutoff Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {format(new Date(sessionData.cutoffTime), 'p')}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Late after this time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Location</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {allowLocationAttendance ? 'Enabled' : 'Disabled'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {allowLocationAttendance ? 'Self-attendance allowed' : 'Admin marking only'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Attendance and Questions */}
            <Tabs defaultValue={tab || "attendance"} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="questions">
                        Questions
                        {questionStats && questionStats.totalQuestions > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {questionStats.totalQuestions}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="space-y-6">
                    {/* Attendance Stats */}
                    {stats && <AttendanceStats stats={stats} />}

                    {/* Attendance Actions */}
                    {isActive && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Admin Attendance Form */}
                            {isAdmin && (
                                <AttendanceForm sessionId={sessionId} />
                            )}

                            {/* User Location Attendance */}
                            {!isAdmin && allowLocationAttendance && !userAttendance && (
                                <LocationAttendance sessionId={sessionId} />
                            )}

                            {/* Already Marked */}
                            {!isAdmin && userAttendance && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Attendance Confirmed</CardTitle>
                                        <CardDescription>You have already marked your attendance</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <p className="text-sm">
                                                <span className="font-medium">Time:</span>{' '}
                                                {format(new Date(userAttendance.markedAt), 'PPp')}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">Method:</span>{' '}
                                                {userAttendance.method.replace('_', ' ')}
                                            </p>
                                            {userAttendance.isLate && (
                                                <Badge variant="destructive">
                                                    Late by {userAttendance.minutesLate} minutes
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Attendance List */}
                    <AttendanceList
                        sessionId={sessionId}
                    />
                </TabsContent>

                {/* Questions Tab */}
                <TabsContent value="questions" className="space-y-6">
                    {/* Question Stats */}
                    {questionStats && <QuestionStats stats={questionStats} />}

                    {/* Question Form - Only if user attended */}
                    {canAskQuestions && !isAdmin && (
                        <QuestionForm sessionId={sessionId} />
                    )}

                    {/* Cannot ask questions notice */}
                    {!canAskQuestions && !isAdmin && (
                        <Card>
                            <CardContent className="py-6">
                                <p className="text-center text-muted-foreground">
                                    You must mark attendance to submit questions
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Questions List */}
                    <QuestionList
                        sessionId={sessionId}
                        questions={questions!}
                        userVotedIds={userVotedIds!}
                        isAdmin={isAdmin}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
