import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, MessageCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewCardsProps {
    stats: {
        totalUsers: number;
        activeSabaqs: number;
        totalEnrollments: number;
        totalSessions: number;
        pendingQuestions: number;
    };
}

export function OverviewCards({ stats }: OverviewCardsProps) {
    const cards = [
        {
            title: 'Total Mumineen',
            value: stats.totalUsers,
            description: 'Registered users',
            icon: Users,
            iconBg: 'bg-primary/10',
        },
        {
            title: 'Active Sabaqs',
            value: stats.activeSabaqs,
            description: 'Total sabaqs',
            icon: BookOpen,
            iconBg: 'bg-blue-500/10',
        },
        {
            title: 'Total Enrollments',
            value: stats.totalEnrollments,
            description: 'Approved enrollments',
            icon: UserCheck,
            iconBg: 'bg-green-500/10',
        },
        {
            title: 'Pending Questions',
            value: stats.pendingQuestions,
            description: 'Unanswered questions',
            icon: MessageCircle,
            iconBg: 'bg-orange-500/10',
        },
    ];

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {card.title}
                        </CardTitle>
                        <div className={cn("p-2 rounded-full", card.iconBg)}>
                            <card.icon className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
