import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { getSessionById } from '@/actions/sessions';
import { getSessionQuestions, getUserVotes, getQuestionStats } from '@/actions/questions';
import { getSessionAttendance } from '@/actions/attendance';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { QuestionForm } from '@/components/questions/question-form';
import { QuestionList } from '@/components/questions/question-list';
import { QuestionStats } from '@/components/questions/question-stats';
import { Card, CardContent } from '@/components/ui/card';

export default async function SessionQuestionsPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();

    if (!session?.user) redirect('/login');

    try {
        await requirePermission('questions', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    const sessionResult = await getSessionById(sessionId);
    const questionsResult = await getSessionQuestions(sessionId);
    const userVotesResult = await getUserVotes(sessionId);
    const questionStatsResult = await getQuestionStats(sessionId);
    const attendanceResult = await getSessionAttendance(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;
    const questions = (questionsResult.success ? questionsResult.questions : []) || [];
    const userVotedIds = (userVotesResult.success ? userVotesResult.votedQuestionIds : []) || [];
    const questionStats = questionStatsResult.success ? questionStatsResult.stats : null;
    const attendances = attendanceResult.success ? attendanceResult.attendances : [];

    const isAdmin = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(session.user.role);

    // Check if user has attended
    const userAttendance = attendances?.find((a) => a.userId === session.user.id);
    const canAskQuestions = !!userAttendance;

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

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-cred-heading lowercase">Session Questions</h2>
            </div>

            {questionStats && <QuestionStats stats={questionStats} />}

            {canAskQuestions && !isAdmin && (
                <QuestionForm sessionId={sessionId} />
            )}

            {!canAskQuestions && !isAdmin && (
                <Card>
                    <CardContent className="py-6">
                        <p className="text-center text-muted-foreground">
                            You must mark attendance to submit questions
                        </p>
                    </CardContent>
                </Card>
            )}

            <QuestionList
                sessionId={sessionId}
                questions={questions}
                userVotedIds={userVotedIds}
                isAdmin={isAdmin}
            />
        </div>
    );
}
