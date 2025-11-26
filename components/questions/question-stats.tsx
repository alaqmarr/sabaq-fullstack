'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface QuestionStatsProps {
    stats: {
        totalQuestions: number;
        answeredCount: number;
        pendingCount: number;
        mostUpvoted: any;
    };
}

export function QuestionStats({ stats }: QuestionStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                    <p className="text-xs text-muted-foreground">
                        Submitted by students
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Answered</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.answeredCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.totalQuestions > 0
                            ? Math.round((stats.answeredCount / stats.totalQuestions) * 100)
                            : 0}% completion rate
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Awaiting answers
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.mostUpvoted ? stats.mostUpvoted.upvotes : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Highest upvotes
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
