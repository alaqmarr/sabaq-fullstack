import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Users, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export async function MyAdminSabaqs() {
    const session = await auth();
    if (!session?.user) return null;

    const userId = session.user.id;

    // Fetch sabaqs where user is Janab OR assigned Admin
    const sabaqs = await prisma.sabaq.findMany({
        where: {
            OR: [
                { janabId: userId },
                { admins: { some: { userId } } }
            ],
            isActive: true
        } as any,
        include: {
            _count: {
                select: {
                    enrollments: { where: { status: 'APPROVED' } },
                    sessions: { where: { isActive: true } }
                }
            },
            location: true
        }
    }) as any[];

    if (sabaqs.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                My Managed Sabaqs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sabaqs.map((sabaq) => (
                    <Card key={sabaq.id} className="glass hover-lift">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg line-clamp-1" title={sabaq.name}>
                                    {sabaq.name}
                                </CardTitle>
                                {sabaq.janabId === userId && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                        Janab
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">{sabaq.kitaab}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{sabaq._count.enrollments} Enrolled</span>
                                    </div>
                                    {sabaq._count.sessions > 0 && (
                                        <Badge variant="outline" className="animate-pulse border-green-500/50 text-green-600">
                                            {sabaq._count.sessions} Active Session
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href={`/dashboard/sabaqs/${sabaq.id}`}>
                                            Manage
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" className="w-full">
                                        <Link href={`/dashboard/sessions?sabaqId=${sabaq.id}`}>
                                            Sessions
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
