import { getPublicSabaqInfo } from '@/actions/sabaqs';
import { PublicRegistrationForm } from '@/components/enrollments/public-registration-form';
import { RegistrationDetails } from '@/components/enrollments/registration-details';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: Promise<{ sabaqId: string }> }) {
    const { sabaqId } = await params;
    const result = await getPublicSabaqInfo(sabaqId);

    if (!result.success || !result.sabaq) {
        return {
            title: "Sabaq Not Found",
        };
    }

    return {
        title: `${result.sabaq.name} | Nisaab ${result.sabaq.level}`,
    };
}

export default async function PublicRegistrationPage({ params }: { params: Promise<{ sabaqId: string }> }) {
    const { sabaqId } = await params;
    const result = await getPublicSabaqInfo(sabaqId);

    if (!result.success || !result.sabaq) {
        notFound();
    }

    const { sabaq } = result;

    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-10 sm:pt-20 p-4 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
            <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            <div className="relative z-10 w-full max-w-md space-y-8">
                <div className="flex flex-col items-center space-y-6 text-center">
                    {/* Logo */}
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-background shadow-xl">
                        <Image
                            src="/logo.jpg"
                            alt="Logo"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {sabaq.name}
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>Kitab {sabaq.kitaab}</span>
                            <Badge variant="outline" className="ml-2">
                                Nisaab {sabaq.level}
                            </Badge>
                        </div>
                        {sabaq.janab && (
                            <p className="text-sm text-muted-foreground">
                                Taught by: <span className="font-medium text-foreground">{sabaq.janab.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Criteria Alert - Most Important */}
                    <div className="w-full bg-primary/5 border-primary/20 border rounded-lg p-4 text-center shadow-sm">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                            Enrollment Criteria
                        </p>
                        <p className="text-foreground font-medium text-lg">
                            {sabaq.criteria}
                        </p>
                    </div>

                    {/* Details Card */}
                    <RegistrationDetails sabaq={sabaq} sabaqId={sabaqId} />
                </div>

                {
                    new Date(sabaq.enrollmentEndsAt) < new Date() ? (
                        <div className="p-6 rounded-lg bg-destructive/10 text-destructive text-center border border-destructive/20">
                            <h3 className="font-semibold mb-2">Registration Closed</h3>
                            <p className="text-sm opacity-90">
                                Enrollment for this sabaq ended on {format(new Date(sabaq.enrollmentEndsAt), 'MMM d, yyyy')}.
                            </p>
                        </div>
                    ) : (
                        <PublicRegistrationForm
                            sabaqId={sabaqId}
                            sabaqName={sabaq.name}
                        />
                    )
                }
            </div >
        </div >
    );
}
