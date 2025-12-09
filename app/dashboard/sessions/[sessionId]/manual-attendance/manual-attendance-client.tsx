import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Search, UserPlus, Loader2, AlertTriangle, User } from 'lucide-react';
import { markAttendanceManualDirect } from '@/actions/attendance';
import { lookupUserForAttendance } from '@/actions/users';
import { directEnrollUser } from '@/actions/enrollments';
import { toast } from 'sonner';

interface EnrolledUser {
    id: string;
    name: string | null;
    itsNumber: string;
    email: string | null;
    hasAttended: boolean;
}

interface PendingRequest {
    id: string;
    userId: string;
    name: string | null;
    itsNumber: string;
    email: string | null;
}

interface ManualAttendanceClientProps {
    sessionId: string;
    sabaqName: string;
    sabaqId: string;
    scheduledAt: string;
    enrolledUsers: EnrolledUser[];
    pendingRequests: PendingRequest[];
}

export function ManualAttendanceClient({
    sessionId,
    sabaqName,
    sabaqId,
    scheduledAt,
    enrolledUsers,
    pendingRequests,
}: ManualAttendanceClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState<string | null>(null);
    const [markedUsers, setMarkedUsers] = useState<Set<string>>(
        new Set(enrolledUsers.filter(u => u.hasAttended).map(u => u.id))
    );
    const [localEnrolled, setLocalEnrolled] = useState<EnrolledUser[]>(enrolledUsers);
    const [localPending, setLocalPending] = useState<PendingRequest[]>(pendingRequests);

    // Global Search State
    const [isGlobalSearching, setIsGlobalSearching] = useState(false);
    const [globalUser, setGlobalUser] = useState<{ id: string; name: string; its: string; enrollmentStatus: string | null; enrollmentId: string | null } | null>(null);

    const filteredUsers = localEnrolled.filter(user =>
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

    const handleSearch = async (val: string) => {
        setSearch(val);
        setGlobalUser(null);

        // If 8 digits and not found in local filtering, try global lookup
        const inLocal = localEnrolled.some(u => u.itsNumber === val);
        if (val.length === 8 && !inLocal) {
            setIsGlobalSearching(true);
            try {
                const result = await lookupUserForAttendance(val, sabaqId);
                if (result.success && result.user) {
                    setGlobalUser({
                        id: result.user.id,
                        name: result.user.name,
                        its: result.user.itsNumber,
                        enrollmentStatus: result.user.enrollmentStatus,
                        enrollmentId: result.user.enrollmentId
                    });
                }
            } finally {
                setIsGlobalSearching(false);
            }
        }
    };

    const handleApproveEnrollment = async (userId: string, enrollmentId?: string) => {
        setLoading(userId);
        try {
            // Direct enroll (works for Pending requests too if we use directEnrollUser implementation which uses upsert)
            // Or use bulkApprove if we had ID. 
            // directEnrollUser handles "approve pending" effectively because of Upsert logic we added?
            // Wait, upsert creates/updates to APPROVED. Yes.
            const result = await directEnrollUser(sabaqId, userId);

            if (result.success && result.enrollment) {
                toast.success("User enrolled!");

                // Move from pending/global to localEnrolled
                const newUser: EnrolledUser = {
                    id: userId,
                    name: result.enrollment.user.name,
                    itsNumber: result.enrollment.user.itsNumber,
                    email: result.enrollment.user.email,
                    hasAttended: false
                };

                setLocalEnrolled(prev => [...prev, newUser]);
                setLocalPending(prev => prev.filter(p => p.userId !== userId)); // Remove from pending if there
                setGlobalUser(null);
                setSearch('');

                // Mark attendance immediately? Protocol says "Enroll & Mark" usually convenient
                // Let's ask user? Or just trigger mark attendance
                await handleMarkAttendance(newUser);
            } else {
                toast.error(result.error);
            }
        } catch (e) {
            toast.error("Failed to enroll");
        } finally {
            setLoading(null);
        }
    };

    const presentCount = markedUsers.size;
    const totalCount = localEnrolled.length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Pending Requests Section */}
            {localPending.length > 0 && (
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                            <AlertTriangle className="h-5 w-5" />
                            Pending Enrollment Requests ({localPending.length})
                        </CardTitle>
                        <CardDescription>
                            These users have requested to join this Sabaq.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {localPending.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                                <div>
                                    <div className="font-medium">{req.name}</div>
                                    <div className="text-sm text-muted-foreground">{req.itsNumber}</div>
                                </div>
                                <Button size="sm" onClick={() => handleApproveEnrollment(req.userId, req.id)} disabled={loading === req.userId}>
                                    {loading === req.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                    Approve & Mark Present
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

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
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 h-12 text-lg"
                />
                {isGlobalSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Unregistered User Found via Search */}
            {globalUser && !localEnrolled.some(u => u.id === globalUser.id) && (
                <Card className="border-primary/20 bg-primary/5 animate-in zoom-in-95">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-medium">{globalUser.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    {globalUser.its}
                                    <Badge variant="outline" className="text-xs">Not Enrolled</Badge>
                                </div>
                            </div>
                        </div>
                        <Button onClick={() => handleApproveEnrollment(globalUser.id)} disabled={loading === globalUser.id}>
                            {loading === globalUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Enroll & Mark
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* User List */}
            <div className="space-y-2">
                {filteredUsers.length === 0 && !globalUser ? (
                    <Card className="glass">
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {search ? `No enrolled students found matching "${search}"` : "Start typing to search..."}
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
