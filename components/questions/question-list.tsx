'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { upvoteQuestion, deleteQuestion } from '@/actions/questions';
import { AnswerDialog } from './answer-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ThumbsUp, Trash, MessageSquare, CheckCircle } from 'lucide-react';

interface QuestionListProps {
    sessionId: string;
    questions: any[];
    userVotedIds: string[];
    isAdmin?: boolean;
}

export function QuestionList({ sessionId, questions, userVotedIds, isAdmin = false }: QuestionListProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [answeringQuestion, setAnsweringQuestion] = useState<any>(null);
    const [votedIds, setVotedIds] = useState<string[]>(userVotedIds);

    const handleUpvote = async (questionId: string) => {
        setLoading(questionId);
        const result = await upvoteQuestion(questionId);

        if (result.success) {
            if (result.action === 'added') {
                setVotedIds([...votedIds, questionId]);
            } else {
                setVotedIds(votedIds.filter((id) => id !== questionId));
            }
            toast.success(result.action === 'added' ? 'Upvoted' : 'Upvote removed');
            window.location.reload(); // Refresh to update counts
        } else {
            toast.error(result.error || 'Failed to upvote');
        }
        setLoading(null);
    };

    const handleDelete = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) {
            return;
        }

        setLoading(questionId);
        const result = await deleteQuestion(questionId);

        if (result.success) {
            toast.success('Question deleted');
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to delete question');
        }
        setLoading(null);
    };

    if (questions.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No questions yet. Be the first to ask!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {questions.map((question) => {
                    const isVoted = votedIds.includes(question.id);

                    return (
                        <Card key={question.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium">{question.user.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(question.createdAt), 'PPp')}
                                            </span>
                                            {question.isAnswered && (
                                                <Badge className="bg-green-500">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Answered
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-base">{question.question}</p>
                                    </div>

                                    {/* Upvote Button */}
                                    <div className="flex flex-col items-center gap-1">
                                        <Button
                                            variant={isVoted ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleUpvote(question.id)}
                                            disabled={loading === question.id}
                                            className="h-auto flex-col gap-1 px-3 py-2"
                                        >
                                            <ThumbsUp className={`h-4 w-4 ${isVoted ? 'fill-current' : ''}`} />
                                            <span className="text-xs font-bold">{question.upvotes}</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Answer */}
                            {question.isAnswered && question.answer && (
                                <CardContent className="border-t bg-muted/30">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Answer:</p>
                                        <p className="text-sm">{question.answer}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Answered {format(new Date(question.answeredAt), 'PPp')}
                                        </p>
                                    </div>
                                </CardContent>
                            )}

                            {/* Admin Actions */}
                            {isAdmin && (
                                <CardContent className="border-t pt-4">
                                    <div className="flex gap-2">
                                        {!question.isAnswered && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAnsweringQuestion(question)}
                                            >
                                                Answer
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500"
                                            onClick={() => handleDelete(question.id)}
                                            disabled={loading === question.id}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Answer Dialog */}
            {answeringQuestion && (
                <AnswerDialog
                    question={answeringQuestion}
                    open={!!answeringQuestion}
                    onOpenChange={(open) => {
                        if (!open) setAnsweringQuestion(null);
                    }}
                />
            )}
        </>
    );
}
