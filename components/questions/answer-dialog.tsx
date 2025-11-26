'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { answerQuestion } from '@/actions/questions';
import { toast } from 'sonner';

interface AnswerDialogProps {
    question: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AnswerDialog({ question, open, onOpenChange }: AnswerDialogProps) {
    const [answerText, setAnswerText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!answerText.trim()) {
            toast.error('Please enter an answer');
            return;
        }

        setLoading(true);
        const result = await answerQuestion(question.id, answerText);

        if (result.success) {
            toast.success('Answer submitted successfully');
            setAnswerText('');
            onOpenChange(false);
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to submit answer');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Answer Question</DialogTitle>
                    <DialogDescription>
                        Provide an answer to help the student
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Original Question */}
                    <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm font-medium mb-2">Question:</p>
                        <p className="text-sm">{question.question}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Asked by {question.user.name}
                        </p>
                    </div>

                    {/* Answer Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="answer">Your Answer</Label>
                            <Textarea
                                id="answer"
                                placeholder="Type your answer here..."
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                rows={6}
                                disabled={loading}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || !answerText.trim()}>
                                {loading ? 'Submitting...' : 'Submit Answer'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
