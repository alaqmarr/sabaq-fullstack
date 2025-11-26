'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, Play, StopCircle, Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { SessionDialog } from './session-dialog';
import { deleteSession, startSession, endSession } from '@/actions/sessions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

interface SessionGridProps {
    sessions: any[];
    sabaqs: any[];
}

export function SessionGrid({ sessions, sabaqs }: SessionGridProps) {
    const [editingSession, setEditingSession] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this session?')) {
            setLoading(id);
            const result = await deleteSession(id);
            if (result.success) {
                toast.success('Session deleted');
            } else {
                toast.error(result.error || 'Failed to delete session');
            }
            setLoading(null);
        }
    };

    const handleStart = async (id: string) => {
        setLoading(id);
        const result = await startSession(id);
        if (result.success) {
            toast.success('Session started');
        } else {
            toast.error(result.error || 'Failed to start session');
        }
        setLoading(null);
    };

    const handleEnd = async (id: string) => {
        if (confirm('Are you sure you want to end this session?')) {
            setLoading(id);
            const result = await endSession(id);
            if (result.success) {
                toast.success('Session ended');
            } else {
                toast.error(result.error || 'Failed to end session');
            }
            setLoading(null);
        }
    };

    const getStatusBadge = (session: any) => {
        if (session.isActive) {
            return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Active</Badge>;
        } else if (session.endedAt) {
            return <Badge variant="secondary">Ended</Badge>;
        } else if (session.startedAt) {
            return <Badge variant="outline" className="border-blue-500/20 text-blue-500">Started</Badge>;
        } else {
            return <Badge variant="outline">Scheduled</Badge>;
        }
    };

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                No sessions found.
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                    <Card key={session.id} className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="line-clamp-1">
                                        <Link href={`/dashboard/sessions/${session.id}`} className="hover:underline">
                                            {session.sabaq?.name || 'Unknown'}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <BookOpen className="h-3 w-3" />
                                        {session.sabaq?.kitaab}
                                    </CardDescription>
                                </div>
                                {getStatusBadge(session)}
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(session.scheduledAt), 'EEE, dd MMM yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {format(new Date(session.scheduledAt), 'HH:mm')} - Cutoff: {format(new Date(session.cutoffTime), 'HH:mm')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{session._count?.attendances || 0} Attendees</span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!session.startedAt && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingSession(session);
                                            setIsDialogOpen(true);
                                        }}
                                        disabled={loading === session.id}
                                    >
                                        <Edit className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(session.id)}
                                        disabled={loading === session.id}
                                    >
                                        <Trash className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                </>
                            )}
                            {!session.startedAt && !session.isActive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                    onClick={() => handleStart(session.id)}
                                    disabled={loading === session.id}
                                >
                                    <Play className="h-4 w-4 mr-1" /> Start
                                </Button>
                            )}
                            {session.isActive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                    onClick={() => handleEnd(session.id)}
                                    disabled={loading === session.id}
                                >
                                    <StopCircle className="h-4 w-4 mr-1" /> End
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {editingSession && (
                <SessionDialog
                    session={editingSession}
                    sabaqs={sabaqs}
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingSession(null);
                    }}
                />
            )}
        </>
    );
}
