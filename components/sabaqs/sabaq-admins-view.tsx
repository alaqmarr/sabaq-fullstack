'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash, Users, Shield, Calendar } from 'lucide-react';
import { assignSabaqAdmin, removeSabaqAdmin } from '@/actions/sabaq-admins';
import { toast } from 'sonner';
import { ITSInput } from '@/components/ui/its-input';
import { formatShortDate } from '@/lib/date-utils';

interface Admin {
    id: string;
    userId: string;
    assignedAt: string | Date;
    user: {
        id: string;
        itsNumber: string;
        name: string;
        email?: string | null;
        role: string;
    };
}

interface EligibleAdmin {
    id: string;
    itsNumber: string;
    name: string;
    email?: string | null;
    role: string;
}

interface SabaqAdminsViewProps {
    sabaqId: string;
    sabaqName: string;
    currentAdmins: Admin[];
    eligibleAdmins: EligibleAdmin[];
}

export function SabaqAdminsView({ sabaqId, sabaqName, currentAdmins, eligibleAdmins }: SabaqAdminsViewProps) {
    const [admins, setAdmins] = useState<Admin[]>(currentAdmins);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedIts, setSelectedIts] = useState('');

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        setLoading(true);
        try {
            await assignSabaqAdmin(sabaqId, selectedUserId);
            toast.success('Admin assigned successfully');
            setSelectedUserId('');
            setSelectedIts('');
            // Reload page to refresh data
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign admin');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to remove ${userName} as admin?`)) {
            return;
        }

        setLoading(true);
        try {
            await removeSabaqAdmin(sabaqId, userId);
            toast.success('Admin removed successfully');
            setAdmins(admins.filter(a => a.userId !== userId));
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove admin');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAssign = async (userId: string, userName: string) => {
        setLoading(true);
        try {
            await assignSabaqAdmin(sabaqId, userId);
            toast.success(`${userName} assigned as admin`);
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign admin');
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'MANAGER':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'ATTENDANCE_INCHARGE':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Assign New Admin Card */}
            <Card className="glass-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Assign New Admin
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <ITSInput
                                value={selectedIts}
                                onChange={setSelectedIts}
                                onUserFound={(user) => {
                                    if (user) {
                                        // Check if user is already an admin
                                        if (admins.some(a => a.userId === user.id)) {
                                            toast.error('This user is already an admin');
                                            setSelectedUserId('');
                                            return;
                                        }
                                        // Check if user has eligible role
                                        if (!['ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE'].includes(user.role)) {
                                            toast.error('User must have ADMIN, MANAGER, or ATTENDANCE_INCHARGE role');
                                            setSelectedUserId('');
                                            return;
                                        }
                                        setSelectedUserId(user.id);
                                    } else {
                                        setSelectedUserId('');
                                    }
                                }}
                                placeholder="Enter Admin ITS Number"
                            />
                        </div>
                        <Button
                            onClick={handleAssign}
                            disabled={loading || !selectedUserId}
                            className="w-full sm:w-auto"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Admin
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Only users with ADMIN, MANAGER, or ATTENDANCE_INCHARGE roles can be assigned as sabaq admins.
                    </p>
                </CardContent>
            </Card>

            {/* Current Admins */}
            <Card className="glass-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Current Admins ({admins.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No admins assigned yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Use the form above to assign administrators.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {admins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium truncate">{admin.user.name}</span>
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                            <span className="font-mono">{admin.user.itsNumber}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                            <Badge className={`${getRoleBadgeColor(admin.user.role)} text-[10px] font-semibold px-1.5 py-0.5`}>
                                                {admin.user.role}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatShortDate(admin.assignedAt)}
                                            </span>
                                        </div>
                                        {admin.user.email && (
                                            <span className="text-xs text-muted-foreground mt-1 truncate">
                                                {admin.user.email}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
                                        onClick={() => handleRemove(admin.userId, admin.user.name)}
                                        disabled={loading}
                                    >
                                        <Trash className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Eligible Admins Info */}
            <Card className="glass-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Available Users ({eligibleAdmins.filter(e => !admins.some(a => a.userId === e.id)).length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                        Click the + button to quickly assign an admin:
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {eligibleAdmins
                            .filter(e => !admins.some(a => a.userId === e.id))
                            .map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-2 p-2 rounded border text-sm overflow-hidden"
                                >
                                    {/* User Info */}
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <span className="font-medium truncate block max-w-full">{user.name}</span>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className="font-mono shrink-0">{user.itsNumber}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                                            <Badge className={`${getRoleBadgeColor(user.role)} text-[10px] shrink-0`}>
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </div>
                                    {/* Quick Add Button - Right Side with Background */}
                                    <Button
                                        variant="default"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleQuickAssign(user.id, user.name)}
                                        disabled={loading}
                                        title={`Add ${user.name} as admin`}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
