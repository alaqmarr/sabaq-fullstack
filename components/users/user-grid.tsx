'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Calendar, Hash, User, ArrowUp, ArrowDown, Lock, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';
import { UserDialog } from './user-dialog';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

interface UserGridProps {
    users: any[];
}

export function UserGrid({ users }: UserGridProps) {
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    const handlePromote = async (userId: string) => {
        if (!confirm('Are you sure you want to promote this user?')) return;

        setLoading(userId);
        try {
            const { promoteUser } = await import('@/actions/users');
            const result = await promoteUser(userId);
            if (result.success) {
                toast.success(`User promoted to ${result.newRole}`);
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to promote user');
            }
        } catch (error) {
            toast.error('Failed to promote user');
        }
        setLoading(null);
    };

    const handleDemote = async (userId: string) => {
        if (!confirm('Are you sure you want to demote this user?')) return;

        setLoading(userId);
        try {
            const { demoteUser } = await import('@/actions/users');
            const result = await demoteUser(userId);
            if (result.success) {
                toast.success(`User demoted to ${result.newRole}`);
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to demote user');
            }
        } catch (error) {
            toast.error('Failed to demote user');
        }
        setLoading(null);
    };

    if (users.length === 0) {
        return (
            <div className="text-center py-12 glass rounded-xl border border-dashed">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <User className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                    <div className="mt-6">
                        <Link href="/dashboard/users?action=new">
                            <Button variant="frosted-blue" className="gap-2">
                                <User className="h-4 w-4" />
                                Add User
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {users.map((user) => {
                    const isJanab = user.role === 'JANAB';
                    const isSuperAdmin = user.role === 'SUPERADMIN';
                    const isMumin = user.role === 'MUMIN';
                    const isPromoting = loading === user.id;

                    // Determine assigned function/sabaq
                    let assignedFunction = null;
                    if (isJanab && user.managedSabaqs?.length > 0) {
                        assignedFunction = `Janab for ${user.managedSabaqs[0].name}`;
                        if (user.managedSabaqs.length > 1) assignedFunction += ` +${user.managedSabaqs.length - 1} more`;
                    } else if (user.assignedSabaqs?.length > 0) {
                        assignedFunction = `Assigned to ${user.assignedSabaqs[0].sabaq.name}`;
                        if (user.assignedSabaqs.length > 1) assignedFunction += ` +${user.assignedSabaqs.length - 1} more`;
                    }

                    return (
                        <div key={user.id}>
                            <Card className="glass-premium hover-lift group relative overflow-hidden border-0 p-1 h-full">
                                <Link href={`/dashboard/users/${user.id}`} className="absolute inset-0 z-0" />
                                <CardHeader className="pb-3 pt-6 pl-6 pr-6 relative z-10 pointer-events-none">
                                    <div className="flex justify-between items-start gap-3">
                                        <CardTitle className="text-lg font-bold leading-tight line-clamp-1 pointer-events-auto text-balance" title={user.name}>
                                            {user.name}
                                        </CardTitle>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur-sm">
                                            {user.itsNumber}
                                        </Badge>
                                        <Badge
                                            variant={
                                                user.role === 'SUPERADMIN' ? 'frosted-purple' :
                                                    user.role === 'ADMIN' ? 'frosted-blue' :
                                                        user.role === 'MANAGER' ? 'frosted-amber' :
                                                            user.role === 'JANAB' ? 'frosted-green' :
                                                                user.role === 'ATTENDANCE_INCHARGE' ? 'frosted-teal' :
                                                                    'frosted-slate'
                                            }
                                            className="text-xs border-0"
                                        >
                                            {user.role}
                                        </Badge>
                                    </div>
                                    {assignedFunction && (
                                        <div className="mt-2 text-xs font-medium text-primary/80 lowercase truncate">
                                            {assignedFunction}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3 px-6 pb-6 text-sm relative z-10 pointer-events-none">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                                            <Mail className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="truncate font-medium text-foreground/80 lowercase" title={user.email || 'no email'}>
                                            {user.email || 'no email'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="p-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                                            <Calendar className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="font-medium text-foreground/80 lowercase">
                                            added {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </CardContent>
                                <div className="px-6 pb-6 pt-0 flex flex-wrap items-center justify-center gap-2 pointer-events-auto relative z-20">
                                    {!isJanab && (
                                        <>
                                            {!isSuperAdmin && (
                                                <Button
                                                    variant="frosted-green"
                                                    size="sm"
                                                    className="h-8 px-3 gap-1.5 transition-all duration-200 flex-1 min-w-[90px]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        if (['30800976', '50458248'].includes(user.itsNumber)) {
                                                            toast.error("This user's role cannot be changed.");
                                                            return;
                                                        }
                                                        handlePromote(user.id);
                                                    }}
                                                    disabled={loading !== null || ['30800976', '50458248'].includes(user.itsNumber)}
                                                    title={['30800976', '50458248'].includes(user.itsNumber) ? "Role change restricted" : "Promote"}
                                                >
                                                    {loading === user.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : ['30800976', '50458248'].includes(user.itsNumber) ? (
                                                        <Lock className="h-3.5 w-3.5 opacity-70" />
                                                    ) : (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    )}
                                                    <span>promote</span>
                                                </Button>
                                            )}
                                            {!isMumin && (
                                                <Button
                                                    variant="frosted-red"
                                                    size="sm"
                                                    className="h-8 px-3 gap-1.5 transition-all duration-200 flex-1 min-w-[90px]"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        if (['30800976', '50458248'].includes(user.itsNumber)) {
                                                            toast.error("This user's role cannot be changed.");
                                                            return;
                                                        }
                                                        handleDemote(user.id);
                                                    }}
                                                    disabled={loading !== null || ['30800976', '50458248'].includes(user.itsNumber)}
                                                    title={['30800976', '50458248'].includes(user.itsNumber) ? "Role change restricted" : "Demote"}
                                                >
                                                    {loading === user.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : ['30800976', '50458248'].includes(user.itsNumber) ? (
                                                        <Lock className="h-3.5 w-3.5 opacity-70" />
                                                    ) : (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    )}
                                                    <span>demote</span>
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    <Button
                                        variant="frosted-blue"
                                        size="sm"
                                        className="h-8 px-3 gap-1.5 flex-1 min-w-[80px]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setEditingUser(user);
                                            setIsDialogOpen(true);
                                        }}
                                        disabled={loading !== null}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        <span>edit</span>
                                    </Button>
                                    {user.phone ? (
                                        <Link
                                            href={`https://wa.me/${user.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 min-w-[80px]"
                                        >
                                            <Button
                                                variant="frosted-green"
                                                size="sm"
                                                className="h-8 px-3 gap-1.5 w-full"
                                                title="Contact on WhatsApp"
                                                disabled={loading !== null}
                                            >
                                                <WhatsAppIcon className="h-3.5 w-3.5" />
                                                <span>chat</span>
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button
                                            variant="frosted-green"
                                            size="sm"
                                            className="h-8 px-3 gap-1.5 opacity-50 cursor-not-allowed flex-1 min-w-[80px]"
                                            disabled
                                            title="No phone number available"
                                        >
                                            <WhatsAppIcon className="h-3.5 w-3.5" />
                                            <span>chat</span>
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {editingUser && (
                <UserDialog
                    user={editingUser}
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingUser(null);
                    }}
                />
            )}
        </>
    );
}
