import { getPublicSabaqInfo } from '@/actions/sabaqs';
import { PublicRegistrationForm } from '@/components/enrollments/public-registration-form';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export const metadata = {
    title: "Sabaq Registration",
};

export default async function PublicRegistrationPage({ params }: { params: Promise<{ sabaqId: string }> }) {
    const { sabaqId } = await params;
    const result = await getPublicSabaqInfo(sabaqId);

    if (!result.success || !result.sabaq) {
        notFound();
    }

    const { sabaq } = result;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
            <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            <div className="relative z-10 w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {sabaq.name}
                    </h1>

                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{sabaq.kitaab}</span>
                        <Badge variant="outline" className="ml-2">
                            {sabaq.level}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Enrollment open until {format(new Date(sabaq.enrollmentEndsAt), 'MMM d, yyyy')}</span>
                    </div>

                    {sabaq.description && (
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            {sabaq.description}
                        </p>
                    )}
                </div>

                <PublicRegistrationForm
                    sabaqId={sabaqId}
                    sabaqName={sabaq.name}
                />
            </div>
        </div>
    );
}
