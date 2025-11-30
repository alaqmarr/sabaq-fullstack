'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircleQuestion, ThumbsUp, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Question {
    id: string;
    question: string;
    answer?: string | null;
    createdAt: Date;
    sessionId: string;
    session: {
        sabaq: {
            name: string;
            kitaab: string;
            level: string;
        };
    };
    _count: {
        votes: number;
    };
}

interface MyQuestionsListProps {
    questions: Question[];
}

export function MyQuestionsList({ questions }: MyQuestionsListProps) {
    if (questions.length === 0) {
        return (
            <Card className="glass-panel border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted/50 p-4 mb-4">
                        <MessageCircleQuestion className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No Questions Yet</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        You haven't asked any questions in your sabaq sessions yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {questions.map((question) => (
                <Card key={question.id} className="glass-card hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {question.session.sabaq.name}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <CardTitle className="text-base font-medium leading-relaxed">
                                    {question.question}
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                <ThumbsUp className="h-3 w-3" />
                                <span className="text-xs font-medium">{question._count.votes}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {question.answer ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-2">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-sm font-semibold">Answer</span>
                                </div>
                                <p className="text-sm text-foreground/90 leading-relaxed">
                                    {question.answer}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                                <Clock className="h-4 w-4" />
                                <span>Waiting for answer...</span>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <Link href={`/dashboard/sessions/${question.sessionId}`}>
                                <Button variant="ghost" size="sm" className="text-xs">
                                    View Session
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
