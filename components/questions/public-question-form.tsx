'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Send, ShieldCheck } from 'lucide-react';
import { submitQuestionPublic } from '@/actions/questions';
import { useSession } from 'next-auth/react';

interface PublicQuestionFormProps {
    sessionId: string;
    sabaqName: string;
}

export function PublicQuestionForm({ sessionId, sabaqName }: PublicQuestionFormProps) {
    const { data: session } = useSession();
    const [itsNumber, setItsNumber] = useState('');
    const [question, setQuestion] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If logged in, we are already verified
    if (session?.user && !isVerified) {
        setIsVerified(true);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setIsSubmitting(true);
        try {
            // If logged in, we don't need to send ITS, the action will use the session
            // If guest, we send the verified ITS
            const result = await submitQuestionPublic({
                sessionId,
                question,
                itsNumber: session?.user ? undefined : itsNumber
            });

            if (result.success) {
                toast.success('Question submitted successfully');
                setQuestion('');
                // If guest, keep verified state so they can ask more
            } else {
                toast.error(result.error || 'Failed to submit question');
                if (result.error === 'Unauthorized' || result.error === 'User not found') {
                    setIsVerified(false); // Force re-verification if auth failed
                }
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{8}$/.test(itsNumber)) {
            toast.error('Please enter a valid 8-digit ITS number');
            return;
        }
        // We don't strictly verify against DB here to avoid exposing user existence
        // We let the submission action handle the strict check. 
        // This is just a UI state to show the question form.
        setIsVerified(true);
    };

    if (!isVerified) {
        return (
            <Card className="glass-premium w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-center">Verify Identity</CardTitle>
                </div>
                <Button type="submit" className="w-full" disabled={itsNumber.length !== 8}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify & Continue
                </Button>
            </form>
                </CardContent >
            </Card >
        );
    }

    return (
        <Card className="glass-premium w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
                <CardDescription>
                    Posting as: {session?.user ? session.user.name : `ITS ${itsNumber}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="Type your question here..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={4}
                        className="resize-none"
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting || !question.trim()}>
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Submit Question
                    </Button>
                    {!session?.user && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={() => {
                                setIsVerified(false);
                                setItsNumber('');
                            }}
                        >
                            Not you? Change ITS
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
