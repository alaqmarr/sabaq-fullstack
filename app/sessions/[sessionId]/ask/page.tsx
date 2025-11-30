import { getPublicSessionInfo } from '@/actions/sessions';
import { PublicQuestionForm } from '@/components/questions/public-question-form';
import { notFound } from 'next/navigation';

export const metadata = {
    title: "Ask a Question",
};

export default async function PublicQuestionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const result = await getPublicSessionInfo(sessionId);

    if (!result.success || !result.session) {
        notFound();
    }

    const { session } = result;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
            <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            <div className="relative z-10 w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {session.sabaq.name}
                    </h1>
                    <p className="text-muted-foreground">
                        {session.sabaq.kitaab} • {session.sabaq.level}
                    </p>
                </div>

                <PublicQuestionForm
                    sessionId={sessionId}
                    sabaqName={session.sabaq.name}
                />
            </div>
        </div>
    );
}
