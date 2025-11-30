'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Send, UserPlus } from 'lucide-react';
import { createPublicEnrollmentRequest } from '@/actions/enrollments';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PublicRegistrationFormProps {
    sabaqId: string;
    sabaqName: string;
}

export function PublicRegistrationForm({ sabaqId, sabaqName }: PublicRegistrationFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (session?.user) {
            // If logged in, redirect to dashboard enrollment
            // Or we could handle it here, but dashboard is better
            router.push(`/dashboard/sabaqs/${sabaqId}`);
            return;
        }

        if (!email.trim() || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createPublicEnrollmentRequest(sabaqId, email);

            if (result.success) {
                setIsSuccess(true);
                toast.success('Enrollment request submitted successfully');
            } else {
                toast.error(result.error || 'Failed to submit request');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="glass-premium w-full max-w-md mx-auto border-green-500/50">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-700">Request Sent!</h3>
                    <p className="text-muted-foreground">
                        Your enrollment request for <strong>{sabaqName}</strong> has been submitted.
                        You will be notified via email once approved.
                    </p>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsSuccess(false)}
                    >
                        Submit Another Request
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-premium w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Register for Sabaq</CardTitle>
                <CardDescription>
                    {session?.user
                        ? `You are logged in as ${session.user.name}`
                        : "Enter your registered email address to request enrollment"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!session?.user && (
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="text-lg"
                            />
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting || (!session?.user && !email)}>
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {session?.user ? 'Go to Dashboard to Enroll' : 'Request Enrollment'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
