
import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect, notFound } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { getSessionById } from '@/actions/sessions';
import { getSessionAttendance } from '@/actions/attendance';
import { getSessionQuestions, getUserVotes, getQuestionStats } from '@/actions/questions';
import { QuestionForm } from '@/components/questions/question-form';
import { QuestionList } from '@/components/questions/question-list';
import { QuestionStats } from '@/components/questions/question-stats';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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
            title: `Questions | ${result.session.sabaq.name} | ${date}`,
        };
    } catch (error) {
        console.error("Metadata generation failed:", error);
        return {
            title: "Login",
        };
    }
}

export default async function SessionQuestionsPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();
    if (!session?.user) redirect('/login');

    try {
        await requirePermission('sessions', 'read');
    } catch (error) {
        redirect('/unauthorized');
    }

    const sessionResult = await getSessionById(sessionId);
    const attendanceResult = await getSessionAttendance(sessionId);
    const questionsResult = await getSessionQuestions(sessionId);
    const userVotesResult = await getUserVotes(sessionId);
    const questionStatsResult = await getQuestionStats(sessionId);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;
    const attendances = attendanceResult.success ? attendanceResult.attendances : [];
    const questions = (questionsResult.success ? questionsResult.questions : []) || [];
    const userVotedIds = (userVotesResult.success ? userVotesResult.votedQuestionIds : []) || [];
    const questionStats = questionStatsResult.success ? questionStatsResult.stats : null;

    const isAdmin = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(session.user.role);

    // Check if user has already marked attendance
    const userAttendance = attendances?.find((a) => a.userId === session.user.id);
    const canAskQuestions = !!userAttendance; // Can only ask questions if attended

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
                <p className="text-muted-foreground">
                    Q&A for {sessionData.sabaq.name}
                </p>
            </div>

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

            <QuestionList
                sessionId={sessionId}
                questions={questions!}
                userVotedIds={userVotedIds!}
                isAdmin={isAdmin}
            />
        </div>
    );
}
