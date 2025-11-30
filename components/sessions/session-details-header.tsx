'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { SessionDialog } from './session-dialog';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { SessionControls } from './session-controls';
import { deleteSession } from '@/actions/sessions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SessionDetailsHeaderProps {
    session: any;
    isAdmin: boolean;
}

export function SessionDetailsHeader({ session, isAdmin }: SessionDetailsHeaderProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteSession(session.id);
            if (result.success) {
                toast.success('Session deleted successfully');
                router.push(`/dashboard/sabaqs/${session.sabaqId}/sessions`);
            } else {
                toast.error(result.error || 'Failed to delete session');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusBadge = () => {
        if (session.isActive) {
            return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
        } else if (session.endedAt) {
            return <Badge variant="secondary">Ended</Badge>;
        } else {
            return <Badge variant="outline">Scheduled</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Link href={`/dashboard/sabaqs/${session.sabaqId}/sessions`} className="hover:text-foreground transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sessions
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-cred-heading">
                            {format(new Date(session.scheduledAt), 'PPP')}
                        </h1>
                        {getStatusBadge()}
                    </div>
                    <p className="text-muted-foreground">
                        {session.sabaq.name} • {format(new Date(session.scheduledAt), 'p')}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <SessionControls
                            sessionId={session.id}
                            isActive={session.isActive}
                            isEnded={!!session.endedAt}
                            hasStarted={!!session.startedAt}
                        />

                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => setIsEditOpen(true)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete this session and all associated attendance records. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            {isAdmin && (
                <SessionDialog
                    sabaqId={session.sabaqId}
                    session={session}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                />
            )}
        </div>
    );
}
