'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { submitQuestion } from '@/actions/questions';
import { toast } from 'sonner';
import { MessageSquarePlus } from 'lucide-react';

interface QuestionFormProps {
    sessionId: string;
    onSuccess?: () => void;
}

export function QuestionForm({ sessionId, onSuccess }: QuestionFormProps) {
    const [questionText, setQuestionText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!questionText.trim()) {
            toast.error('Please enter a question');
            return;
        }

        setLoading(true);
        const result = await submitQuestion(sessionId, questionText);

        if (result.success) {
            toast.success('Question submitted successfully');
            setQuestionText('');
            onSuccess?.();
        } else {
            toast.error(result.error || 'Failed to submit question');
        }
        setLoading(false);
    };

    const remainingChars = 500 - questionText.length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 lowercase">
                    <MessageSquarePlus className="h-5 w-5" />
                    ask a question
                </CardTitle>
                <CardDescription className="lowercase">
                    submit your question for this session. you can upvote other questions too.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="question" className="lowercase">your question</Label>
                        <Textarea
                            id="question"
                            placeholder="what would you like to ask?"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            maxLength={500}
                            rows={4}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground text-right lowercase">
                            {remainingChars} characters remaining
                        </p>
                    </div>
                    <Button type="submit" disabled={loading || !questionText.trim()} className="w-full lowercase">
                        {loading ? 'submitting...' : 'submit question'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
