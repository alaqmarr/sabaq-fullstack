'use client';

import { useState, useOptimistic } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, MessageCircle, User } from 'lucide-react';
import { upvoteQuestion } from '@/actions/questions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Question {
    id: string;
    question: string;
    upvotes: number;
    createdAt: Date;
    user: {
        name: string;
        itsNumber: string;
    };
    isAnswered: boolean;
    answer?: string | null;
}

interface QuestionsListProps {
    questions: Question[];
    userVotes: string[]; // Array of question IDs the user has voted for
    currentUserId?: string;
}

export function QuestionsList({ questions, userVotes, currentUserId }: QuestionsListProps) {
    // Optimistic UI for votes
    const [optimisticVotes, addOptimisticVote] = useOptimistic(
        { votes: userVotes, counts: questions.reduce((acc, q) => ({ ...acc, [q.id]: q.upvotes }), {} as Record<string, number>) },
        (state, { questionId, type }: { questionId: string, type: 'add' | 'remove' }) => ({
            votes: type === 'add'
                ? [...state.votes, questionId]
                : state.votes.filter(id => id !== questionId),
            counts: {
                ...state.counts,
                [questionId]: type === 'add'
                    ? (state.counts[questionId] || 0) + 1
                    : Math.max(0, (state.counts[questionId] || 0) - 1)
            }
        })
    );

    const handleUpvote = async (questionId: string) => {
        const isVoted = optimisticVotes.votes.includes(questionId);

        // Optimistic update
        addOptimisticVote({ questionId, type: isVoted ? 'remove' : 'add' });

        try {
            const result = await upvoteQuestion(questionId);
            if (!result.success) {
                toast.error(result.error || 'Failed to vote');
                // Revert optimistic update (by adding the opposite action) - simpler to just let revalidate fix it or refresh
            }
        } catch (error) {
            toast.error('Failed to vote');
        }
    };

    if (questions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No questions asked yet. Be the first!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full max-w-md mx-auto pb-20">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-semibold text-cred-heading">Recent Questions</h3>
                <span className="text-xs text-muted-foreground">{questions.length} questions</span>
            </div>

            {questions.map((q) => {
                const isVoted = optimisticVotes.votes.includes(q.id);
                const voteCount = optimisticVotes.counts[q.id] ?? q.upvotes;
                const isOwnQuestion = currentUserId && q.user.itsNumber === currentUserId; // Assuming currentUserId might be ITS for guests or ID for users, logic might need adjustment based on how we pass currentUserId. 
                // Actually, let's rely on the passed prop. If it's not passed, we can't highlight.

                return (
                    <Card key={q.id} className={cn(
                        "glass-subtle transition-all duration-200",
                        isAnswered(q) ? "border-green-500/20 bg-green-500/5" : "border-white/10"
                    )}>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            Anonymous
                                        </span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>
                                <Button
                                    variant={isVoted ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-auto py-1.5 px-2.5 flex flex-col gap-0.5 min-w-[3rem]",
                                        isVoted && "bg-primary/10 text-primary hover:bg-primary/20"
                                    )}
                                    onClick={() => handleUpvote(q.id)}
                                >
                                    <ThumbsUp className={cn("h-4 w-4", isVoted && "fill-current")} />
                                    <span className="text-xs font-bold">{voteCount}</span>
                                </Button>
                            </div>

                            {q.isAnswered && q.answer && (
                                <div className="mt-3 pt-3 border-t border-border/50 bg-green-500/5 -mx-4 -mb-4 px-4 py-3">
                                    <p className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
                                        <MessageCircle className="h-3 w-3" />
                                        Answered
                                    </p>
                                    <p className="text-sm text-foreground/90">{q.answer}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function isAnswered(q: Question) {
    return q.isAnswered;
}
