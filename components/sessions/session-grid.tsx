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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                    <Card key={session.id} className="glass-premium group relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 border-0 p-1">
                        <Link href={`/dashboard/sessions/${session.id}`} className="absolute inset-0 z-0" />
                        <CardHeader className="pb-3 pt-6 px-6 relative z-10 pointer-events-none">
                            <div className="flex justify-between items-start gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <CardTitle className="text-xl font-bold leading-tight line-clamp-1 pointer-events-auto text-balance">
                                        {session.sabaq?.name || 'Unknown'}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-sm font-medium">
                                        <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0">
                                            <BookOpen className="h-3 w-3" />
                                        </div>
                                        <span className="truncate">{session.sabaq?.kitaab}</span>
                                    </CardDescription>
                                </div>
                                <div className="shrink-0">
                                    {getStatusBadge(session)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-6 px-6 space-y-3 text-sm relative z-10 pointer-events-none">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="p-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-foreground/80">
                                    {format(new Date(session.scheduledAt), 'EEE, dd MMM yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-foreground/80">
                                    {format(new Date(session.scheduledAt), 'HH:mm')}
                                    <span className="mx-2 text-muted-foreground/50">•</span>
                                    Cutoff: {format(new Date(session.cutoffTime), 'HH:mm')}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="p-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                                    <Users className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-foreground/80">
                                    {session._count?.attendances || 0} Attendees
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 px-6 pb-6 flex flex-col gap-2 relative z-20 pointer-events-auto">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                asChild
                            >
                                <Link href={`/dashboard/sessions/${session.id}`}>
                                    <BookOpen className="h-4 w-4 mr-2" /> View Details
                                </Link>
                            </Button>

                            {!session.startedAt && (
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 hover:bg-background/50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setEditingSession(session);
                                            setIsDialogOpen(true);
                                        }}
                                        disabled={loading === session.id}
                                    >
                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleDelete(session.id);
                                        }}
                                        disabled={loading === session.id}
                                    >
                                        <Trash className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                </div>
                            )}

                            {!session.startedAt && !session.isActive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full glass-success border-0 hover:bg-green-500/20 text-green-700 dark:text-green-400"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleStart(session.id);
                                    }}
                                    disabled={loading === session.id}
                                >
                                    <Play className="h-4 w-4 mr-2" /> Start Session
                                </Button>
                            )}

                            {session.isActive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full glass-warning border-0 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleEnd(session.id);
                                    }}
                                    disabled={loading === session.id}
                                >
                                    <StopCircle className="h-4 w-4 mr-2" /> End Session
                                </Button>
                            )}

                            {session.endedAt && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full glass-info border-0 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (confirm('Are you sure you want to resume this session?')) {
                                            setLoading(session.id);
                                            const { resumeSession } = await import('@/actions/sessions');
                                            const result = await resumeSession(session.id);
                                            if (result.success) {
                                                toast.success('Session resumed');
                                            } else {
                                                toast.error(result.error || 'Failed to resume session');
                                            }
                                            setLoading(null);
                                        }
                                    }}
                                    disabled={loading === session.id}
                                >
                                    <Play className="h-4 w-4 mr-2" /> Resume Session
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
