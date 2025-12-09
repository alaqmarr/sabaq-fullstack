'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    MapPin,
    Clock,
    QrCode,
    ClipboardCheck,
    Eye,
    MessageCircleQuestion,
    BookOpen,
    User
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/date-utils';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface DashboardSessionListProps {
    sessions: any[];
    type: 'active' | 'upcoming';
    emptyMessage?: string;
}

export function DashboardSessionList({ sessions, type, emptyMessage = "No sessions found" }: DashboardSessionListProps) {
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 glass rounded-xl border border-dashed">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    const canManage = (sabaq: any) => {
        if (!userRole) return false;
        if (userRole === 'SUPERADMIN') return true;
        if (['ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE'].includes(userRole)) {
            // In a real app we'd check specific assignment here, but for UI display 
            // we rely on the server filtering the list to only show what they can see/manage.
            // However, strictly speaking, 'managing' actions might need stricter checks.
            // For now, we assume if it's in the list, they have some relation to it.
            return true;
        }
        if (userRole === 'JANAB' && sabaq.janabId === userId) return true;
        return false;
    };

    const isEnrolled = (sabaq: any) => {
        // This check is tricky on client side without full enrollment data in session object
        // But typically MUMIN role implies enrollment if they see it in their dashboard
        return userRole === 'MUMIN';
    };

    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <div key={session.id}>
                    <Card className="glass-premium overflow-hidden border-0">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                {/* Left Side: Details */}
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-semibold text-cred-heading mb-1">
                                                {session.sabaq.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{session.sabaq.kitaab}</span>
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    {session.sabaq.level}
                                                </Badge>
                                            </div>
                                        </div>
                                        {type === 'active' && (
                                            <Badge variant="frosted-green" className="animate-pulse">
                                                Live Now
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <span>{formatDate(session.scheduledAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span>{formatTime(session.scheduledAt)}</span>
                                        </div>
                                        {session.sabaq.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <span>{session.sabaq.location.name}</span>
                                            </div>
                                        )}
                                        {session.sabaq.janab && (
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-primary" />
                                                <span>{session.sabaq.janab.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Controls */}
                                <div className="bg-muted/30 p-6 flex flex-col justify-center gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-border/50">
                                    {/* Admin/Manager/Janab Controls */}
                                    {canManage(session.sabaq) && (
                                        <>
                                            <Link href={`/dashboard/sessions/${session.id}/scan`} className="w-full">
                                                <Button variant="frosted-blue" className="w-full justify-start gap-2">
                                                    <QrCode className="h-4 w-4" />
                                                    Scan QR
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/sessions/${session.id}/attendance`} className="w-full">
                                                <Button variant="frosted-teal" className="w-full justify-start gap-2">
                                                    <ClipboardCheck className="h-4 w-4" />
                                                    Take Attendance
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/sessions/${session.id}`} className="w-full">
                                                <Button variant="ghost" className="w-full justify-start gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    View Details
                                                </Button>
                                            </Link>
                                        </>
                                    )}

                                    {/* Mumin Controls */}
                                    {isEnrolled(session.sabaq) && session.sabaq.allowLocationAttendance && type === 'active' && (
                                        <Link href={`/dashboard/sessions/${session.id}/attendance`} className="w-full">
                                            <Button variant="frosted-green" className="w-full justify-start gap-2">
                                                <MapPin className="h-4 w-4" />
                                                Mark Attendance
                                            </Button>
                                        </Link>
                                    )}

                                    {/* Common Controls */}
                                    <Link href={`/sessions/${session.id}/ask`} className="w-full">
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <MessageCircleQuestion className="h-4 w-4" />
                                            Ask Question
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
