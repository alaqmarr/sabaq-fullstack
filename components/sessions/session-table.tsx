'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash, Play, StopCircle } from 'lucide-react';
import { SessionDialog } from './session-dialog';
import { deleteSession, startSession, endSession } from '@/actions/sessions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface SessionTableProps {
    sessions: any[];
    sabaqs: any[];
}

export function SessionTable({ sessions, sabaqs }: SessionTableProps) {
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
            return <Badge className="bg-green-500">Active</Badge>;
        } else if (session.endedAt) {
            return <Badge variant="secondary">Ended</Badge>;
        } else if (session.startedAt) {
            return <Badge variant="outline">Started</Badge>;
        } else {
            return <Badge variant="outline">Scheduled</Badge>;
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sabaq</TableHead>
                            <TableHead>Scheduled At</TableHead>
                            <TableHead>Cutoff Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Attendance</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell>
                                    <Link
                                        href={`/dashboard/sessions/${session.id}`}
                                        className="font-medium hover:underline"
                                    >
                                        {session.sabaq?.name || 'Unknown'}
                                    </Link>
                                    <div className="text-xs text-muted-foreground">
                                        {session.sabaq?.kitaab}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {format(new Date(session.scheduledAt), 'dd/MM/yy HH:mm')}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(session.cutoffTime), 'HH:mm')}
                                </TableCell>
                                <TableCell>{getStatusBadge(session)}</TableCell>
                                <TableCell>{session._count?.attendances || 0}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {!session.startedAt && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingSession(session);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    disabled={loading === session.id}
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500"
                                                    onClick={() => handleDelete(session.id)}
                                                    disabled={loading === session.id}
                                                    title="Delete"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        {!session.startedAt && !session.isActive && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-green-600"
                                                onClick={() => handleStart(session.id)}
                                                disabled={loading === session.id}
                                                title="Start Session"
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {session.isActive && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-orange-600"
                                                onClick={() => handleEnd(session.id)}
                                                disabled={loading === session.id}
                                                title="End Session"
                                            >
                                                <StopCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sessions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    No sessions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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
