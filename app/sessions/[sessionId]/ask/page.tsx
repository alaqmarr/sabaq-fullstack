import { getPublicSessionInfo } from '@/actions/sessions';
import { getSessionQuestions, getUserVotes } from '@/actions/questions';
import { PublicQuestionForm } from '@/components/questions/public-question-form';
import { QuestionsList } from '@/components/questions/questions-list';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

export const preferredRegion = ["sin1"];

export const metadata = {
    title: "Ask a Question",
};

export default async function PublicQuestionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await auth();

    const [sessionResult, questionsResult, userVotesResult] = await Promise.all([
        getPublicSessionInfo(sessionId),
        getSessionQuestions(sessionId),
        getUserVotes(sessionId)
    ]);

    if (!sessionResult.success || !sessionResult.session) {
        notFound();
    }

    const sessionData = sessionResult.session;
    const questions = questionsResult.success && questionsResult.questions ? questionsResult.questions : [];
    const userVotes = userVotesResult.success && userVotesResult.votedQuestionIds ? userVotesResult.votedQuestionIds : [];

    return (
        <div className="min-h-screen flex flex-col items-center p-4 bg-background relative overflow-y-auto">
            {/* Background Elements */}
            <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none" />
            <div className="fixed inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md space-y-8 pt-8 pb-12">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {sessionData.sabaq.name}
                    </h1>
                    <p className="text-muted-foreground">
                        {sessionData.sabaq.kitaab} • {sessionData.sabaq.level}
                    </p>
                </div>

                <PublicQuestionForm
                    sessionId={sessionId}
                    sabaqName={sessionData.sabaq.name}
                />

                <div className="pt-8 border-t border-border/40">
                    <QuestionsList
                        questions={questions}
                        userVotes={userVotes}
                        currentUserId={session?.user?.id}
                    />
                </div>
            </div>
        </div>
    );
}
