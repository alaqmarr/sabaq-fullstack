'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Search, UserPlus, Loader2 } from 'lucide-react';
import { markAttendanceManualDirect } from '@/actions/attendance';
import { toast } from 'sonner';

interface EnrolledUser {
    id: string;
    name: string | null;
    itsNumber: string;
    email: string | null;
    hasAttended: boolean;
}

interface ManualAttendanceClientProps {
    sessionId: string;
    sabaqName: string;
    sabaqId: string;
    scheduledAt: string;
    enrolledUsers: EnrolledUser[];
}

export function ManualAttendanceClient({
    sessionId,
    sabaqName,
    sabaqId,
    scheduledAt,
    enrolledUsers,
}: ManualAttendanceClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState<string | null>(null);
    const [markedUsers, setMarkedUsers] = useState<Set<string>>(
        new Set(enrolledUsers.filter(u => u.hasAttended).map(u => u.id))
    );

    const filteredUsers = enrolledUsers.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.itsNumber.includes(search)
    );

    const handleMarkAttendance = async (user: EnrolledUser) => {
        if (markedUsers.has(user.id)) {
            toast.info(`${user.name} is already marked present`);
            return;
        }

        setLoading(user.id);
        try {
            const result = await markAttendanceManualDirect({
                sessionId,
                userId: user.id,
                sabaqId,
                scheduledAt: new Date(scheduledAt),
            });

            if (result.success) {
                setMarkedUsers(prev => new Set([...prev, user.id]));
                toast.success(`Marked ${user.name} as present`);
            } else {
                toast.error(result.error || 'Failed to mark attendance');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(null);
        }
    };

    const presentCount = markedUsers.size;
    const totalCount = enrolledUsers.length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold text-green-600">{presentCount}</div>
                        <div className="text-sm text-muted-foreground">Marked Present</div>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold">{totalCount - presentCount}</div>
                        <div className="text-sm text-muted-foreground">Remaining</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or ITS..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* User List */}
            <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No students found matching "{search}"
                        </CardContent>
                    </Card>
                ) : (
                    filteredUsers.map((user) => {
                        const isMarked = markedUsers.has(user.id);
                        const isLoading = loading === user.id;

                        return (
                            <Card
                                key={user.id}
                                className={`glass transition-all ${isMarked ? 'border-green-500/50 bg-green-500/5' : ''}`}
                            >
                                <CardContent className="py-4 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{user.name || 'Unknown'}</div>
                                        <div className="text-sm text-muted-foreground">{user.itsNumber}</div>
                                    </div>

                                    {isMarked ? (
                                        <Badge variant="frosted-green" className="flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Present
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="frosted-green"
                                            onClick={() => handleMarkAttendance(user)}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Mark Present
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
