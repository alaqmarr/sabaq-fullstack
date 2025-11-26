import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { checkPermission } from '@/lib/rbac';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Calendar, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';

export default async function QuestionsPage() {
    const session = await auth();

    if (!session?.user) redirect('/login');

    const canRead = await checkPermission(session.user.id, 'questions', 'read');
    const canReadSelf = await checkPermission(session.user.id, 'questions', 'read_self');

    if (!canRead && !canReadSelf) {
        redirect('/unauthorized?reason=You do not have permission to view questions.');
    }

    const isAdmin = ['SUPERADMIN', 'ADMIN', 'JANAB'].includes(session.user.role);

    // Get recent sessions with questions
    const sessionsWithQuestions = await prisma.session.findMany({
        where: {
            questions: {
                some: {},
            },
        },
        include: {
            sabaq: {
                select: {
                    name: true,
                    kitaab: true,
                    level: true,
                },
            },
            _count: {
                select: {
                    questions: true,
                },
            },
            questions: {
                select: {
                    id: true,
                    isAnswered: true,
                },
            },
        },
        orderBy: {
            scheduledAt: 'desc',
        },
        take: 20,
    });

    const sessionsWithData = sessionsWithQuestions.map((sess) => ({
        ...sess,
        unansweredCount: sess.questions.filter((q) => !q.isAnswered).length,
        answeredCount: sess.questions.filter((q) => q.isAnswered).length,
    }));

    // Filter sessions
    const unansweredSessions = sessionsWithData.filter((s) => s.unansweredCount > 0);
    const recentSessions = sessionsWithData;

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Questions</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    {isAdmin ? 'Answer questions from sabaq sessions' : 'View and upvote questions from sessions'}
                </p>
            </div>

            <Tabs defaultValue="unanswered" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="unanswered">
                        Unanswered ({unansweredSessions.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">All Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="unanswered" className="space-y-4 mt-4">
                    {unansweredSessions.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                <p className="text-muted-foreground">All questions answered!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {unansweredSessions.map((sess) => (
                                <Link key={sess.id} href={`/dashboard/sessions/${sess.id}#questions`}>
                                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                                        <CardContent className="pt-6 space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-base">{sess.sabaq.name}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {sess.sabaq.kitaab} - Nisaab {sess.sabaq.level}
                                                </p>
                                            </div>

                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(new Date(sess.scheduledAt), 'PPP')}
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="destructive" className="text-xs">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {sess.unansweredCount} pending
                                                    </Badge>
                                                    {sess.answeredCount > 0 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            {sess.answeredCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4 mt-4">
                    {recentSessions.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No questions yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            {recentSessions.map((sess) => (
                                <Link key={sess.id} href={`/dashboard/sessions/${sess.id}#questions`}>
                                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                                        <CardContent className="pt-6 space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-base">{sess.sabaq.name}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {sess.sabaq.kitaab} - Nisaab {sess.sabaq.level}
                                                </p>
                                            </div>

                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(new Date(sess.scheduledAt), 'PPP')}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <MessageCircle className="h-4 w-4" />
                                                <span className="text-sm font-medium">{sess._count.questions} questions</span>
                                                {sess.unansweredCount === 0 && sess._count.questions > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        All answered
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
